<?php

namespace App\Services;

use App\Models\AnomalyFlag;
use App\Models\AiAlert;
use App\Models\ManufacturingOrder;
use App\Models\MoComponent;
use App\Models\MoWorkOrder;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderLine;
use App\Models\StockLedger;
use Illuminate\Support\Facades\DB;

class StockService
{
    /**
     * Algorithm 1: FreeToUse = OnHand - Reserved
     * Recomputed live; never cached.
     */
    public function freeToUse(Product $product): float
    {
        return max(0, $product->on_hand_qty - $product->reserved_qty);
    }

    /**
     * Reserve stock for a confirmed SO/MO line.
     */
    public function reserve(Product $product, float $qty): void
    {
        $product->increment('reserved_qty', $qty);
    }

    /**
     * Release reservation (on cancel).
     */
    public function release(Product $product, float $qty): void
    {
        $product->decrement('reserved_qty', min($qty, $product->reserved_qty));
    }

    /**
     * Deduct stock on delivery: reduces on_hand and reserved simultaneously.
     */
    public function deduct(Product $product, float $qty, string $reason, string $sourceDoc = ''): StockLedger
    {
        $entry = null;
        DB::transaction(function () use ($product, $qty, $reason, $sourceDoc, &$entry) {
            $product->decrement('on_hand_qty', $qty);
            $product->decrement('reserved_qty', min($qty, $product->reserved_qty));
            $product->refresh();
            $entry = $this->writeLedger($product, -$qty, $reason, $sourceDoc);
        });
        return $entry;
    }

    /**
     * Receive stock: increment on_hand, write ledger entry.
     */
    public function receive(Product $product, float $qty, string $reason, string $sourceDoc = ''): StockLedger
    {
        $entry = null;
        DB::transaction(function () use ($product, $qty, $reason, $sourceDoc, &$entry) {
            $product->increment('on_hand_qty', $qty);
            $product->refresh();
            $entry = $this->writeLedger($product, $qty, $reason, $sourceDoc);
        });
        return $entry;
    }

    /**
     * Consume materials in manufacturing: reduces on_hand and reserved (already reserved on MO confirm).
     */
    public function consume(Product $product, float $qty, string $reason, string $sourceDoc = ''): StockLedger
    {
        $entry = null;
        DB::transaction(function () use ($product, $qty, $reason, $sourceDoc, &$entry) {
            $product->decrement('on_hand_qty', $qty);
            $product->decrement('reserved_qty', min($qty, $product->reserved_qty));
            $product->refresh();
            $entry = $this->writeLedger($product, -$qty, $reason, $sourceDoc);
        });
        return $entry;
    }

    /**
     * Produce finished goods: increment on_hand without changing reserved.
     */
    public function produce(Product $product, float $qty, string $reason, string $sourceDoc = ''): StockLedger
    {
        $entry = null;
        DB::transaction(function () use ($product, $qty, $reason, $sourceDoc, &$entry) {
            $product->increment('on_hand_qty', $qty);
            $product->refresh();
            $entry = $this->writeLedger($product, $qty, $reason, $sourceDoc);
        });
        return $entry;
    }

    /**
     * Write a stock ledger entry and run Algorithm 5 anomaly detection.
     */
    public function writeLedger(Product $product, float $delta, string $reason, string $sourceDoc = ''): StockLedger
    {
        $product->refresh();
        $entry = StockLedger::create([
            'product_id'      => $product->id,
            'delta'           => $delta,
            'balance_after'   => $product->on_hand_qty,
            'reason'          => $reason,
            'source_document' => $sourceDoc,
            'created_by'      => auth()->id(),
        ]);

        $this->detectAnomaly($product, $delta, $entry);
        return $entry;
    }

    /**
     * Algorithm 5: Flag if |delta - mean| / stdDev > 3 (z-score rule).
     * Uses a rolling window of 30 prior ledger entries.
     */
    private function detectAnomaly(Product $product, float $delta, StockLedger $entry): void
    {
        $history = StockLedger::where('product_id', $product->id)
            ->where('id', '<', $entry->id)
            ->orderByDesc('id')
            ->limit(30)
            ->pluck('delta')
            ->map(fn ($d) => (float)$d)
            ->toArray();

        if (count($history) < 5) return;

        $n        = count($history);
        $mean     = array_sum($history) / $n;
        $variance = array_sum(array_map(fn ($x) => ($x - $mean) ** 2, $history)) / $n;
        $stdDev   = sqrt($variance);

        if ($stdDev == 0) return;

        $zScore = abs($delta - $mean) / $stdDev;

        if ($zScore > 3) {
            $entry->update([
                'anomaly_flagged' => true,
                'anomaly_reason'  => "z-score {$zScore}",
            ]);

            AnomalyFlag::create([
                'product_id'      => $product->id,
                'stock_ledger_id' => $entry->id,
                'delta'           => $delta,
                'mean_delta'      => $mean,
                'std_dev'         => $stdDev,
                'z_score'         => $zScore,
                'reason'          => "Stock movement of {$delta} on {$product->name} is {$zScore}x standard deviation from rolling average ({$mean}).",
            ]);

            AiAlert::create([
                'product_id' => $product->id,
                'alert_type' => 'anomaly',
                'message'    => "{$product->name}: unusual movement of " . ($delta >= 0 ? '+' : '') . round($delta, 1) . " units (z-score: " . round($zScore, 1) . ")",
                'reason'     => "Movement is " . round($zScore, 1) . "x the standard deviation from the 30-entry rolling average (" . round($mean, 1) . " units). Verify with physical count.",
            ]);
        }
    }

