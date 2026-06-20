@extends('layouts.app')
@section('title', $salesOrder->reference)

@section('content')
<div class="flex items-start justify-between mb-6">
    <div>
        <div class="flex items-center gap-3">
            <h1 class="text-xl font-semibold text-gray-900">{{ $salesOrder->reference }}</h1>
            <span class="badge-{{ strtolower(str_replace([' ', '-'], '', $salesOrder->status)) }}">
                {{ $salesOrder->status }}
            </span>
            @if($salesOrder->isLate())
            <span class="badge-late">LATE</span>
            @endif
        </div>
        <p class="text-sm text-gray-500 mt-1">{{ $salesOrder->customer->name }}</p>
    </div>
    <div class="flex gap-2 flex-wrap">
        @if($salesOrder->status === 'Draft')
            @can('manage sales orders')
            <a href="{{ route('sales-orders.edit', $salesOrder) }}" class="btn-secondary">Edit</a>
            @endcan
            @can('manage sales orders')
            <form method="POST" action="{{ route('sales-orders.confirm', $salesOrder) }}">
                @csrf
                <button type="submit" class="btn-primary"
                    onclick="return confirm('Confirm this order? Stock will be reserved and procurement triggered if needed.')">
                    Confirm order
                </button>
            </form>
            @endcan
        @endif
        @if(in_array($salesOrder->status, ['Confirmed', 'Partially Delivered']))
            @can('manage sales orders')
            <button onclick="document.getElementById('deliver-modal').classList.remove('hidden')" class="btn-success">
                Record delivery
            </button>
            @endcan
        @endif
        @if(!in_array($salesOrder->status, ['Delivered', 'Cancelled']))
            @can('manage sales orders')
            <form method="POST" action="{{ route('sales-orders.cancel', $salesOrder) }}">
                @csrf
                <button type="submit" class="btn-danger"
                    onclick="return confirm('Cancel this order? Reservations will be released.')">
                    Cancel
                </button>
            </form>
            @endcan
        @endif
        <a href="{{ route('sales-orders.index') }}" class="btn-secondary">Back</a>
    </div>
</div>

<div class="grid grid-cols-2 gap-4 mb-6">
    <div class="card">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">Order details</h3>
        <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
                <dt class="text-gray-500">Customer</dt>
                <dd class="text-gray-900">{{ $salesOrder->customer->name }}</dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-gray-500">Order date</dt>
                <dd class="text-gray-900">{{ $salesOrder->order_date?->format('d M Y') }}</dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-gray-500">Expected delivery</dt>
                <dd class="{{ $salesOrder->isLate() ? 'text-red-600 font-medium' : 'text-gray-900' }}">
                    {{ $salesOrder->expected_delivery_date?->format('d M Y') ?? '—' }}
                </dd>
            </div>
            @if($salesOrder->salesPerson)
            <div class="flex justify-between">
                <dt class="text-gray-500">Sales person</dt>
                <dd class="text-gray-900">{{ $salesOrder->salesPerson->name }}</dd>
            </div>
            @endif
            @if($salesOrder->shipping_address)
            <div class="flex justify-between">
                <dt class="text-gray-500">Ship to</dt>
                <dd class="text-gray-900 text-right max-w-xs">{{ $salesOrder->shipping_address }}</dd>
            </div>
            @endif
        </dl>
    </div>
    <div class="card">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">Order summary</h3>
        <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
                <dt class="text-gray-500">Lines</dt>
                <dd class="text-gray-900">{{ $salesOrder->lines->count() }}</dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-gray-500">Order total</dt>
                <dd class="text-xl font-bold text-gray-900">
                    {{ number_format($salesOrder->lines->sum(fn($l) => $l->ordered_qty * $l->unit_price), 2) }}
                </dd>
            </div>
            @if($salesOrder->notes)
            <div class="flex justify-between">
                <dt class="text-gray-500">Notes</dt>
                <dd class="text-gray-700">{{ $salesOrder->notes }}</dd>
            </div>
            @endif
        </dl>
    </div>
</div>

