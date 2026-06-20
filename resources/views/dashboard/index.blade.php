@extends('layouts.app')
@section('title', 'Dashboard')

@section('content')
{{-- Smart Alerts panel — always at top per spec --}}
@if($alerts->count())
<div class="mb-6">
    <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Smart Alerts</h2>
        @can('resolve ai alerts')
        <form method="POST" action="{{ route('ai-alerts.run-forecast') }}">
            @csrf
            <button type="submit" class="btn-secondary text-xs py-1 px-3">Run forecast now</button>
        </form>
        @endcan
    </div>
    <div class="space-y-2">
        @foreach($alerts as $alert)
        <div class="flex items-start gap-3 px-4 py-3 rounded border
            {{ $alert->alert_type === 'stockout_risk' ? 'bg-red-50 border-red-200' :
               ($alert->alert_type === 'anomaly' ? 'bg-amber-50 border-amber-200' :
               ($alert->alert_type === 'demand_spike' ? 'bg-orange-50 border-orange-200' :
                'bg-blue-50 border-blue-200')) }}">
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900">{{ $alert->message }}</p>
                @if($alert->reason)
                <p class="text-xs text-gray-500 mt-0.5">{{ $alert->reason }}</p>
                @endif
                <p class="text-xs text-gray-400 mt-1">{{ $alert->created_at->diffForHumans() }}</p>
            </div>
            @can('resolve ai alerts')
            <form method="POST" action="{{ route('ai-alerts.resolve', $alert) }}" class="shrink-0">
                @csrf
                <button type="submit" class="text-xs text-gray-400 hover:text-gray-700">Resolve</button>
            </form>
            @endcan
        </div>
        @endforeach
    </div>
    @if(\App\Models\AiAlert::where('is_resolved', false)->count() > $alerts->count())
    <div class="mt-2 text-right">
        <a href="{{ route('ai-alerts.index') }}" class="text-xs text-blue-600 hover:underline">
            View all alerts
        </a>
    </div>
    @endif
</div>
@else
<div class="mb-6 px-4 py-3 bg-green-50 border border-green-200 rounded flex items-center gap-2">
    <span class="text-sm text-green-700 font-medium">No active alerts.</span>
    <span class="text-sm text-green-600">All stock levels and movements are within normal parameters.</span>
    @can('resolve ai alerts')
    <form method="POST" action="{{ route('ai-alerts.run-forecast') }}" class="ml-auto">
        @csrf
        <button type="submit" class="text-xs text-green-600 hover:underline">Run forecast</button>
    </form>
    @endcan
</div>
@endif

{{-- Operations summary tiles --}}
<div class="grid grid-cols-3 gap-4 mb-6">
    {{-- Sales --}}
    <div class="card">
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-700">Sales Orders</h3>
            <a href="{{ route('sales-orders.index') }}" class="text-xs text-blue-600 hover:underline">View all</a>
        </div>
        <div class="space-y-2">
            @foreach($soCounts as $label => $count)
            <div class="flex justify-between items-center">
                <span class="text-xs text-gray-500">{{ $label }}</span>
                <a href="{{ route('sales-orders.index', ['status' => $label]) }}"
                   class="text-sm font-semibold {{ $label === 'Late' && $count > 0 ? 'text-red-600' : 'text-gray-900' }}">
                    {{ $count }}
                </a>
            </div>
            @endforeach
        </div>
    </div>

    {{-- Purchasing --}}
    <div class="card">
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-700">Purchase Orders</h3>
            <a href="{{ route('purchase-orders.index') }}" class="text-xs text-blue-600 hover:underline">View all</a>
        </div>
        <div class="space-y-2">
            @foreach($poCounts as $label => $count)
            <div class="flex justify-between items-center">
                <span class="text-xs text-gray-500">{{ $label }}</span>
                <a href="{{ route('purchase-orders.index', ['status' => $label]) }}"
                   class="text-sm font-semibold {{ $label === 'Late' && $count > 0 ? 'text-red-600' : 'text-gray-900' }}">
                    {{ $count }}
                </a>
            </div>
            @endforeach
        </div>
    </div>

    {{-- Manufacturing --}}
    <div class="card">
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-700">Manufacturing Orders</h3>
            <a href="{{ route('manufacturing-orders.index') }}" class="text-xs text-blue-600 hover:underline">View all</a>
        </div>
        <div class="space-y-2">
            @foreach($moCounts as $label => $count)
            <div class="flex justify-between items-center">
                <span class="text-xs text-gray-500">{{ $label }}</span>
                <a href="{{ route('manufacturing-orders.index', ['status' => $label]) }}"
                   class="text-sm font-semibold text-gray-900">{{ $count }}</a>
            </div>
            @endforeach
        </div>
    </div>
</div>

{{-- Low stock table --}}
@if($lowStockProducts->count())
<div class="card">
    <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-gray-700">Low Stock Products</h3>
        <a href="{{ route('products.index') }}" class="text-xs text-blue-600 hover:underline">View all products</a>
    </div>
    <table class="w-full text-sm">
        <thead>
            <tr class="text-left text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <th class="pb-2 pr-4">Product</th>
                <th class="pb-2 pr-4">On Hand</th>
                <th class="pb-2 pr-4">Reserved</th>
                <th class="pb-2 pr-4">Free to Use</th>
                <th class="pb-2 pr-4">Reorder Point</th>
                <th class="pb-2">Route</th>
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
            @foreach($lowStockProducts as $p)
            <tr class="hover:bg-gray-50">
                <td class="py-2 pr-4">
                    <a href="{{ route('products.show', $p) }}" class="font-medium text-blue-600 hover:underline">
                        {{ $p->reference }}
                    </a>
                    <span class="text-gray-500 ml-1">{{ $p->name }}</span>
                </td>
                <td class="py-2 pr-4 text-gray-700">{{ number_format($p->on_hand_qty, 1) }}</td>
                <td class="py-2 pr-4 text-gray-500">{{ number_format($p->reserved_qty, 1) }}</td>
                <td class="py-2 pr-4 font-semibold text-red-600">{{ number_format($p->free_to_use_qty, 1) }}</td>
                <td class="py-2 pr-4 text-gray-500">{{ number_format($p->reorder_point, 1) }}</td>
                <td class="py-2">
                    <span class="badge-{{ strtolower($p->replenishment_route === 'Vendor' ? 'available' : 'inprogress') }}">
                        {{ $p->replenishment_route }}
                    </span>
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>
@endif
@endsection
