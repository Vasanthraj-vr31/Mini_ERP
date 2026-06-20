<?php

namespace App\Http\Controllers;

use App\Models\AiAlert;
use App\Models\ManufacturingOrder;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\SalesOrder;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        $today = Carbon::today();

        // Sales Order counts
        $soCounts = [
            'Draft'               => SalesOrder::where('status', 'Draft')->count(),
            'Confirmed'           => SalesOrder::where('status', 'Confirmed')->count(),
            'Partially Delivered' => SalesOrder::where('status', 'Partially Delivered')->count(),
            'Delivered'           => SalesOrder::where('status', 'Delivered')->count(),
            'Late'                => SalesOrder::whereNotIn('status', ['Delivered', 'Cancelled'])
                                       ->where('expected_delivery_date', '<', $today)->count(),
        ];

        // Purchase Order counts
        $poCounts = [
            'Draft'              => PurchaseOrder::where('status', 'Draft')->count(),
            'Confirmed'          => PurchaseOrder::where('status', 'Confirmed')->count(),
            'Partially Received' => PurchaseOrder::where('status', 'Partially Received')->count(),
            'Received'           => PurchaseOrder::where('status', 'Received')->count(),
            'Late'               => PurchaseOrder::whereNotIn('status', ['Received', 'Cancelled'])
                                       ->where('expected_receipt_date', '<', $today)->count(),
        ];

        // Manufacturing Order counts
        $moCounts = [
            'Draft'       => ManufacturingOrder::where('status', 'Draft')->count(),
            'Confirmed'   => ManufacturingOrder::where('status', 'Confirmed')->count(),
            'In-Progress' => ManufacturingOrder::where('status', 'In-Progress')->count(),
            'To Close'    => ManufacturingOrder::where('status', 'To Close')->count(),
            'Done'        => ManufacturingOrder::where('status', 'Done')->count(),
        ];

        // Smart Alerts
        $alerts = AiAlert::with('product')
            ->where('is_resolved', false)
            ->latest()
            ->take(10)
            ->get();

        // Low stock products (FreeToUse < ReorderPoint)
        $lowStockProducts = Product::whereRaw('(on_hand_qty - reserved_qty) < reorder_point')
            ->where('reorder_point', '>', 0)
            ->with('aiAlerts')
            ->orderByRaw('(on_hand_qty - reserved_qty) / NULLIF(reorder_point, 0)')
            ->take(5)
            ->get();

        return view('dashboard.index', compact(
            'soCounts', 'poCounts', 'moCounts', 'alerts', 'lowStockProducts'
        ));
    }
}
