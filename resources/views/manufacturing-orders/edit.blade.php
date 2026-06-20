@extends('layouts.app')
@section('title', 'Edit ' . $manufacturingOrder->reference)

@section('content')
<div class="flex items-center justify-between mb-6">
    <div>
        <h1 class="text-xl font-semibold text-gray-900">Edit {{ $manufacturingOrder->reference }}</h1>
        <p class="text-sm text-gray-500 mt-0.5">{{ $manufacturingOrder->status }} — changes re-scale component requirements</p>
    </div>
    <a href="{{ route('manufacturing-orders.show', $manufacturingOrder) }}" class="btn-secondary">Cancel</a>
</div>

<div class="card max-w-2xl" x-data="moEditForm()">
    <form method="POST" action="{{ route('manufacturing-orders.update', $manufacturingOrder) }}" class="space-y-5">
        @csrf
        @method('PUT')

        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="form-label">Reference</label>
                <input type="text" value="{{ $manufacturingOrder->reference }}" class="form-input bg-gray-50" disabled>
            </div>
            <div>
                <label class="form-label">Scheduled date *</label>
                <input type="date" name="scheduled_date"
                    value="{{ old('scheduled_date', $manufacturingOrder->scheduled_date->format('Y-m-d')) }}"
                    class="form-input" required>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="form-label">Finished product</label>
                <input type="text"
                    value="{{ $manufacturingOrder->finishedProduct->reference }} — {{ $manufacturingOrder->finishedProduct->name }}"
                    class="form-input bg-gray-50" disabled>
            </div>
            <div>
                <label class="form-label">Bill of Materials</label>
                <select name="bom_id" class="form-select" @change="loadBomData()" x-model="bomId">
                    <option value="">— same as before —</option>
                    @foreach($boms as $bom)
                    <option value="{{ $bom->id }}"
                        {{ old('bom_id', $manufacturingOrder->bom_id) == $bom->id ? 'selected' : '' }}>
                        {{ $bom->reference }} — {{ $bom->finishedProduct->name }}
                    </option>
                    @endforeach
                </select>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="form-label">Target quantity *</label>
                <input type="number" name="target_qty"
                    value="{{ old('target_qty', $manufacturingOrder->target_qty) }}"
                    step="0.001" min="0.001" class="form-input" x-model="targetQty"
                    @change="loadBomData()" required>
            </div>
            <div>
                <label class="form-label">Assignee</label>
                <select name="assignee_id" class="form-select">
                    <option value="">— none —</option>
                    @foreach($assignees as $user)
                    <option value="{{ $user->id }}"
                        {{ old('assignee_id', $manufacturingOrder->assignee_id) == $user->id ? 'selected' : '' }}>
                        {{ $user->name }}
                    </option>
                    @endforeach
                </select>
            </div>
        </div>

        {{-- Component preview (refreshes when bom or qty changes) --}}
        <div x-show="components.length > 0">
            <h3 class="text-sm font-semibold text-gray-700 mb-2">Components (scaled to target qty)</h3>
            <table class="w-full text-xs">
                <thead>
                    <tr class="text-left text-xs font-medium text-gray-400 uppercase border-b border-gray-100">
                        <th class="pb-1.5 pr-4">Component</th>
                        <th class="pb-1.5 pr-4 text-right">Required</th>
                        <th class="pb-1.5 pr-4 text-right">Free to use</th>
                        <th class="pb-1.5">Status</th>
                    </tr>
                </thead>
                <tbody>
                    <template x-for="c in components" :key="c.component_id">
                        <tr class="border-b border-gray-50">
                            <td class="py-1.5 pr-4 text-gray-700" x-text="c.product_name"></td>
                            <td class="py-1.5 pr-4 text-right text-gray-700"
                                x-text="c.to_consume_qty.toFixed(1) + ' ' + c.uom"></td>
                            <td class="py-1.5 pr-4 text-right"
                                :class="c.free_to_use < c.to_consume_qty ? 'text-red-600 font-medium' : 'text-green-700'"
                                x-text="c.free_to_use.toFixed(1)"></td>
                            <td class="py-1.5">
                                <span :class="c.free_to_use >= c.to_consume_qty ? 'text-green-600' : 'text-red-600'"
                                    x-text="c.free_to_use >= c.to_consume_qty ? 'available' : (c.free_to_use > 0 ? 'partial' : 'unavailable')">
                                </span>
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>

        {{-- Current components (static, shown when no bom change) --}}
        <div x-show="components.length === 0 && {{ $manufacturingOrder->components->count() }} > 0">
            <h3 class="text-sm font-semibold text-gray-700 mb-2">Current components</h3>
            <table class="w-full text-xs">
                <thead>
                    <tr class="text-left text-xs font-medium text-gray-400 uppercase border-b border-gray-100">
                        <th class="pb-1.5 pr-4">Component</th>
                        <th class="pb-1.5 text-right">Qty required</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                    @foreach($manufacturingOrder->components as $comp)
                    <tr>
                        <td class="py-1.5 pr-4 text-gray-700">{{ $comp->component->reference }} — {{ $comp->component->name }}</td>
                        <td class="py-1.5 text-right text-gray-700">{{ number_format($comp->to_consume_qty, 1) }} {{ $comp->component->uom }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
            <p class="text-xs text-gray-400 mt-1">Select a different BoM or change target qty to preview updated components.</p>
        </div>

        <div>
            <label class="form-label">Notes</label>
            <textarea name="notes" rows="2" class="form-input">{{ old('notes', $manufacturingOrder->notes) }}</textarea>
        </div>

        @if($errors->any())
        <div class="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            @foreach($errors->all() as $error)<p>{{ $error }}</p>@endforeach
        </div>
        @endif

        <div class="flex justify-end gap-3">
            <a href="{{ route('manufacturing-orders.show', $manufacturingOrder) }}" class="btn-secondary">Cancel</a>
            <button type="submit" class="btn-primary">Save changes</button>
        </div>
    </form>
</div>

<script>
function moEditForm() {
    return {
        bomId: '{{ old('bom_id', $manufacturingOrder->bom_id) }}',
        targetQty: {{ old('target_qty', $manufacturingOrder->target_qty) }},
        components: [],
        loadBomData() {
            if (!this.bomId) { this.components = []; return; }
            fetch(`/manufacturing-orders/bom-data/${this.bomId}?qty=${this.targetQty}`)
                .then(r => r.json())
                .then(data => { this.components = data.components; });
        }
    };
}
</script>
@endsection
