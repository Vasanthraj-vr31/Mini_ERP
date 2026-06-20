<?php

namespace App\Console\Commands;

use App\Models\AiAlert;
use App\Models\Product;
use App\Models\SaleOrderLine;
use App\Models\StockLedger;
use App\Models\VendorScore;
use App\Models\PurchaseOrderLine;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RunForecast extends Command
{
    protected $signature   = 'erp:run-forecast';
    protected $description = 'Run demand forecast (Alg 3) and vendor scoring (Alg 4), generate Smart Alerts';

    public function handle(): int
    {
        $this->info('Running demand forecast and vendor scoring...');

        $products = Product::all();
        $alertsCreated = 0;

        foreach ($products as $product) {
            $alertsCreated += $this->runDemandForecast($product);
        }

        $this->runVendorScoring();

        $this->info("Forecast complete. {$alertsCreated} alert(s) generated.");
        return self::SUCCESS;
    }

    /**
     * Algorithm 3: Demand Forecast
     * Uses moving average slope + safety stock to compute a dynamic reorder point.
     * Raises a stockout_risk alert if projected stock < reorder_point within lead time.
     */
    private function runDemandForecast(Product $product): int
    {
        // Pull the last 90 days of outbound ledger entries
        $ledger = StockLedger::where('product_id', $product->id)
            ->where('delta', '<', 0)
            ->where('created_at', '>=', now()->subDays(90))
            ->selectRaw('DATE(created_at) as date, SUM(ABS(delta)) as daily_out')
            ->groupByRaw('DATE(created_at)')
            ->orderByRaw('DATE(created_at) ASC')
            ->pluck('daily_out', 'date')
            ->map(fn ($v) => (float)$v)
            ->toArray();

        if (count($ledger) < 7) return 0;

        $values      = array_values($ledger);
        $windowSize  = min(14, count($values));
        $recentSlice = array_slice($values, -$windowSize);

        $movingAvg = array_sum($recentSlice) / $windowSize;

        // Slope: linear trend over the window
        $slope = $this->linearSlope($recentSlice);

        $leadDays        = max(1, (int)$product->lead_time_days);
        $safetyStock     = (float)$product->safety_stock;
        $projectedUsage  = ($movingAvg + ($slope * $leadDays)) * $leadDays;
        $dynamicReorder  = $projectedUsage + $safetyStock;

        $freeToUse = max(0, $product->on_hand_qty - $product->reserved_qty);

        // Update reorder point if the dynamic one is meaningfully different
        if (abs($dynamicReorder - $product->reorder_point) > ($product->reorder_point * 0.1)) {
            $product->update(['reorder_point' => round($dynamicReorder, 2)]);
        }

        $alertsCreated = 0;

        if ($freeToUse < $dynamicReorder) {
            $alreadyOpen = AiAlert::where('product_id', $product->id)
                ->where('alert_type', 'stockout_risk')
                ->where('is_resolved', false)
                ->exists();

            if (!$alreadyOpen) {
                AiAlert::create([
                    'product_id'    => $product->id,
                    'alert_type'    => 'stockout_risk',
                    'message'       => "{$product->name}: stock ({$freeToUse} {$product->uom}) below dynamic reorder point (" . round($dynamicReorder, 1) . " {$product->uom})",
                    'reason'        => "Projected {$leadDays}-day usage: " . round($projectedUsage, 1) . " {$product->uom}. Safety stock: {$safetyStock}. Daily average: " . round($movingAvg, 2) . ", trend slope: " . round($slope, 3) . ".",
                    'suggested_qty' => round($dynamicReorder - $freeToUse, 2),
                ]);
                $alertsCreated++;
            }
        }

        // Demand spike: current daily rate > 2x 90-day average
        if (count($values) >= 14) {
            $olderAvg = array_sum(array_slice($values, 0, -7)) / max(1, count($values) - 7);
            if ($olderAvg > 0 && $movingAvg > 2 * $olderAvg) {
                $alreadyOpen = AiAlert::where('product_id', $product->id)
                    ->where('alert_type', 'demand_spike')
                    ->where('is_resolved', false)
                    ->where('created_at', '>=', now()->subDays(7))
                    ->exists();

                if (!$alreadyOpen) {
                    AiAlert::create([
                        'product_id' => $product->id,
                        'alert_type' => 'demand_spike',
                        'message'    => "{$product->name}: demand is " . round($movingAvg / $olderAvg, 1) . "x the 90-day baseline",
                        'reason'     => "7-day average outflow: " . round($movingAvg, 1) . " {$product->uom}/day vs historical " . round($olderAvg, 1) . " {$product->uom}/day.",
                    ]);
                    $alertsCreated++;
                }
            }
        }

        return $alertsCreated;
    }

    /**
     * Algorithm 4: Vendor Score = 0.5 × normalizedPriceRank + 0.5 × onTimeDeliveryRate
     * Computed per product across all vendors who have supplied it.
     */
    private function runVendorScoring(): void
    {
        $productIds = PurchaseOrderLine::distinct()->pluck('product_id');

        foreach ($productIds as $productId) {
            $lines = PurchaseOrderLine::where('product_id', $productId)
                ->whereHas('purchaseOrder', fn ($q) => $q->whereNotIn('status', ['Cancelled']))
                ->with('purchaseOrder.vendor')
                ->get();

            if ($lines->isEmpty()) continue;

            // Group by vendor
            $vendorData = [];
            foreach ($lines as $line) {
                $vendorId = $line->purchaseOrder->vendor_id;
                if (!isset($vendorData[$vendorId])) {
                    $vendorData[$vendorId] = [
                        'total_orders'   => 0,
                        'on_time_orders' => 0,
                        'avg_cost'       => 0,
                        'cost_sum'       => 0,
                        'vendor'         => $line->purchaseOrder->vendor,
                    ];
                }
                $vendorData[$vendorId]['total_orders']++;
                $vendorData[$vendorId]['cost_sum'] += $line->cost_price;

                $po = $line->purchaseOrder;
                if ($po->status === 'Received' && $po->expected_receipt_date && $po->updated_at) {
                    if ($po->updated_at->toDateString() <= $po->expected_receipt_date->toDateString()) {
                        $vendorData[$vendorId]['on_time_orders']++;
                    }
                }
            }

            foreach ($vendorData as &$data) {
                $data['avg_cost']           = $data['cost_sum'] / $data['total_orders'];
                $data['on_time_rate']       = $data['total_orders'] > 0
                    ? $data['on_time_orders'] / $data['total_orders']
                    : 0;
            }

            // Normalize price rank: lowest cost = rank 1 → highest normalizedPriceRank
            $costs   = array_column($vendorData, 'avg_cost');
            $minCost = count($costs) > 0 ? min($costs) : 0;
            $maxCost = count($costs) > 0 ? max($costs) : 0;
            $range   = $maxCost - $minCost;

            foreach ($vendorData as $vendorId => &$data) {
                $normalizedPrice = $range > 0
                    ? 1 - (($data['avg_cost'] - $minCost) / $range)
                    : 1;

                $score = 0.5 * $normalizedPrice + 0.5 * $data['on_time_rate'];

                VendorScore::updateOrCreate(
                    ['product_id' => $productId, 'vendor_id' => $vendorId],
                    [
                        'normalized_price_rank' => round($normalizedPrice, 4),
                        'on_time_delivery_rate' => round($data['on_time_rate'] * 100, 2),
                        'score'                 => round($score, 4),
                        'computed_at'           => now(),
                    ]
                );
            }
        }
    }

    private function linearSlope(array $values): float
    {
        $n = count($values);
        if ($n < 2) return 0;

        $xs   = range(0, $n - 1);
        $meanX = array_sum($xs) / $n;
        $meanY = array_sum($values) / $n;

        $numerator   = 0;
        $denominator = 0;
        for ($i = 0; $i < $n; $i++) {
            $numerator   += ($xs[$i] - $meanX) * ($values[$i] - $meanY);
            $denominator += ($xs[$i] - $meanX) ** 2;
        }

        return $denominator == 0 ? 0 : $numerator / $denominator;
    }
}
