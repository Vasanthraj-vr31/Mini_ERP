@extends('layouts.app')
@section('title', 'Bills of Materials')

@section('content')
<div class="flex items-center justify-between mb-6">
    <h1 class="text-xl font-semibold text-gray-900">Bills of Materials</h1>
    @can('manage bom')
    <a href="{{ route('bom.create') }}" class="btn-primary">+ New BoM</a>
    @endcan
</div>

<div class="card p-0">
    <table class="w-full text-sm">
        <thead>
            <tr class="text-left text-xs font-medium text-gray-400 uppercase border-b border-gray-100">
                <th class="px-4 py-3">Reference</th>
                <th class="px-4 py-3">Finished product</th>
                <th class="px-4 py-3 text-right">Base qty</th>
                <th class="px-4 py-3 text-right">Components</th>
                <th class="px-4 py-3"></th>
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
            @forelse($boms as $bom)
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 font-mono text-xs text-gray-600">
                    <a href="{{ route('bom.show', $bom) }}" class="hover:text-blue-600 font-medium">
                        {{ $bom->reference }}
                    </a>
                </td>
                <td class="px-4 py-3 text-gray-700">{{ $bom->finishedProduct->name }}</td>
                <td class="px-4 py-3 text-right text-gray-500">{{ number_format($bom->base_qty, 1) }} {{ $bom->uom }}</td>
                <td class="px-4 py-3 text-right text-gray-500">{{ $bom->components->count() }}</td>
                <td class="px-4 py-3 text-right">
                    <a href="{{ route('bom.show', $bom) }}" class="text-xs text-blue-600 hover:underline">View</a>
                    @can('manage bom')
                    <a href="{{ route('bom.edit', $bom) }}" class="text-xs text-gray-500 hover:underline ml-3">Edit</a>
                    @endcan
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="5" class="px-4 py-8 text-center text-gray-400 text-sm">No bills of materials found.</td>
            </tr>
            @endforelse
        </tbody>
    </table>
    <div class="px-4 py-3 border-t border-gray-100">{{ $boms->links() }}</div>
</div>
@endsection
