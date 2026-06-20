@extends('layouts.app')
@section('title', 'Purchase Orders')

@section('content')
<div class="flex items-center justify-between mb-6">
    <h1 class="text-xl font-semibold text-gray-900">Purchase Orders</h1>
    @can('manage purchase orders')
    <a href="{{ route('purchase-orders.create') }}" class="btn-primary">+ New PO</a>
    @endcan
</div>

<form method="GET" class="flex flex-wrap gap-3 mb-4">
    <input type="text" name="search" value="{{ request('search') }}"
        placeholder="Search by reference..." class="form-input w-48">
    <select name="vendor_id" class="form-select w-52">
        <option value="">All vendors</option>
        @foreach($vendors as $id => $name)
        <option value="{{ $id }}" {{ request('vendor_id') == $id ? 'selected' : '' }}>{{ $name }}</option>
        @endforeach
    </select>
    <select name="status" class="form-select w-48">
        <option value="">All statuses</option>
        @foreach($statuses as $s)
        <option value="{{ $s }}" {{ request('status') === $s ? 'selected' : '' }}>{{ $s }}</option>
        @endforeach
    </select>
    <button type="submit" class="btn-secondary">Filter</button>
    @if(request()->hasAny(['search','vendor_id','status']))
    <a href="{{ route('purchase-orders.index') }}" class="btn-secondary">Clear</a>
    @endif
</form>

<div class="card p-0">
    <table class="w-full text-sm">
        <thead>
            <tr class="text-left text-xs font-medium text-gray-400 uppercase border-b border-gray-100">
                <th class="px-4 py-3">Reference</th>
                <th class="px-4 py-3">Vendor</th>
                <th class="px-4 py-3">Order Date</th>
                <th class="px-4 py-3">Expected Receipt</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3">Source</th>
                <th class="px-4 py-3 text-right">Total</th>
                <th class="px-4 py-3"></th>
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
            @forelse($purchaseOrders as $po)
            <tr class="hover:bg-gray-50 {{ $po->isLate() ? 'bg-red-50 hover:bg-red-50' : '' }}">
                <td class="px-4 py-3 font-mono text-xs">
                    <a href="{{ route('purchase-orders.show', $po) }}" class="text-blue-600 hover:underline font-medium">
                        {{ $po->reference }}
                    </a>
                    @if($po->isLate())<span class="ml-2 badge-late">LATE</span>@endif
                </td>
                <td class="px-4 py-3 text-gray-700">{{ $po->vendor->name }}</td>
                <td class="px-4 py-3 text-gray-400 text-xs">{{ $po->order_date?->format('d M y') }}</td>
                <td class="px-4 py-3 text-xs {{ $po->isLate() ? 'text-red-600 font-medium' : 'text-gray-400' }}">
                    {{ $po->expected_receipt_date?->format('d M y') ?? '—' }}
                </td>
                <td class="px-4 py-3">
                    <span class="badge-{{ strtolower(str_replace([' ', '-'], '', $po->status)) }}">
                        {{ $po->status }}
                    </span>
                </td>
                <td class="px-4 py-3 text-xs text-gray-400">{{ $po->source_document }}</td>
                <td class="px-4 py-3 text-right text-gray-700">
                    {{ number_format($po->lines->sum(fn($l) => $l->ordered_qty * $l->cost_price), 2) }}
                </td>
                <td class="px-4 py-3 text-right">
                    <a href="{{ route('purchase-orders.show', $po) }}" class="text-xs text-blue-600 hover:underline">View</a>
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="8" class="px-4 py-8 text-center text-gray-400 text-sm">No purchase orders found.</td>
            </tr>
            @endforelse
        </tbody>
    </table>
    <div class="px-4 py-3 border-t border-gray-100">{{ $purchaseOrders->links() }}</div>
</div>
@endsection
