<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\BillOfMaterial;
use App\Models\BomComponent;
use App\Models\BomOperation;
use App\Models\Product;
use App\Models\WorkCenter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BillOfMaterialController extends Controller
{
    public function index()
    {
        $boms = BillOfMaterial::with('finishedProduct')->orderBy('reference')->paginate(20);
        return view('bom.index', compact('boms'));
    }

    public function create()
    {
        $products    = Product::orderBy('name')->get();
        $workCenters = WorkCenter::orderBy('name')->pluck('name', 'id');
        $nextRef     = 'BOM-' . str_pad(BillOfMaterial::count() + 1, 3, '0', STR_PAD_LEFT);
        return view('bom.create', compact('products', 'workCenters', 'nextRef'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'reference'                   => 'required|string|max:50|unique:bills_of_materials,reference',
            'finished_product_id'         => 'required|exists:products,id',
            'base_qty'                    => 'required|numeric|min:0.001',
            'components'                  => 'required|array|min:1',
            'components.*.component_id'   => 'required|exists:products,id',
            'components.*.to_consume_qty' => 'required|numeric|min:0.001',
            'operations'                  => 'nullable|array',
            'operations.*.operation_name' => 'required_with:operations|string|max:255',
            'operations.*.work_center_id' => 'nullable|exists:work_centers,id',
        ]);

        $bom = DB::transaction(function () use ($request) {
            $bom = BillOfMaterial::create([
                'reference'          => $request->reference,
                'finished_product_id' => $request->finished_product_id,
                'base_qty'           => $request->base_qty,
                'uom'                => $request->uom ?? 'pcs',
                'notes'              => $request->notes,
            ]);

            foreach ($request->components as $component) {
                BomComponent::create([
                    'bom_id'         => $bom->id,
                    'component_id'   => $component['component_id'],
                    'to_consume_qty' => $component['to_consume_qty'],
                    'uom'            => $component['uom'] ?? 'pcs',
                ]);
            }

            if ($request->filled('operations')) {
                foreach ($request->operations as $i => $operation) {
                    BomOperation::create([
                        'bom_id'                 => $bom->id,
                        'operation_name'         => $operation['operation_name'],
                        'work_center_id'         => $operation['work_center_id'] ?? null,
                        'expected_duration_mins' => $operation['expected_duration_mins'] ?? null,
                        'sequence'               => $i + 1,
                    ]);
                }
            }

            AuditLog::record('BillOfMaterial', $bom->id, 'created', "BoM {$bom->reference} created");
            return $bom;
        });

        return redirect()->route('bom.show', $bom)
                         ->with('success', "Bill of Materials {$bom->reference} created.");
    }

    public function show(BillOfMaterial $bom)
    {
        $bom->load('finishedProduct', 'components.component', 'operations.workCenter');
        return view('bom.show', compact('bom'));
    }

    public function edit(BillOfMaterial $bom)
    {
        $bom->load('components.component', 'operations');
        $products    = Product::orderBy('name')->get();
        $workCenters = WorkCenter::orderBy('name')->pluck('name', 'id');
        return view('bom.edit', compact('bom', 'products', 'workCenters'));
    }

    public function update(Request $request, BillOfMaterial $bom)
    {
        $request->validate([
            'finished_product_id'         => 'required|exists:products,id',
            'base_qty'                    => 'required|numeric|min:0.001',
            'components'                  => 'required|array|min:1',
            'components.*.component_id'   => 'required|exists:products,id',
            'components.*.to_consume_qty' => 'required|numeric|min:0.001',
        ]);

        DB::transaction(function () use ($request, $bom) {
            $bom->update([
                'finished_product_id' => $request->finished_product_id,
                'base_qty'           => $request->base_qty,
                'uom'                => $request->uom ?? 'pcs',
                'notes'              => $request->notes,
            ]);

            $bom->components()->delete();
            foreach ($request->components as $component) {
                BomComponent::create([
                    'bom_id'         => $bom->id,
                    'component_id'   => $component['component_id'],
                    'to_consume_qty' => $component['to_consume_qty'],
                    'uom'            => $component['uom'] ?? 'pcs',
                ]);
            }

            $bom->operations()->delete();
            if ($request->filled('operations')) {
                foreach ($request->operations as $i => $operation) {
                    BomOperation::create([
                        'bom_id'                 => $bom->id,
                        'operation_name'         => $operation['operation_name'],
                        'work_center_id'         => $operation['work_center_id'] ?? null,
                        'expected_duration_mins' => $operation['expected_duration_mins'] ?? null,
                        'sequence'               => $i + 1,
                    ]);
                }
            }

            AuditLog::record('BillOfMaterial', $bom->id, 'updated', "BoM updated");
        });

        return redirect()->route('bom.show', $bom)->with('success', 'BoM updated.');
    }
}
