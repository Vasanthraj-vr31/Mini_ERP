@extends('layouts.app')
@section('title', 'Manufacturing Orders')

@section('content')
<div class="flex items-center justify-between mb-6">
    <h1 class="text-xl font-semibold text-gray-900">Manufacturing Orders</h1>
    @can('manage manufacturing orders')
    <a href="{{ route('manufacturing-orders.create') }}" class="btn-primary">+ New MO</a>
    @endcan
</div>

<form method="GET" class="flex flex-wrap gap-3 mb-4">
    <input type="text" name="search" value="{{ request('search') }}"
        placeholder="Search by reference..." class="form-input w-48">
    <select name="status" class="form-select w-48">
        <option value="">All statuses</option>
        @foreach($statuses as $s)
        <option value="{{ $s }}" {{ request('status') === $s ? 'selected' : '' }}>{{ $s }}</option>
        @endforeach
    </select>
    <button type="submit" class="btn-secondary">Filter</button>
    @if(request()->hasAny(['search','status']))
    <a href="{{ route('manufacturing-orders.index') }}" class="btn-secondary">Clear</a>
    @endif
</form>

<div class="card p-0">
    <table class="w-full text-sm">
        <thead>
            <tr class="text-left text-xs font-medium text-gray-400 uppercase border-b border-gray-100">
                <th class="px-4 py-3">Reference</th>
                <th class="px-4 py-3">Product</th>
                <th class="px-4 py-3 text-right">Target Qty</th>
                <th class="px-4 py-3">Scheduled</th>
                <th class="px-4 py-3">Assignee</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3">Source</th>
                <th class="px-4 py-3"></th>
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
            @forelse($manufacturingOrders as $mo)
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 font-mono text-xs">
                    <a href="{{ route('manufacturing-orders.show', $mo) }}" class="text-blue-600 hover:underline font-medium">
                        {{ $mo->reference }}
                    </a>
                </td>
                <td class="px-4 py-3 text-gray-700">{{ $mo->finishedProduct->name }}</td>
                <td class="px-4 py-3 text-right text-gray-700">
                    {{ number_format($mo->target_qty, 1) }} {{ $mo->uom }}
                </td>
                <td class="px-4 py-3 text-xs text-gray-500">{{ $mo->scheduled_date?->format('d M y') }}</td>
                <td class="px-4 py-3 text-xs text-gray-500">{{ $mo->assignee?->name ?? '—' }}</td>
                <td class="px-4 py-3">
                    <span class="badge-{{ strtolower(str_replace([' ', '-'], '', $mo->status)) }}">
                        {{ $mo->status }}
                    </span>
                </td>
                <td class="px-4 py-3 text-xs text-gray-400">{{ $mo->source_document }}</td>
                <td class="px-4 py-3 text-right">
                    <a href="{{ route('manufacturing-orders.show', $mo) }}" class="text-xs text-blue-600 hover:underline">View</a>
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="8" class="px-4 py-8 text-center text-gray-400 text-sm">No manufacturing orders found.</td>
            </tr>
            @endforelse
        </tbody>
    </table>
    <div class="px-4 py-3 border-t border-gray-100">{{ $manufacturingOrders->links() }}</div>
</div>
@endsection
