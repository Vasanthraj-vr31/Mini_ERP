<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Customer;
use App\Models\Product;
use App\Models\SalesOrder;
use App\Models\SaleOrderLine;
use App\Models\User;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesOrderController extends Controller
{
    public function __construct(private StockService $stockService) {}

    public function index(Request $request)
    {
        $query = SalesOrder::with('customer', 'salesPerson');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }
        if ($request->filled('search')) {
            $query->where('reference', 'like', '%' . $request->search . '%');
        }

        $salesOrders = $query->latest()->paginate(20)->withQueryString();
        $customers   = Customer::orderBy('name')->pluck('name', 'id');
        $statuses    = SalesOrder::$statuses;

        return view('sales-orders.index', compact('salesOrders', 'customers', 'statuses'));
    }

    public function create()
    {
        $customers   = Customer::orderBy('name')->get();
        $products    = Product::orderBy('name')->get();
        $salesPeople = User::role('Sales User')->orWhereHas('roles', fn ($q) => $q->where('name', 'Admin'))->orderBy('name')->get();
        $nextRef     = 'SO-' . str_pad(SalesOrder::count() + 1, 4, '0', STR_PAD_LEFT);

        return view('sales-orders.create', compact('customers', 'products', 'salesPeople', 'nextRef'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'customer_id'            => 'required|exists:customers,id',
            'shipping_address'       => 'nullable|string',
            'order_date'             => 'required|date',
            'expected_delivery_date' => 'nullable|date|after_or_equal:order_date',
            'sales_person_id'        => 'nullable|exists:users,id',
            'lines'                  => 'required|array|min:1',
            'lines.*.product_id'     => 'required|exists:products,id',
            'lines.*.ordered_qty'    => 'required|numeric|min:0.001',
            'lines.*.unit_price'     => 'required|numeric|min:0',
        ]);

        $ref = 'SO-' . str_pad(SalesOrder::count() + 1, 4, '0', STR_PAD_LEFT);

        $so = DB::transaction(function () use ($request, $ref) {
            $so = SalesOrder::create([
                'reference'              => $ref,
                'customer_id'            => $request->customer_id,
                'shipping_address'       => $request->shipping_address,
                'order_date'             => $request->order_date,
                'expected_delivery_date' => $request->expected_delivery_date,
                'sales_person_id'        => $request->sales_person_id,
                'status'                 => 'Draft',
                'notes'                  => $request->notes,
            ]);

            foreach ($request->lines as $line) {
                SaleOrderLine::create([
                    'sales_order_id' => $so->id,
                    'product_id'     => $line['product_id'],
                    'uom'            => $line['uom'] ?? 'pcs',
                    'ordered_qty'    => $line['ordered_qty'],
                    'unit_price'     => $line['unit_price'],
                ]);
            }

            AuditLog::record('SalesOrder', $so->id, 'created', "SO {$ref} created as Draft");
            return $so;
        });

        return redirect()->route('sales-orders.show', $so)
                         ->with('success', "Sale Order {$ref} created.");
    }

    public function show(SalesOrder $salesOrder)
    {
        $salesOrder->load('customer', 'salesPerson', 'lines.product');
        $auditLogs = AuditLog::where('model_type', 'SalesOrder')
                              ->where('model_id', $salesOrder->id)
                              ->with('user')->latest()->get();
        return view('sales-orders.show', compact('salesOrder', 'auditLogs'));
    }

    public function edit(SalesOrder $salesOrder)
    {
        if ($salesOrder->status !== 'Draft') {
            return back()->with('error', 'Only Draft orders can be edited.');
        }
        $salesOrder->load('lines.product');
        $customers   = Customer::orderBy('name')->get();
        $products    = Product::orderBy('name')->get();
        $salesPeople = User::role('Sales User')->orderBy('name')->get();

        return view('sales-orders.edit', compact('salesOrder', 'customers', 'products', 'salesPeople'));
    }

    public function update(Request $request, SalesOrder $salesOrder)
    {
        if ($salesOrder->status !== 'Draft') {
            return back()->with('error', 'Only Draft orders can be edited.');
        }

        $request->validate([
            'customer_id'         => 'required|exists:customers,id',
            'lines'               => 'required|array|min:1',
            'lines.*.product_id'  => 'required|exists:products,id',
            'lines.*.ordered_qty' => 'required|numeric|min:0.001',
            'lines.*.unit_price'  => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($request, $salesOrder) {
            $salesOrder->update([
                'customer_id'            => $request->customer_id,
                'shipping_address'       => $request->shipping_address,
                'order_date'             => $request->order_date,
                'expected_delivery_date' => $request->expected_delivery_date,
                'sales_person_id'        => $request->sales_person_id,
                'notes'                  => $request->notes,
            ]);

            $salesOrder->lines()->delete();
            foreach ($request->lines as $line) {
                SaleOrderLine::create([
                    'sales_order_id' => $salesOrder->id,
                    'product_id'     => $line['product_id'],
                    'uom'            => $line['uom'] ?? 'pcs',
                    'ordered_qty'    => $line['ordered_qty'],
                    'unit_price'     => $line['unit_price'],
                ]);
            }

            AuditLog::record('SalesOrder', $salesOrder->id, 'updated', "SO updated");
        });

        return redirect()->route('sales-orders.show', $salesOrder)->with('success', 'Order updated.');
    }

    public function confirm(SalesOrder $salesOrder)
    {
        if ($salesOrder->status !== 'Draft') {
            return back()->with('error', 'Only Draft orders can be confirmed.');
        }

        $salesOrder->load('lines.product');

        DB::transaction(function () use ($salesOrder) {
            foreach ($salesOrder->lines as $line) {
                $product = $line->product;
                $this->stockService->reserve($product, $line->ordered_qty);
                $this->stockService->triggerProcurement($product, $line->ordered_qty, $salesOrder->reference);
            }

            $salesOrder->update(['status' => 'Confirmed']);
            AuditLog::record('SalesOrder', $salesOrder->id, 'status_changed',
                "SO confirmed — stock reserved", 'status', 'Draft', 'Confirmed');
        });

        return back()->with('success', "Order {$salesOrder->reference} confirmed and stock reserved.");
    }

    public function deliver(Request $request, SalesOrder $salesOrder)
    {
        if (!in_array($salesOrder->status, ['Confirmed', 'Partially Delivered'])) {
            return back()->with('error', 'Order cannot be delivered in its current status.');
        }

        $request->validate([
            'deliveries'           => 'required|array',
            'deliveries.*.line_id' => 'required|exists:sale_order_lines,id',
            'deliveries.*.qty'     => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($request, $salesOrder) {
            foreach ($request->deliveries as $delivery) {
                if ($delivery['qty'] <= 0) continue;

                $line    = SaleOrderLine::find($delivery['line_id']);
                $product = $line->product;
                $qty     = min($delivery['qty'], $line->remaining_qty);

                if ($qty <= 0) continue;

                $this->stockService->deduct($product, $qty, 'Sales delivery', $salesOrder->reference);
                $line->increment('delivered_qty', $qty);
            }

            $salesOrder->refresh();
            $allDelivered = $salesOrder->lines->every(fn ($l) => $l->delivered_qty >= $l->ordered_qty);
            $anyDelivered = $salesOrder->lines->some(fn ($l) => $l->delivered_qty > 0);

            $newStatus = $allDelivered ? 'Delivered' : ($anyDelivered ? 'Partially Delivered' : $salesOrder->status);
            $salesOrder->update(['status' => $newStatus]);

            AuditLog::record('SalesOrder', $salesOrder->id, 'delivery',
                "Goods delivered — status: {$newStatus}", 'status', $salesOrder->status, $newStatus);
        });

        return back()->with('success', 'Delivery recorded.');
    }

    public function cancel(SalesOrder $salesOrder)
    {
        if (in_array($salesOrder->status, ['Delivered', 'Cancelled'])) {
            return back()->with('error', 'Order cannot be cancelled.');
        }

        DB::transaction(function () use ($salesOrder) {
            if ($salesOrder->status !== 'Draft') {
                foreach ($salesOrder->lines as $line) {
                    $reserved = $line->ordered_qty - $line->delivered_qty;
                    if ($reserved > 0) {
                        $this->stockService->release($line->product, $reserved);
                    }
                }
            }

            $salesOrder->update(['status' => 'Cancelled']);
            AuditLog::record('SalesOrder', $salesOrder->id, 'status_changed',
                "SO cancelled — reservations released", 'status', $salesOrder->status, 'Cancelled');
        });

        return back()->with('success', "Order {$salesOrder->reference} cancelled.");
    }
}
