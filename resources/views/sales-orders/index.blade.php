@extends('layouts.app')
@section('title', 'Sales Orders')

@section('content')
<div class="flex items-center justify-between mb-6">
    <h1 class="text-xl font-semibold text-gray-900">Sales Orders</h1>
    @can('manage sales orders')
    <a href="{{ route('sales-orders.create') }}" class="btn-primary">+ New SO</a>
    @endcan
</div>

<form method="GET" class="flex flex-wrap gap-3 mb-4">
    <input type="text" name="search" value="{{ request('search') }}"
        placeholder="Search by reference..." class="form-input w-48">
    <select name="customer_id" class="form-select w-52">
        <option value="">All customers</option>
        @foreach($customers as $id => $name)
        <option value="{{ $id }}" {{ request('customer_id') == $id ? 'selected' : '' }}>{{ $name }}</option>
        @endforeach
    </select>
    <select name="status" class="form-select w-48">
        <option value="">All statuses</option>
        @foreach($statuses as $s)
        <option value="{{ $s }}" {{ request('status') === $s ? 'selected' : '' }}>{{ $s }}</option>
        @endforeach
    </select>
    <button type="submit" class="btn-secondary">Filter</button>
    @if(request()->hasAny(['search','customer_id','status']))
    <a href="{{ route('sales-orders.index') }}" class="btn-secondary">Clear</a>
    @endif
</form>

<div class="card p-0">
    <table class="w-full text-sm">
        <thead>
            <tr class="text-left text-xs font-medium text-gray-400 uppercase border-b border-gray-100">
                <th class="px-4 py-3">Reference</th>
                <th class="px-4 py-3">Customer</th>
                <th class="px-4 py-3">Order Date</th>
                <th class="px-4 py-3">Delivery Date</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3 text-right">Total</th>
                <th class="px-4 py-3"></th>
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
            @forelse($salesOrders as $so)
            <tr class="hover:bg-gray-50 {{ $so->isLate() ? 'bg-red-50 hover:bg-red-50' : '' }}">
                <td class="px-4 py-3 font-mono text-xs text-gray-700">
                    <a href="{{ route('sales-orders.show', $so) }}" class="hover:text-blue-600 font-medium">
                        {{ $so->reference }}
                    </a>
                    @if($so->isLate())
                    <span class="ml-2 badge-late">LATE</span>
                    @endif
                </td>
                <td class="px-4 py-3 text-gray-700">{{ $so->customer->name }}</td>
                <td class="px-4 py-3 text-gray-500 text-xs">{{ $so->order_date?->format('d M y') }}</td>
                <td class="px-4 py-3 text-xs {{ $so->isLate() ? 'text-red-600 font-medium' : 'text-gray-500' }}">
                    {{ $so->expected_delivery_date?->format('d M y') ?? '—' }}
                </td>
                <td class="px-4 py-3">
                    <span class="badge-{{ strtolower(str_replace([' ', '-'], '', $so->status)) }}">
                        {{ $so->status }}
                    </span>
                </td>
                <td class="px-4 py-3 text-right text-gray-700">
                    {{ number_format($so->lines->sum(fn($l) => $l->ordered_qty * $l->unit_price), 2) }}
                </td>
                <td class="px-4 py-3 text-right">
                    <a href="{{ route('sales-orders.show', $so) }}" class="text-xs text-blue-600 hover:underline">View</a>
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="7" class="px-4 py-8 text-center text-gray-400 text-sm">No sales orders found.</td>
            </tr>
            @endforelse
        </tbody>
    </table>
    <div class="px-4 py-3 border-t border-gray-100">{{ $salesOrders->links() }}</div>
</div>
@endsection
