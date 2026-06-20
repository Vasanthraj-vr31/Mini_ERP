@extends('layouts.app')
@section('title', $purchaseOrder->reference)

@section('content')
<div class="flex items-start justify-between mb-6">
    <div>
        <div class="flex items-center gap-3">
            <h1 class="text-xl font-semibold text-gray-900">{{ $purchaseOrder->reference }}</h1>
            <span class="badge-{{ strtolower(str_replace([' ', '-'], '', $purchaseOrder->status)) }}">
                {{ $purchaseOrder->status }}
            </span>
            @if($purchaseOrder->isLate())<span class="badge-late">LATE</span>@endif
        </div>
        <p class="text-sm text-gray-500 mt-1">{{ $purchaseOrder->vendor->name }}</p>
        @if($purchaseOrder->source_document)
        <p class="text-xs text-gray-400 mt-0.5">Auto-raised for: {{ $purchaseOrder->source_document }}</p>
        @endif
    </div>
    <div class="flex gap-2 flex-wrap">
        @if($purchaseOrder->status === 'Draft')
            @can('manage purchase orders')
            <a href="{{ route('purchase-orders.edit', $purchaseOrder) }}" class="btn-secondary">Edit</a>
            @endcan
            @can('manage purchase orders')
            <form method="POST" action="{{ route('purchase-orders.confirm', $purchaseOrder) }}">
                @csrf
                <button type="submit" class="btn-primary">Confirm PO</button>
            </form>
            @endcan
        @endif
        @if(in_array($purchaseOrder->status, ['Confirmed', 'Partially Received']))
            @can('manage purchase orders')
            <button onclick="document.getElementById('receive-modal').classList.remove('hidden')" class="btn-success">
                Receive goods
            </button>
            @endcan
        @endif
        @if(!in_array($purchaseOrder->status, ['Received', 'Cancelled']))
            @can('manage purchase orders')
            <form method="POST" action="{{ route('purchase-orders.cancel', $purchaseOrder) }}">
                @csrf
                <button type="submit" class="btn-danger"
                    onclick="return confirm('Cancel this purchase order?')">Cancel</button>
            </form>
            @endcan
        @endif
        <a href="{{ route('purchase-orders.index') }}" class="btn-secondary">Back</a>
    </div>
</div>

<div class="grid grid-cols-2 gap-4 mb-6">
    <div class="card">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">Order details</h3>
        <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
                <dt class="text-gray-500">Vendor</dt>
                <dd class="text-gray-900">{{ $purchaseOrder->vendor->name }}</dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-gray-500">Order date</dt>
                <dd class="text-gray-900">{{ $purchaseOrder->order_date?->format('d M Y') }}</dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-gray-500">Expected receipt</dt>
                <dd class="{{ $purchaseOrder->isLate() ? 'text-red-600 font-medium' : 'text-gray-900' }}">
                    {{ $purchaseOrder->expected_receipt_date?->format('d M Y') ?? '—' }}
                </dd>
            </div>
            @if($purchaseOrder->agent)
            <div class="flex justify-between">
                <dt class="text-gray-500">Purchase agent</dt>
                <dd class="text-gray-900">{{ $purchaseOrder->agent->name }}</dd>
            </div>
            @endif
        </dl>
    </div>
    <div class="card">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">Order total</h3>
        <p class="text-2xl font-bold text-gray-900">
            {{ number_format($purchaseOrder->lines->sum(fn($l) => $l->ordered_qty * $l->cost_price), 2) }}
        </p>
        @if($purchaseOrder->notes)
        <p class="text-xs text-gray-500 mt-3">{{ $purchaseOrder->notes }}</p>
        @endif
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
                <th class="pb-2 pr-4 text-right">Received</th>
                <th class="pb-2 pr-4 text-right">Pending</th>
                <th class="pb-2 pr-4 text-right">Unit cost</th>
                <th class="pb-2 text-right">Line total</th>
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
            @foreach($purchaseOrder->lines as $line)
            <tr>
                <td class="py-2 pr-4">
                    <a href="{{ route('products.show', $line->product) }}" class="text-blue-600 hover:underline">
                        {{ $line->product->reference }}
                    </a>
                    <span class="text-gray-700 ml-1">{{ $line->product->name }}</span>
                </td>
                <td class="py-2 pr-4 text-gray-400">{{ $line->uom }}</td>
                <td class="py-2 pr-4 text-right text-gray-700">{{ number_format($line->ordered_qty, 1) }}</td>
                <td class="py-2 pr-4 text-right text-gray-500">{{ number_format($line->received_qty, 1) }}</td>
                <td class="py-2 pr-4 text-right {{ $line->pending_qty > 0 ? 'text-amber-600 font-medium' : 'text-gray-400' }}">
                    {{ number_format($line->pending_qty, 1) }}
                </td>
                <td class="py-2 pr-4 text-right text-gray-500">{{ number_format($line->cost_price, 2) }}</td>
                <td class="py-2 text-right font-medium text-gray-900">
                    {{ number_format($line->ordered_qty * $line->cost_price, 2) }}
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>

@can('manage purchase orders')
<div id="receive-modal" class="hidden fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4">
        <h3 class="text-base font-semibold text-gray-900 mb-4">Receive goods</h3>
        <form method="POST" action="{{ route('purchase-orders.receive', $purchaseOrder) }}">
            @csrf
            <div class="space-y-3 mb-4">
                @foreach($purchaseOrder->lines as $line)
                @if($line->pending_qty > 0)
                <div>
                    <input type="hidden" name="receipts[{{ $loop->index }}][line_id]" value="{{ $line->id }}">
                    <label class="form-label">{{ $line->product->name }} (pending: {{ number_format($line->pending_qty, 1) }} {{ $line->uom }})</label>
                    <input type="number" name="receipts[{{ $loop->index }}][qty]"
                        value="{{ $line->pending_qty }}" min="0" max="{{ $line->pending_qty }}"
                        step="0.001" class="form-input">
                </div>
                @endif
                @endforeach
            </div>
            <div class="flex justify-end gap-3">
                <button type="button" onclick="document.getElementById('receive-modal').classList.add('hidden')"
                    class="btn-secondary">Cancel</button>
                <button type="submit" class="btn-success">Confirm receipt</button>
            </div>
        </form>
    </div>
</div>
@endcan

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
