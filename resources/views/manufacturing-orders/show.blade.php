@extends('layouts.app')
@section('title', $manufacturingOrder->reference)

@section('content')
<div class="flex items-start justify-between mb-6">
    <div>
        <div class="flex items-center gap-3">
            <h1 class="text-xl font-semibold text-gray-900">{{ $manufacturingOrder->reference }}</h1>
            <span class="badge-{{ strtolower(str_replace([' ', '-'], '', $manufacturingOrder->status)) }}">
                {{ $manufacturingOrder->status }}
            </span>
        </div>
        <p class="text-sm text-gray-500 mt-1">
            {{ $manufacturingOrder->finishedProduct->name }} —
            {{ number_format($manufacturingOrder->target_qty, 1) }} {{ $manufacturingOrder->uom }}
        </p>
        @if($manufacturingOrder->source_document)
        <p class="text-xs text-gray-400 mt-0.5">Auto-raised for: {{ $manufacturingOrder->source_document }}</p>
        @endif
    </div>
    <div class="flex gap-2 flex-wrap">
        @if($manufacturingOrder->status === 'Draft')
            @can('manage manufacturing orders')
            <form method="POST" action="{{ route('manufacturing-orders.confirm', $manufacturingOrder) }}">
                @csrf
                <button type="submit" class="btn-primary"
                    onclick="return confirm('Confirm this MO? Component stock will be reserved.')">
                    Confirm
                </button>
            </form>
            @endcan
        @endif
        @if($manufacturingOrder->status === 'Confirmed')
            @can('manage manufacturing orders')
            <form method="POST" action="{{ route('manufacturing-orders.start', $manufacturingOrder) }}">
                @csrf
                <button type="submit" class="btn-primary">Start production</button>
            </form>
            @endcan
        @endif
        @if(in_array($manufacturingOrder->status, ['In-Progress', 'To Close']))
            @can('manage manufacturing orders')
            <form method="POST" action="{{ route('manufacturing-orders.close', $manufacturingOrder) }}">
                @csrf
                <button type="submit" class="btn-success"
                    onclick="return confirm('Close this MO? Components will be consumed and finished goods added to stock.')">
                    Close &amp; produce
                </button>
            </form>
            @endcan
        @endif
        @if(!in_array($manufacturingOrder->status, ['Done', 'Cancelled']))
            @can('manage manufacturing orders')
            <form method="POST" action="{{ route('manufacturing-orders.cancel', $manufacturingOrder) }}">
                @csrf
                <button type="submit" class="btn-danger"
                    onclick="return confirm('Cancel this MO?')">Cancel</button>
            </form>
            @endcan
        @endif
        <a href="{{ route('manufacturing-orders.index') }}" class="btn-secondary">Back</a>
    </div>
</div>

<div class="grid grid-cols-2 gap-4 mb-6">
    <div class="card">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">MO details</h3>
        <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
                <dt class="text-gray-500">Finished product</dt>
                <dd>
                    <a href="{{ route('products.show', $manufacturingOrder->finishedProduct) }}"
                       class="text-blue-600 hover:underline">
                        {{ $manufacturingOrder->finishedProduct->reference }}
                    </a>
                    <span class="text-gray-700 ml-1">{{ $manufacturingOrder->finishedProduct->name }}</span>
                </dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-gray-500">Target quantity</dt>
                <dd class="font-medium text-gray-900">{{ number_format($manufacturingOrder->target_qty, 1) }} {{ $manufacturingOrder->uom }}</dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-gray-500">BoM</dt>
                <dd class="text-gray-900">{{ $manufacturingOrder->bom?->reference ?? '—' }}</dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-gray-500">Scheduled date</dt>
                <dd class="text-gray-900">{{ $manufacturingOrder->scheduled_date?->format('d M Y') ?? '—' }}</dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-gray-500">Assignee</dt>
                <dd class="text-gray-900">{{ $manufacturingOrder->assignee?->name ?? '—' }}</dd>
            </div>
        </dl>
    </div>
    <div class="card">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">Component availability</h3>
        @foreach($manufacturingOrder->components as $comp)
        <div class="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
            <span class="text-sm text-gray-700">{{ $comp->product->name }}</span>
            <div class="flex items-center gap-3 text-xs">
                <span class="text-gray-400">Need: {{ number_format($comp->to_consume_qty, 1) }}</span>
                <span class="text-gray-400">Free: {{ number_format($comp->product->free_to_use_qty, 1) }}</span>
                <span class="badge-{{ $comp->availability_status }}">{{ $comp->availability_status }}</span>
            </div>
        </div>
        @endforeach
    </div>
</div>

@if($manufacturingOrder->workOrders->count())
<div class="card mb-6">
    <h3 class="text-sm font-semibold text-gray-700 mb-4">Work orders</h3>
    <table class="w-full text-sm">
        <thead>
            <tr class="text-left text-xs font-medium text-gray-400 uppercase border-b border-gray-100">
                <th class="pb-2 pr-4">#</th>
                <th class="pb-2 pr-4">Operation</th>
                <th class="pb-2 pr-4">Work center</th>
                <th class="pb-2">Duration (min)</th>
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
            @foreach($manufacturingOrder->workOrders as $wo)
            <tr>
                <td class="py-2 pr-4 text-gray-400">{{ $wo->sequence }}</td>
                <td class="py-2 pr-4 text-gray-700">{{ $wo->operation_name }}</td>
                <td class="py-2 pr-4 text-gray-500">{{ $wo->workCenter?->name ?? '—' }}</td>
                <td class="py-2 text-gray-500">{{ $wo->expected_duration_mins ?? '—' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>
@endif

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
