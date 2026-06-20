@extends('layouts.app')
@section('title', 'Stock Ledger')

@section('content')
<div class="flex items-center justify-between mb-6">
    <h1 class="text-xl font-semibold text-gray-900">Stock Ledger</h1>
</div>

<form method="GET" class="flex flex-wrap gap-3 mb-4">
    <select name="product_id" class="form-select w-64">
        <option value="">All products</option>
        @foreach($products as $id => $name)
        <option value="{{ $id }}" {{ request('product_id') == $id ? 'selected' : '' }}>{{ $name }}</option>
        @endforeach
    </select>
    <select name="type" class="form-select w-36">
        <option value="">All movements</option>
        <option value="in" {{ request('type') === 'in' ? 'selected' : '' }}>Stock in</option>
        <option value="out" {{ request('type') === 'out' ? 'selected' : '' }}>Stock out</option>
        <option value="anomaly" {{ request('type') === 'anomaly' ? 'selected' : '' }}>Anomalies only</option>
    </select>
    <input type="date" name="date_from" value="{{ request('date_from') }}" class="form-input w-36" placeholder="From">
    <input type="date" name="date_to" value="{{ request('date_to') }}" class="form-input w-36" placeholder="To">
    <button type="submit" class="btn-secondary">Filter</button>
    @if(request()->hasAny(['product_id','type','date_from','date_to']))
    <a href="{{ route('stock-ledger.index') }}" class="btn-secondary">Clear</a>
    @endif
</form>

<div class="card p-0">
    <table class="w-full text-sm">
        <thead>
            <tr class="text-left text-xs font-medium text-gray-400 uppercase border-b border-gray-100">
                <th class="px-4 py-3">Date/Time</th>
                <th class="px-4 py-3">Product</th>
                <th class="px-4 py-3 text-right">Delta</th>
                <th class="px-4 py-3 text-right">Balance after</th>
                <th class="px-4 py-3">Reason</th>
                <th class="px-4 py-3">Source doc</th>
                <th class="px-4 py-3">User</th>
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
            @forelse($entries as $entry)
            <tr class="hover:bg-gray-50 {{ $entry->anomaly_flagged ? 'bg-amber-50 hover:bg-amber-50' : '' }}">
                <td class="px-4 py-3 text-xs text-gray-400">{{ $entry->created_at->format('d M y H:i') }}</td>
                <td class="px-4 py-3">
                    <a href="{{ route('products.show', $entry->product) }}" class="text-blue-600 hover:underline text-xs">
                        {{ $entry->product->reference }}
                    </a>
                    <span class="text-gray-600 ml-1">{{ $entry->product->name }}</span>
                </td>
                <td class="px-4 py-3 text-right font-mono font-semibold
                    {{ $entry->delta < 0 ? 'text-red-600' : 'text-green-700' }}">
                    {{ $entry->delta >= 0 ? '+' : '' }}{{ number_format($entry->delta, 1) }}
                    @if($entry->anomaly_flagged)
                    <span class="block text-xs font-normal text-amber-600">anomaly</span>
                    @endif
                </td>
                <td class="px-4 py-3 text-right text-gray-700">{{ number_format($entry->balance_after, 1) }}</td>
                <td class="px-4 py-3 text-gray-600 max-w-xs truncate">{{ $entry->reason }}</td>
                <td class="px-4 py-3 text-xs text-gray-400">{{ $entry->source_document }}</td>
                <td class="px-4 py-3 text-xs text-gray-400">{{ $entry->createdBy?->name ?? 'System' }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="7" class="px-4 py-8 text-center text-gray-400 text-sm">No ledger entries found.</td>
            </tr>
            @endforelse
        </tbody>
    </table>
    <div class="px-4 py-3 border-t border-gray-100">{{ $entries->links() }}</div>
</div>
@endsection
