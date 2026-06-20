@extends('layouts.app')
@section('title', $bom->reference)

@section('content')
<div class="flex items-start justify-between mb-6">
    <div>
        <h1 class="text-xl font-semibold text-gray-900">{{ $bom->reference }}</h1>
        <p class="text-sm text-gray-500 mt-1">
            Produces: <span class="font-medium">{{ $bom->finishedProduct->name }}</span>
            — {{ number_format($bom->base_qty, 1) }} {{ $bom->uom }} per run
        </p>
    </div>
    <div class="flex gap-2">
        @can('manage bom')
        <a href="{{ route('bom.edit', $bom) }}" class="btn-secondary">Edit</a>
        @endcan
        <a href="{{ route('bom.index') }}" class="btn-secondary">Back</a>
    </div>
</div>

<div class="grid grid-cols-2 gap-4">
    <div class="card">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Components</h3>
        <table class="w-full text-sm">
            <thead>
                <tr class="text-left text-xs font-medium text-gray-400 uppercase border-b border-gray-100">
                    <th class="pb-2 pr-4">Component</th>
                    <th class="pb-2 pr-4 text-right">Qty</th>
                    <th class="pb-2 pr-4 text-right">Free to use</th>
                    <th class="pb-2">Status</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
                @foreach($bom->components as $comp)
                <tr>
                    <td class="py-2 pr-4">
                        <a href="{{ route('products.show', $comp->component) }}" class="text-blue-600 hover:underline text-xs">
                            {{ $comp->component->reference }}
                        </a>
                        <span class="text-gray-700 ml-1">{{ $comp->component->name }}</span>
                    </td>
                    <td class="py-2 pr-4 text-right text-gray-700">{{ number_format($comp->to_consume_qty, 1) }} {{ $comp->uom }}</td>
                    <td class="py-2 pr-4 text-right text-gray-500">{{ number_format($comp->component->free_to_use_qty, 1) }}</td>
                    <td class="py-2">
                        @php $ftu = $comp->component->free_to_use_qty @endphp
                        <span class="badge-{{ $ftu >= $comp->to_consume_qty ? 'available' : ($ftu > 0 ? 'partial' : 'unavailable') }}">
                            {{ $ftu >= $comp->to_consume_qty ? 'available' : ($ftu > 0 ? 'partial' : 'unavailable') }}
                        </span>
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    @if($bom->operations->count())
    <div class="card">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Operations</h3>
        <table class="w-full text-sm">
            <thead>
                <tr class="text-left text-xs font-medium text-gray-400 uppercase border-b border-gray-100">
                    <th class="pb-2 pr-4">#</th>
                    <th class="pb-2 pr-4">Operation</th>
                    <th class="pb-2 pr-4">Work center</th>
                    <th class="pb-2">Duration</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
                @foreach($bom->operations as $op)
                <tr>
                    <td class="py-2 pr-4 text-gray-400">{{ $op->sequence }}</td>
                    <td class="py-2 pr-4 text-gray-700">{{ $op->operation_name }}</td>
                    <td class="py-2 pr-4 text-gray-500">{{ $op->workCenter?->name ?? '—' }}</td>
                    <td class="py-2 text-gray-500">{{ $op->expected_duration_mins ? $op->expected_duration_mins . ' min' : '—' }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif
</div>
@endsection
