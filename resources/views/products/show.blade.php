@extends('layouts.app')
@section('title', $product->reference . ' — ' . $product->name)

@section('content')
<div class="flex items-start justify-between mb-6">
    <div>
        <div class="flex items-center gap-3">
            <h1 class="text-xl font-semibold text-gray-900">{{ $product->name }}</h1>
            <span class="font-mono text-sm text-gray-400">{{ $product->reference }}</span>
        </div>
        <p class="text-sm text-gray-500 mt-1">{{ $product->category }}</p>
    </div>
    <div class="flex gap-2">
        @can('manage products')
        <a href="{{ route('products.edit', $product) }}" class="btn-secondary">Edit</a>
        @endcan
        <a href="{{ route('products.index') }}" class="btn-secondary">Back</a>
    </div>
</div>

<div class="grid grid-cols-3 gap-4 mb-6">
    <div class="card text-center">
        <p class="text-xs text-gray-400 uppercase tracking-wide mb-1">On Hand</p>
        <p class="text-2xl font-bold text-gray-900">{{ number_format($product->on_hand_qty, 1) }}</p>
        <p class="text-xs text-gray-400">{{ $product->uom }}</p>
    </div>
    <div class="card text-center">
        <p class="text-xs text-gray-400 uppercase tracking-wide mb-1">Reserved</p>
        <p class="text-2xl font-bold text-amber-600">{{ number_format($product->reserved_qty, 1) }}</p>
        <p class="text-xs text-gray-400">{{ $product->uom }}</p>
    </div>
    <div class="card text-center">
        <p class="text-xs text-gray-400 uppercase tracking-wide mb-1">Free to Use</p>
        <p class="text-2xl font-bold {{ $product->free_to_use_qty <= 0 ? 'text-red-600' : 'text-green-700' }}">
            {{ number_format($product->free_to_use_qty, 1) }}
        </p>
        <p class="text-xs text-gray-400">Algorithm 1: OnHand - Reserved</p>
    </div>
</div>

<div class="grid grid-cols-2 gap-4 mb-6">
    <div class="card">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Product Details</h3>
        <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
                <dt class="text-gray-500">Unit of Measure</dt>
                <dd class="text-gray-900">{{ $product->uom }}</dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-gray-500">Cost price</dt>
                <dd class="text-gray-900">{{ number_format($product->cost_price, 2) }}</dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-gray-500">Sales price</dt>
                <dd class="text-gray-900">{{ number_format($product->sales_price, 2) }}</dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-gray-500">Reorder point</dt>
                <dd class="font-medium text-gray-900">{{ number_format($product->reorder_point, 1) }}</dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-gray-500">Safety stock</dt>
                <dd class="text-gray-900">{{ number_format($product->safety_stock, 1) }}</dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-gray-500">Lead time</dt>
                <dd class="text-gray-900">{{ $product->lead_time_days }} days</dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-gray-500">Replenishment</dt>
                <dd class="text-gray-900">{{ $product->replenishment_route }}</dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-gray-500">Procure on demand</dt>
                <dd class="text-gray-900">{{ $product->procure_on_demand ? 'Yes' : 'No' }}</dd>
            </div>
            @if($product->preferredVendor)
            <div class="flex justify-between">
                <dt class="text-gray-500">Preferred vendor</dt>
                <dd class="text-gray-900">{{ $product->preferredVendor->name }}</dd>
            </div>
            @endif
        </dl>
    </div>

    @can('manage stock')
    <div class="card">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Stock Adjustment</h3>
        <form method="POST" action="{{ route('stock-ledger.adjust') }}" class="space-y-3">
            @csrf
            <input type="hidden" name="product_id" value="{{ $product->id }}">
            <div>
                <label class="form-label">Delta (positive = in, negative = out)</label>
                <input type="number" name="delta" step="0.001" placeholder="e.g. +10 or -5" class="form-input" required>
            </div>
            <div>
                <label class="form-label">Reason</label>
                <input type="text" name="reason" placeholder="Physical count correction, shrinkage, etc." class="form-input" required>
            </div>
            <button type="submit" class="btn-secondary w-full justify-center"
                onclick="return confirm('Post this stock adjustment?')">
                Post adjustment
            </button>
        </form>
    </div>
    @endcan
</div>

<div class="card">
    <h3 class="text-sm font-semibold text-gray-700 mb-4">Recent Stock Movements</h3>
    @if($recentLedger->count())
    <table class="w-full text-sm">
        <thead>
            <tr class="text-left text-xs font-medium text-gray-400 uppercase border-b border-gray-100">
                <th class="pb-2 pr-4">Date</th>
                <th class="pb-2 pr-4">Delta</th>
                <th class="pb-2 pr-4">Balance after</th>
                <th class="pb-2 pr-4">Reason</th>
                <th class="pb-2">Source</th>
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
            @foreach($recentLedger as $entry)
            <tr class="{{ $entry->anomaly_flagged ? 'bg-amber-50' : '' }}">
                <td class="py-2 pr-4 text-gray-400 text-xs">{{ $entry->created_at->format('d M y H:i') }}</td>
                <td class="py-2 pr-4 font-mono font-semibold {{ $entry->delta < 0 ? 'text-red-600' : 'text-green-700' }}">
                    {{ $entry->delta >= 0 ? '+' : '' }}{{ number_format($entry->delta, 1) }}
                    @if($entry->anomaly_flagged)
                    <span class="ml-1 text-xs text-amber-600 font-normal">[anomaly]</span>
                    @endif
                </td>
                <td class="py-2 pr-4 text-gray-700">{{ number_format($entry->balance_after, 1) }}</td>
                <td class="py-2 pr-4 text-gray-500">{{ $entry->reason }}</td>
                <td class="py-2 text-xs text-gray-400">{{ $entry->source_document }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    <div class="mt-3">
        <a href="{{ route('stock-ledger.index', ['product_id' => $product->id]) }}"
           class="text-xs text-blue-600 hover:underline">View full ledger</a>
    </div>
    @else
    <p class="text-sm text-gray-400">No stock movements recorded yet.</p>
    @endif
</div>
@endsection
