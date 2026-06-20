<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\BillOfMaterial;
use App\Models\ManufacturingOrder;
use App\Models\MoComponent;
use App\Models\MoWorkOrder;
use App\Models\Product;
use App\Models\User;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ManufacturingOrderController extends Controller
{
    public function __construct(private StockService $stockService) {}

    public function index(Request $request)
    {
        $query = ManufacturingOrder::with('finishedProduct', 'bom', 'assignee');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('search')) {
            $query->where('reference', 'like', '%' . $request->search . '%');
        }

        $manufacturingOrders = $query->latest()->paginate(20)->withQueryString();
        $statuses            = ManufacturingOrder::$statuses;

        return view('manufacturing-orders.index', compact('manufacturingOrders', 'statuses'));
    }

    public function create()
    {
        $products  = Product::orderBy('name')->get();
        $boms      = BillOfMaterial::with('finishedProduct')->get();
        $assignees = User::role('Manufacturing User')->orderBy('name')->get();
        $nextRef   = 'MO-' . str_pad(ManufacturingOrder::count() + 1, 4, '0', STR_PAD_LEFT);

        return view('manufacturing-orders.create', compact('products', 'boms', 'assignees', 'nextRef'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'finished_product_id' => 'required|exists:products,id',
            'bom_id'              => 'required|exists:bills_of_materials,id',
            'target_qty'          => 'required|numeric|min:0.001',
            'scheduled_date'      => 'required|date',
            'assignee_id'         => 'nullable|exists:users,id',
        ]);

        $ref = 'MO-' . str_pad(ManufacturingOrder::count() + 1, 4, '0', STR_PAD_LEFT);

        $mo = DB::transaction(function () use ($request, $ref) {
            $mo = ManufacturingOrder::create([
                'reference'          => $ref,
                'finished_product_id' => $request->finished_product_id,
                'target_qty'         => $request->target_qty,
                'uom'                => $request->uom ?? 'pcs',
                'bom_id'             => $request->bom_id,
                'scheduled_date'     => $request->scheduled_date,
                'assignee_id'        => $request->assignee_id,
                'status'             => 'Draft',
                'notes'              => $request->notes,
            ]);

            $this->copyBomToMo($mo);
            AuditLog::record('ManufacturingOrder', $mo->id, 'created', "MO {$ref} created");
            return $mo;
        });

        return redirect()->route('manufacturing-orders.show', $mo)
                         ->with('success', "Manufacturing Order {$ref} created.");
    }

    public function show(ManufacturingOrder $manufacturingOrder)
    {
        $manufacturingOrder->load('finishedProduct', 'bom', 'assignee', 'components.product', 'workOrders.workCenter');
        $auditLogs = AuditLog::where('model_type', 'ManufacturingOrder')
                              ->where('model_id', $manufacturingOrder->id)
                              ->with('user')->latest()->get();
        return view('manufacturing-orders.show', compact('manufacturingOrder', 'auditLogs'));
    }

    public function edit(ManufacturingOrder $manufacturingOrder)
    {
        if (!in_array($manufacturingOrder->status, ['Draft', 'Confirmed'])) {
            return back()->with('error', 'MO cannot be edited in its current status.');
        }
        $products  = Product::orderBy('name')->get();
        $boms      = BillOfMaterial::with('finishedProduct')->get();
        $assignees = User::role('Manufacturing User')->orderBy('name')->get();
        return view('manufacturing-orders.edit', compact('manufacturingOrder', 'products', 'boms', 'assignees'));
    }

    public function update(Request $request, ManufacturingOrder $manufacturingOrder)
    {
        if (!in_array($manufacturingOrder->status, ['Draft', 'Confirmed'])) {
            return back()->with('error', 'MO cannot be edited in its current status.');
        }

        $request->validate([
            'target_qty'     => 'required|numeric|min:0.001',
            'scheduled_date' => 'required|date',
            'assignee_id'    => 'nullable|exists:users,id',
        ]);

        $manufacturingOrder->update($request->only(['target_qty', 'scheduled_date', 'assignee_id', 'notes']));
        AuditLog::record('ManufacturingOrder', $manufacturingOrder->id, 'updated', "MO updated");

        return redirect()->route('manufacturing-orders.show', $manufacturingOrder)->with('success', 'MO updated.');
    }

    public function confirm(ManufacturingOrder $manufacturingOrder)
    {
        if ($manufacturingOrder->status !== 'Draft') {
            return back()->with('error', 'Only Draft MOs can be confirmed.');
        }

        DB::transaction(function () use ($manufacturingOrder) {
            $manufacturingOrder->load('components.product');
            foreach ($manufacturingOrder->components as $component) {
                $this->stockService->reserve($component->product, (float)$component->to_consume_qty);
            }

            $manufacturingOrder->update(['status' => 'Confirmed']);
            AuditLog::record('ManufacturingOrder', $manufacturingOrder->id, 'status_changed',
                "MO confirmed — components reserved", 'status', 'Draft', 'Confirmed');
        });

        return back()->with('success', "MO {$manufacturingOrder->reference} confirmed.");
    }

    public function start(ManufacturingOrder $manufacturingOrder)
    {
        if ($manufacturingOrder->status !== 'Confirmed') {
            return back()->with('error', 'Only Confirmed MOs can be started.');
        }

        $manufacturingOrder->update(['status' => 'In-Progress']);
        AuditLog::record('ManufacturingOrder', $manufacturingOrder->id, 'status_changed',
            "MO started", 'status', 'Confirmed', 'In-Progress');

        return back()->with('success', "MO {$manufacturingOrder->reference} started.");
    }

    public function close(ManufacturingOrder $manufacturingOrder)
    {
        if (!in_array($manufacturingOrder->status, ['In-Progress', 'To Close'])) {
            return back()->with('error', 'MO cannot be closed in its current status.');
        }

        DB::transaction(function () use ($manufacturingOrder) {
            $manufacturingOrder->load('components.product', 'finishedProduct');

            foreach ($manufacturingOrder->components as $component) {
                $this->stockService->consume(
                    $component->product,
                    (float)$component->to_consume_qty,
                    'Manufacturing consumption',
                    $manufacturingOrder->reference
                );
            }

            $this->stockService->produce(
                $manufacturingOrder->finishedProduct,
                (float)$manufacturingOrder->target_qty,
                'Manufacturing output',
                $manufacturingOrder->reference
            );

            $manufacturingOrder->update(['status' => 'Done']);
            AuditLog::record('ManufacturingOrder', $manufacturingOrder->id, 'status_changed',
                "MO closed — components consumed, finished goods produced", 'status', $manufacturingOrder->status, 'Done');
        });

        return back()->with('success', "MO {$manufacturingOrder->reference} closed. Finished goods added to stock.");
    }

    public function cancel(ManufacturingOrder $manufacturingOrder)
    {
        if (in_array($manufacturingOrder->status, ['Done', 'Cancelled'])) {
            return back()->with('error', 'MO cannot be cancelled.');
        }

        DB::transaction(function () use ($manufacturingOrder) {
            if (in_array($manufacturingOrder->status, ['Confirmed', 'In-Progress'])) {
                $manufacturingOrder->load('components.product');
                foreach ($manufacturingOrder->components as $component) {
                    $this->stockService->release($component->product, (float)$component->to_consume_qty);
                }
            }

            $manufacturingOrder->update(['status' => 'Cancelled']);
            AuditLog::record('ManufacturingOrder', $manufacturingOrder->id, 'status_changed',
                "MO cancelled — reservations released", 'status', $manufacturingOrder->status, 'Cancelled');
        });

        return back()->with('success', "MO {$manufacturingOrder->reference} cancelled.");
    }

    public function bomData(BillOfMaterial $bom, Request $request)
    {
        $bom->load('components.component', 'operations');
        $qty    = max(1, (float)$request->query('qty', 1));
        $factor = $qty / $bom->base_qty;

        $components = $bom->components->map(fn ($c) => [
            'component_id'  => $c->component_id,
            'product_name'  => $c->component->name,
            'to_consume_qty' => round((float)$c->to_consume_qty * $factor, 4),
            'uom'           => $c->uom,
            'free_to_use'   => $c->component->free_to_use_qty,
        ]);

        $operations = $bom->operations->map(fn ($o) => [
            'operation_name'         => $o->operation_name,
            'work_center_id'         => $o->work_center_id,
            'expected_duration_mins' => $o->expected_duration_mins,
            'sequence'               => $o->sequence,
        ]);

        return response()->json(['components' => $components, 'operations' => $operations]);
    }

    private function copyBomToMo(ManufacturingOrder $mo): void
    {
        $bom    = $mo->bom()->with('components.component', 'operations')->first();
        $factor = (float)$mo->target_qty / (float)$bom->base_qty;

        foreach ($bom->components as $component) {
            MoComponent::create([
                'manufacturing_order_id' => $mo->id,
                'product_id'             => $component->component_id,
                'uom'                    => $component->uom,
                'to_consume_qty'         => round((float)$component->to_consume_qty * $factor, 3),
            ]);
        }

        foreach ($bom->operations as $operation) {
            MoWorkOrder::create([
                'manufacturing_order_id' => $mo->id,
                'operation_name'         => $operation->operation_name,
                'work_center_id'         => $operation->work_center_id,
                'expected_duration_mins' => $operation->expected_duration_mins,
                'sequence'               => $operation->sequence,
            ]);
        }
    }
}