<div class="card mb-6">
    <h3 class="text-sm font-semibold text-gray-700 mb-4">Order lines</h3>
    <table class="w-full text-sm">
        <thead>
            <tr class="text-left text-xs font-medium text-gray-400 uppercase border-b border-gray-100">
                <th class="pb-2 pr-4">Product</th>
                <th class="pb-2 pr-4">UOM</th>
                <th class="pb-2 pr-4 text-right">Ordered</th>
                <th class="pb-2 pr-4 text-right">Delivered</th>
                <th class="pb-2 pr-4 text-right">Remaining</th>
                <th class="pb-2 pr-4 text-right">Unit price</th>
                <th class="pb-2 text-right">Line total</th>
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
            @foreach($salesOrder->lines as $line)
            <tr>
                <td class="py-2 pr-4">
                    <a href="{{ route('products.show', $line->product) }}" class="text-blue-600 hover:underline">
                        {{ $line->product->reference }}
                    </a>
                    <span class="text-gray-700 ml-1">{{ $line->product->name }}</span>
                    @if($line->product->free_to_use_qty < $line->remaining_qty && $line->remaining_qty > 0)
                    <span class="ml-2 text-xs text-amber-600">
                        ({{ number_format($line->product->free_to_use_qty, 1) }} free)
                    </span>
                    @endif
                </td>
                <td class="py-2 pr-4 text-gray-500">{{ $line->uom }}</td>
                <td class="py-2 pr-4 text-right text-gray-700">{{ number_format($line->ordered_qty, 1) }}</td>
                <td class="py-2 pr-4 text-right text-gray-500">{{ number_format($line->delivered_qty, 1) }}</td>
                <td class="py-2 pr-4 text-right {{ $line->remaining_qty > 0 ? 'text-amber-600 font-medium' : 'text-gray-400' }}">
                    {{ number_format($line->remaining_qty, 1) }}
                </td>
                <td class="py-2 pr-4 text-right text-gray-500">{{ number_format($line->unit_price, 2) }}</td>
                <td class="py-2 text-right font-medium text-gray-900">
                    {{ number_format($line->ordered_qty * $line->unit_price, 2) }}
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>

{{-- Delivery modal --}}
@can('manage sales orders')
<div id="deliver-modal" class="hidden fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4">
        <h3 class="text-base font-semibold text-gray-900 mb-4">Record delivery</h3>
        <form method="POST" action="{{ route('sales-orders.deliver', $salesOrder) }}">
            @csrf
            <div class="space-y-3 mb-4">
                @foreach($salesOrder->lines as $line)
                @if($line->remaining_qty > 0)
                <div>
                    <input type="hidden" name="deliveries[{{ $loop->index }}][line_id]" value="{{ $line->id }}">
                    <label class="form-label">{{ $line->product->name }} (remaining: {{ number_format($line->remaining_qty, 1) }} {{ $line->uom }})</label>
                    <input type="number" name="deliveries[{{ $loop->index }}][qty]"
                        value="{{ $line->remaining_qty }}" min="0" max="{{ $line->remaining_qty }}"
                        step="0.001" class="form-input">
                </div>
                @endif
                @endforeach
            </div>
            <div class="flex justify-end gap-3">
                <button type="button" onclick="document.getElementById('deliver-modal').classList.add('hidden')"
                    class="btn-secondary">Cancel</button>
                <button type="submit" class="btn-success">Confirm delivery</button>
            </div>
        </form>
    </div>
</div>
@endcan

{{-- Audit trail --}}
@if($auditLogs->count())
<div class="card">
    <h3 class="text-sm font-semibold text-gray-700 mb-3">Audit trail</h3>
    <div class="space-y-2">
        @foreach($auditLogs as $log)
        <div class="flex gap-3 text-xs text-gray-500">
            <span class="text-gray-300 shrink-0">{{ $log->created_at->format('d M y H:i') }}</span>
            <span class="text-gray-600 font-medium shrink-0">{{ $log->user?->name ?? 'System' }}</span>
            <span>{{ $log->description }}</span>
        </div>
        @endforeach
    </div>
</div>
@endif
@endsection
