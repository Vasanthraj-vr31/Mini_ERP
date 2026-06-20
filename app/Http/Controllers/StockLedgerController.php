<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Product;
use App\Models\StockLedger;
use App\Services\StockService;
use Illuminate\Http\Request;

class StockLedgerController extends Controller
{
    public function __construct(private StockService $stockService) {}

    public function index(Request $request)
    {
        $query = StockLedger::with('product', 'createdBy');

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }
        if ($request->filled('type')) {
            if ($request->type === 'anomaly') {
                $query->where('anomaly_flagged', true);
            } elseif ($request->type === 'in') {
                $query->where('delta', '>', 0);
            } elseif ($request->type === 'out') {
                $query->where('delta', '<', 0);
            }
        }
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $entries  = $query->latest()->paginate(30)->withQueryString();
        $products = Product::orderBy('name')->pluck('name', 'id');

        return view('stock-ledger.index', compact('entries', 'products'));
    }

    public function adjust(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'delta'      => 'required|numeric|not_in:0',
            'reason'     => 'required|string|max:255',
        ]);

        $product = Product::findOrFail($request->product_id);
        $delta   = (float)$request->delta;

        if ($delta > 0) {
            $this->stockService->receive($product, $delta, 'Manual adjustment: ' . $request->reason);
        } else {
            $this->stockService->deduct($product, abs($delta), 'Manual adjustment: ' . $request->reason);
        }

        AuditLog::record('Product', $product->id, 'stock_adjustment',
            "Manual stock adjustment of {$delta} units — {$request->reason}");

        return back()->with('success', "Stock adjusted for {$product->name}.");
    }
}
