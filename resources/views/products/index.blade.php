@extends('layouts.app')
@section('title', 'Products')

@section('content')
<div class="flex items-center justify-between mb-6">
    <h1 class="text-xl font-semibold text-gray-900">Product Registry</h1>
    @can('manage products')
    <a href="{{ route('products.create') }}" class="btn-primary">+ New product</a>
    @endcan
</div>

{{-- Filters --}}
<form method="GET" class="flex gap-3 mb-4">
    <input type="text" name="search" value="{{ request('search') }}"
        placeholder="Search by name or reference..."
        class="form-input max-w-xs">
    <select name="category" class="form-select max-w-xs">
        <option value="">All categories</option>
        @foreach($categories as $cat)
        <option value="{{ $cat }}" {{ request('category') === $cat ? 'selected' : '' }}>{{ $cat }}</option>
        @endforeach
    </select>
    <button type="submit" class="btn-secondary">Filter</button>
    @if(request()->hasAny(['search', 'category']))
    <a href="{{ route('products.index') }}" class="btn-secondary">Clear</a>
    @endif
</form>

<div class="card p-0">
    <table class="w-full text-sm">
        <thead>
            <tr class="text-left text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <th class="px-4 py-3">Ref</th>
                <th class="px-4 py-3">Name</th>
                <th class="px-4 py-3">UOM</th>
                <th class="px-4 py-3 text-right">On Hand</th>
                <th class="px-4 py-3 text-right">Reserved</th>
                <th class="px-4 py-3 text-right">Free to Use</th>
                <th class="px-4 py-3 text-right">Cost</th>
                <th class="px-4 py-3 text-right">Price</th>
                <th class="px-4 py-3">Route</th>
                <th class="px-4 py-3"></th>
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
            @forelse($products as $product)
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 font-mono text-xs text-gray-600">{{ $product->reference }}</td>
                <td class="px-4 py-3 font-medium text-gray-900">
                    <a href="{{ route('products.show', $product) }}" class="hover:text-blue-600">{{ $product->name }}</a>
                </td>
                <td class="px-4 py-3 text-gray-500">{{ $product->uom }}</td>
                <td class="px-4 py-3 text-right text-gray-700">{{ number_format($product->on_hand_qty, 1) }}</td>
                <td class="px-4 py-3 text-right text-gray-500">{{ number_format($product->reserved_qty, 1) }}</td>
                <td class="px-4 py-3 text-right font-semibold
                    {{ $product->free_to_use_qty <= 0 ? 'text-red-600' :
                       ($product->free_to_use_qty < $product->reorder_point ? 'text-amber-600' : 'text-green-700') }}">
                    {{ number_format($product->free_to_use_qty, 1) }}
                </td>
                <td class="px-4 py-3 text-right text-gray-500">{{ number_format($product->cost_price, 2) }}</td>
                <td class="px-4 py-3 text-right text-gray-700">{{ number_format($product->sales_price, 2) }}</td>
                <td class="px-4 py-3">
                    <span class="text-xs text-gray-500">{{ $product->replenishment_route }}</span>
                </td>
                <td class="px-4 py-3 text-right">
                    <a href="{{ route('products.show', $product) }}" class="text-xs text-blue-600 hover:underline">View</a>
                    @can('manage products')
                    <a href="{{ route('products.edit', $product) }}" class="text-xs text-gray-500 hover:underline ml-3">Edit</a>
                    @endcan
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="10" class="px-4 py-8 text-center text-gray-400 text-sm">No products found.</td>
            </tr>
            @endforelse
        </tbody>
    </table>
    <div class="px-4 py-3 border-t border-gray-100">
        {{ $products->links() }}
    </div>
</div>
@endsection
