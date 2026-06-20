<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderLine;
use App\Models\User;
use App\Models\Vendor;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseOrderController extends Controller
{
    public function __construct(private StockService $stockService) {}

    public function index(Request $request)
    {
        $query = PurchaseOrder::with('vendor', 'agent');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('vendor_id')) {
            $query->where('vendor_id', $request->vendor_id);
        }
        if ($request->filled('search')) {
            $query->where('reference', 'like', '%' . $request->search . '%');
        }

        $purchaseOrders = $query->latest()->paginate(20)->withQueryString();
        $vendors        = Vendor::orderBy('name')->pluck('name', 'id');
        $statuses       = PurchaseOrder::$statuses;

        return view('purchase-orders.index', compact('purchaseOrders', 'vendors', 'statuses'));
    }

    public function create()
    {
        $vendors  = Vendor::orderBy('name')->get();
        $products = Product::orderBy('name')->get();
        $agents   = User::role('Purchase User')->orderBy('name')->get();
        $nextRef  = 'PO-' . str_pad(PurchaseOrder::count() + 1, 4, '0', STR_PAD_LEFT);

        return view('purchase-orders.create', compact('vendors', 'products', 'agents', 'nextRef'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'vendor_id'              => 'required|exists:vendors,id',
            'order_date'             => 'required|date',
            'expected_receipt_date'  => 'nullable|date|after_or_equal:order_date',
            'lines'                  => 'required|array|min:1',
            'lines.*.product_id'     => 'required|exists:products,id',
            'lines.*.ordered_qty'    => 'required|numeric|min:0.001',
            'lines.*.cost_price'     => 'required|numeric|min:0',
        ]);

        $ref = 'PO-' . str_pad(PurchaseOrder::count() + 1, 4, '0', STR_PAD_LEFT);
        $vendor = Vendor::findOrFail($request->vendor_id);

        $po = DB::transaction(function () use ($request, $ref, $vendor) {
            $po = PurchaseOrder::create([
                'reference'             => $ref,
                'vendor_id'             => $request->vendor_id,
                'vendor_address'        => $vendor->address,
                'order_date'            => $request->order_date,
                'expected_receipt_date' => $request->expected_receipt_date,
                'agent_id'              => $request->agent_id,
                'status'                => 'Draft',
                'notes'                 => $request->notes,
            ]);

            foreach ($request->lines as $line) {
                PurchaseOrderLine::create([
                    'purchase_order_id' => $po->id,
                    'product_id'        => $line['product_id'],
                    'uom'               => $line['uom'] ?? 'pcs',
                    'ordered_qty'       => $line['ordered_qty'],
                    'cost_price'        => $line['cost_price'],
                ]);
            }

            AuditLog::record('PurchaseOrder', $po->id, 'created', "PO {$ref} created");
            return $po;
        });

        return redirect()->route('purchase-orders.show', $po)
                         ->with('success', "Purchase Order {$ref} created.");
    }

    public function show(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->load('vendor', 'agent', 'lines.product');
        $auditLogs = AuditLog::where('model_type', 'PurchaseOrder')
                              ->where('model_id', $purchaseOrder->id)
                              ->with('user')->latest()->get();
        return view('purchase-orders.show', compact('purchaseOrder', 'auditLogs'));
    }

    public function edit(PurchaseOrder $purchaseOrder)
    {
        if ($purchaseOrder->status !== 'Draft') {
            return back()->with('error', 'Only Draft orders can be edited.');
        }
        $purchaseOrder->load('lines.product');
        $vendors  = Vendor::orderBy('name')->get();
        $products = Product::orderBy('name')->get();
        $agents   = User::role('Purchase User')->orderBy('name')->get();

        return view('purchase-orders.edit', compact('purchaseOrder', 'vendors', 'products', 'agents'));
    }

    public function update(Request $request, PurchaseOrder $purchaseOrder)
    {
        if ($purchaseOrder->status !== 'Draft') {
            return back()->with('error', 'Only Draft orders can be edited.');
        }

        $request->validate([
            'vendor_id'           => 'required|exists:vendors,id',
            'lines'               => 'required|array|min:1',
            'lines.*.product_id'  => 'required|exists:products,id',
            'lines.*.ordered_qty' => 'required|numeric|min:0.001',
            'lines.*.cost_price'  => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($request, $purchaseOrder) {
            $purchaseOrder->update([
                'vendor_id'             => $request->vendor_id,
                'order_date'            => $request->order_date,
                'expected_receipt_date' => $request->expected_receipt_date,
                'agent_id'              => $request->agent_id,
                'notes'                 => $request->notes,
            ]);

            $purchaseOrder->lines()->delete();
            foreach ($request->lines as $line) {
                PurchaseOrderLine::create([
                    'purchase_order_id' => $purchaseOrder->id,
                    'product_id'        => $line['product_id'],
                    'uom'               => $line['uom'] ?? 'pcs',
                    'ordered_qty'       => $line['ordered_qty'],
                    'cost_price'        => $line['cost_price'],
                ]);
            }
            AuditLog::record('PurchaseOrder', $purchaseOrder->id, 'updated', "PO updated");
        });

        return redirect()->route('purchase-orders.show', $purchaseOrder)->with('success', 'Order updated.');
    }

    public function confirm(PurchaseOrder $purchaseOrder)
    {
        if ($purchaseOrder->status !== 'Draft') {
            return back()->with('error', 'Only Draft orders can be confirmed.');
        }

        $purchaseOrder->update(['status' => 'Confirmed']);
        AuditLog::record('PurchaseOrder', $purchaseOrder->id, 'status_changed',
            "PO confirmed", 'status', 'Draft', 'Confirmed');

        return back()->with('success', "PO {$purchaseOrder->reference} confirmed.");
    }

    public function receive(Request $request, PurchaseOrder $purchaseOrder)
    {
        if (!in_array($purchaseOrder->status, ['Confirmed', 'Partially Received'])) {
            return back()->with('error', 'Order cannot be received in its current status.');
        }

        $request->validate([
            'receipts'           => 'required|array',
            'receipts.*.line_id' => 'required|exists:purchase_order_lines,id',
            'receipts.*.qty'     => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($request, $purchaseOrder) {
            foreach ($request->receipts as $receipt) {
                if ($receipt['qty'] <= 0) continue;

                $line    = PurchaseOrderLine::find($receipt['line_id']);
                $product = $line->product;
                $qty     = min($receipt['qty'], $line->pending_qty);

                if ($qty <= 0) continue;

                $this->stockService->receive($product, $qty, 'Purchase receipt', $purchaseOrder->reference);
                $line->increment('received_qty', $qty);
            }

            $purchaseOrder->refresh();
            $allReceived = $purchaseOrder->lines->every(fn ($l) => $l->received_qty >= $l->ordered_qty);
            $anyReceived = $purchaseOrder->lines->some(fn ($l) => $l->received_qty > 0);

            $newStatus = $allReceived ? 'Received' : ($anyReceived ? 'Partially Received' : $purchaseOrder->status);
            $purchaseOrder->update(['status' => $newStatus]);

            AuditLog::record('PurchaseOrder', $purchaseOrder->id, 'receipt',
                "Goods received — status: {$newStatus}", 'status', $purchaseOrder->status, $newStatus);
        });

        return back()->with('success', 'Goods received and stock updated.');
    }

    public function cancel(PurchaseOrder $purchaseOrder)
    {
        if (in_array($purchaseOrder->status, ['Received', 'Cancelled'])) {
            return back()->with('error', 'Order cannot be cancelled.');
        }

        $purchaseOrder->update(['status' => 'Cancelled']);
        AuditLog::record('PurchaseOrder', $purchaseOrder->id, 'status_changed',
            "PO cancelled", 'status', $purchaseOrder->status, 'Cancelled');

        return back()->with('success', "PO {$purchaseOrder->reference} cancelled.");
    }
}
