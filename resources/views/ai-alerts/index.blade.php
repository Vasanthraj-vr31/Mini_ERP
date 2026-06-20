@extends('layouts.app')
@section('title', 'AI Alerts')

@section('content')
<div class="flex items-center justify-between mb-6">
    <h1 class="text-xl font-semibold text-gray-900">AI Alerts</h1>
    @can('resolve ai alerts')
    <form method="POST" action="{{ route('ai-alerts.run-forecast') }}">
        @csrf
        <button type="submit" class="btn-primary">Run forecast now</button>
    </form>
    @endcan
</div>

<form method="GET" class="flex flex-wrap gap-3 mb-4">
    <select name="alert_type" class="form-select w-44">
        <option value="">All types</option>
        @foreach($alertTypes as $type)
        <option value="{{ $type }}" {{ request('alert_type') === $type ? 'selected' : '' }}>{{ $type }}</option>
        @endforeach
    </select>
    <select name="product_id" class="form-select w-56">
        <option value="">All products</option>
        @foreach($products as $id => $name)
        <option value="{{ $id }}" {{ request('product_id') == $id ? 'selected' : '' }}>{{ $name }}</option>
        @endforeach
    </select>
    <select name="is_resolved" class="form-select w-36">
        <option value="0" {{ request('is_resolved') !== '1' ? 'selected' : '' }}>Open</option>
        <option value="1" {{ request('is_resolved') === '1' ? 'selected' : '' }}>Resolved</option>
    </select>
    <button type="submit" class="btn-secondary">Filter</button>
</form>

<div class="space-y-3">
    @forelse($alerts as $alert)
    <div class="flex items-start gap-4 px-4 py-4 rounded-lg border
        {{ $alert->alert_type === 'stockout_risk' ? 'bg-red-50 border-red-200' :
           ($alert->alert_type === 'anomaly' ? 'bg-amber-50 border-amber-200' :
           ($alert->alert_type === 'demand_spike' ? 'bg-orange-50 border-orange-200' :
           'bg-blue-50 border-blue-200')) }}">
        <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-semibold uppercase tracking-wide
                    {{ $alert->alert_type === 'stockout_risk' ? 'text-red-600' :
                       ($alert->alert_type === 'anomaly' ? 'text-amber-600' :
                       ($alert->alert_type === 'demand_spike' ? 'text-orange-600' :
                       'text-blue-600')) }}">
                    {{ str_replace('_', ' ', $alert->alert_type) }}
                </span>
                @if($alert->product)
                <span class="text-xs text-gray-400">—</span>
                <a href="{{ route('products.show', $alert->product) }}" class="text-xs text-gray-500 hover:underline">
                    {{ $alert->product->reference }}
                </a>
                @endif
                <span class="ml-auto text-xs text-gray-400">{{ $alert->created_at->diffForHumans() }}</span>
            </div>
            <p class="text-sm font-medium text-gray-900">{{ $alert->message }}</p>
            @if($alert->reason)
            <p class="text-xs text-gray-600 mt-1">{{ $alert->reason }}</p>
            @endif
            @if($alert->suggested_qty)
            <p class="text-xs text-gray-500 mt-1">
                Suggested quantity: <span class="font-medium text-gray-700">{{ number_format($alert->suggested_qty, 1) }}</span>
            </p>
            @endif
            @if($alert->is_resolved)
            <p class="text-xs text-green-600 mt-1">
                Resolved {{ $alert->resolved_at?->diffForHumans() }}
            </p>
            @endif
        </div>
        @if(!$alert->is_resolved)
        @can('resolve ai alerts')
        <form method="POST" action="{{ route('ai-alerts.resolve', $alert) }}" class="shrink-0">
            @csrf
            <button type="submit" class="btn-secondary text-xs py-1 px-3">Resolve</button>
        </form>
        @endcan
        @endif
    </div>
    @empty
    <div class="card text-center py-8">
        <p class="text-gray-400 text-sm">No alerts to show.</p>
    </div>
    @endforelse
</div>

@if($alerts->hasPages())
<div class="mt-4">{{ $alerts->links() }}</div>
@endif
@endsection
