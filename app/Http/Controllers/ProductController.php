<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Product;
use App\Models\Vendor;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with('preferredVendor');

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('reference', 'like', '%' . $request->search . '%');
            });
        }
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        $products   = $query->orderBy('reference')->paginate(25)->withQueryString();
        $categories = Product::select('category')->distinct()->pluck('category')->filter()->sort()->values();

        return view('products.index', compact('products', 'categories'));
    }

    public function create()
    {
        $vendors = Vendor::orderBy('name')->pluck('name', 'id');
        return view('products.create', compact('vendors'));
    }

    public function store(Request $request)
    {
        $validated = $this->validateProduct($request);

        $product = Product::create($validated);

        AuditLog::record('Product', $product->id, 'created', "Product {$product->reference} created");

        return redirect()->route('products.show', $product)
                         ->with('success', "Product {$product->reference} created.");
    }

    public function show(Product $product)
    {
        $product->load('preferredVendor', 'stockLedger', 'aiAlerts');
        $recentLedger = $product->stockLedger()->latest()->take(10)->get();
        return view('products.show', compact('product', 'recentLedger'));
    }

    public function edit(Product $product)
    {
        $vendors = Vendor::orderBy('name')->pluck('name', 'id');
        return view('products.edit', compact('product', 'vendors'));
    }

    public function update(Request $request, Product $product)
    {
        $validated = $this->validateProduct($request, $product->id);

        $changes = [];
        foreach (['name', 'sales_price', 'cost_price', 'procure_on_demand', 'replenishment_route', 'reorder_point'] as $field) {
            if (isset($validated[$field]) && $product->$field != $validated[$field]) {
                $changes[$field] = ['old' => $product->$field, 'new' => $validated[$field]];
            }
        }

        $product->update($validated);

        foreach ($changes as $field => $change) {
            AuditLog::record('Product', $product->id, 'updated', "Field '{$field}' changed",
                $field, $change['old'], $change['new']);
        }

        return redirect()->route('products.show', $product)
                         ->with('success', 'Product updated.');
    }

    private function validateProduct(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'reference'           => "required|string|max:50|unique:products,reference,{$ignoreId}",
            'name'                => 'required|string|max:255',
            'description'         => 'nullable|string',
            'uom'                 => 'required|string|max:50',
            'category'            => 'nullable|string|max:100',
            'sales_price'         => 'required|numeric|min:0',
            'cost_price'          => 'required|numeric|min:0',
            'on_hand_qty'         => 'required|numeric|min:0',
            'procure_on_demand'   => 'boolean',
            'replenishment_route' => 'required|in:Vendor,BoM',
            'preferred_vendor_id' => 'nullable|exists:vendors,id',
            'reorder_point'       => 'nullable|numeric|min:0',
            'safety_stock'        => 'nullable|numeric|min:0',
            'lead_time_days'      => 'nullable|integer|min:1',
        ]);
    }
}