    /**
     * Algorithm 2: Procurement trigger — runs on every SO/MO confirm.
     * shortfall = abs(min(0, FreeToUse - requestedQty))
     */
    public function triggerProcurement(Product $product, float $requestedQty, string $sourceDoc): void
    {
        $freeToUse = $this->freeToUse($product);
        $shortfall = abs(min(0, $freeToUse - $requestedQty));

        if ($shortfall <= 0 || !$product->procure_on_demand) return;

        if ($product->replenishment_route === 'Vendor') {
            $this->createDraftPurchaseOrder($product, $shortfall, $sourceDoc);
        } elseif ($product->replenishment_route === 'BoM') {
            $this->createDraftManufacturingOrder($product, $shortfall, $sourceDoc);
        }
    }

    private function createDraftPurchaseOrder(Product $product, float $qty, string $sourceDoc): void
    {
        $vendor = $product->bestScoredVendor() ?? $product->preferredVendor;
        if (!$vendor) return;

        $ref = 'PO-' . str_pad(PurchaseOrder::count() + 1, 4, '0', STR_PAD_LEFT);
        $leadDays = max(1, (int)$product->lead_time_days);

        $po = PurchaseOrder::create([
            'reference'             => $ref,
            'vendor_id'             => $vendor->id,
            'vendor_address'        => $vendor->address,
            'order_date'            => now()->toDateString(),
            'expected_receipt_date' => now()->addDays($leadDays)->toDateString(),
            'status'                => 'Draft',
            'source_document'       => $sourceDoc,
            'notes'                 => "Auto-generated: shortfall of {$qty} units for {$product->name}",
        ]);

        PurchaseOrderLine::create([
            'purchase_order_id' => $po->id,
            'product_id'        => $product->id,
            'uom'               => $product->uom,
            'ordered_qty'       => $qty,
            'cost_price'        => $product->cost_price,
        ]);

        AiAlert::create([
            'product_id'    => $product->id,
            'alert_type'    => 'reorder_trigger',
            'message'       => "Draft PO {$ref} raised — {$product->name} is {$qty} units short for {$sourceDoc}",
            'reason'        => "Confirmed order {$sourceDoc} exceeds available stock by {$qty} units. Vendor: {$vendor->name}.",
            'suggested_qty' => $qty,
        ]);
    }

    private function createDraftManufacturingOrder(Product $product, float $qty, string $sourceDoc): void
    {
        $bom = $product->billsOfMaterials()->with('components', 'operations')->first();
        if (!$bom) return;

        $ref      = 'MO-' . str_pad(ManufacturingOrder::count() + 1, 4, '0', STR_PAD_LEFT);
        $leadDays = max(1, (int)$product->lead_time_days);
        $scale    = $qty / (float)$bom->base_qty;

        $mo = ManufacturingOrder::create([
            'reference'          => $ref,
            'finished_product_id' => $product->id,
            'target_qty'         => $qty,
            'uom'                => $product->uom,
            'bom_id'             => $bom->id,
            'scheduled_date'     => now()->addDays($leadDays)->toDateString(),
            'status'             => 'Draft',
            'source_document'    => $sourceDoc,
            'notes'              => "Auto-generated: shortfall of {$qty} units for {$product->name}",
        ]);

        foreach ($bom->components as $comp) {
            MoComponent::create([
                'manufacturing_order_id' => $mo->id,
                'product_id'             => $comp->component_id,
                'uom'                    => $comp->uom,
                'to_consume_qty'         => round((float)$comp->to_consume_qty * $scale, 3),
            ]);
        }

        foreach ($bom->operations as $op) {
            MoWorkOrder::create([
                'manufacturing_order_id' => $mo->id,
                'operation_name'         => $op->operation_name,
                'work_center_id'         => $op->work_center_id,
                'expected_duration_mins' => $op->expected_duration_mins,
                'sequence'               => $op->sequence,
            ]);
        }

        AiAlert::create([
            'product_id'    => $product->id,
            'alert_type'    => 'reorder_trigger',
            'message'       => "Draft MO {$ref} raised — {$product->name} is {$qty} units short for {$sourceDoc}",
            'reason'        => "Confirmed order {$sourceDoc} exceeds available stock by {$qty} units. Manufacturing route triggered.",
            'suggested_qty' => $qty,
        ]);
    }
}
