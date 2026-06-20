@extends('layouts.app')
@section('title', 'New Manufacturing Order')

@section('content')
<div class="flex items-center justify-between mb-6">
    <h1 class="text-xl font-semibold text-gray-900">New Manufacturing Order</h1>
    <a href="{{ route('manufacturing-orders.index') }}" class="btn-secondary">Cancel</a>
</div>

<div class="card max-w-2xl" x-data="moForm()">
    <form method="POST" action="{{ route('manufacturing-orders.store') }}" class="space-y-5">
        @csrf

        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="form-label">Reference</label>
                <input type="text" value="{{ $nextRef }}" class="form-input bg-gray-50" disabled>
            </div>
            <div>
                <label class="form-label">Scheduled date *</label>
                <input type="date" name="scheduled_date"
                    value="{{ old('scheduled_date', today()->addDays(7)->format('Y-m-d')) }}"
                    class="form-input" required>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="form-label">Finished product *</label>
                <select name="finished_product_id" class="form-select" required>
                    <option value="">Select product</option>
                    @foreach($products as $product)
                    <option value="{{ $product->id }}" {{ old('finished_product_id') == $product->id ? 'selected' : '' }}>
                        {{ $product->reference }} — {{ $product->name }}
                    </option>
                    @endforeach
                </select>
            </div>
            <div>
                <label class="form-label">Bill of Materials *</label>
                <select name="bom_id" class="form-select" @change="loadBomData()" x-model="bomId" required>
                    <option value="">Select BoM</option>
                    @foreach($boms as $bom)
                    <option value="{{ $bom->id }}" {{ old('bom_id') == $bom->id ? 'selected' : '' }}>
                        {{ $bom->reference }} — {{ $bom->finishedProduct->name }}
                    </option>
                    @endforeach
                </select>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="form-label">Target quantity *</label>
                <input type="number" name="target_qty" value="{{ old('target_qty', 1) }}"
                    step="0.001" min="0.001" class="form-input" x-model="targetQty"
                    @change="loadBomData()" required>
            </div>
            <div>
                <label class="form-label">Assignee</label>
                <select name="assignee_id" class="form-select">
                    <option value="">— none —</option>
                    @foreach($assignees as $user)
                    <option value="{{ $user->id }}" {{ old('assignee_id') == $user->id ? 'selected' : '' }}>
                        {{ $user->name }}
                    </option>
                    @endforeach
                </select>
            </div>
        </div>

        {{-- Component preview --}}
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

        <div>
            <label class="form-label">Notes</label>
            <textarea name="notes" rows="2" class="form-input">{{ old('notes') }}</textarea>
        </div>

        @if($errors->any())
        <div class="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            @foreach($errors->all() as $error)<p>{{ $error }}</p>@endforeach
        </div>
        @endif

        <div class="flex justify-end gap-3">
            <a href="{{ route('manufacturing-orders.index') }}" class="btn-secondary">Cancel</a>
            <button type="submit" class="btn-primary">Create MO</button>
        </div>
    </form>
</div>

<script>
function moForm() {
    return {
        bomId: '',
        targetQty: 1,
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
