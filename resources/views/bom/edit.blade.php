@extends('layouts.app')
@section('title', 'Edit ' . $bom->reference)

@section('content')
<div class="flex items-center justify-between mb-6">
    <h1 class="text-xl font-semibold text-gray-900">Edit: {{ $bom->reference }}</h1>
    <a href="{{ route('bom.show', $bom) }}" class="btn-secondary">Cancel</a>
</div>

<div class="card max-w-3xl" x-data="bomEditForm()">
    <form method="POST" action="{{ route('bom.update', $bom) }}" class="space-y-5">
        @csrf @method('PUT')

        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="form-label">Reference</label>
                <input type="text" value="{{ $bom->reference }}" class="form-input bg-gray-50" disabled>
            </div>
            <div>
                <label class="form-label">Finished product *</label>
                <select name="finished_product_id" class="form-select" required>
                    @foreach($products as $product)
                    <option value="{{ $product->id }}" {{ $bom->finished_product_id == $product->id ? 'selected' : '' }}>
                        {{ $product->reference }} — {{ $product->name }}
                    </option>
                    @endforeach
                </select>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="form-label">Base quantity *</label>
                <input type="number" name="base_qty" value="{{ $bom->base_qty }}"
                    step="0.001" min="0.001" class="form-input" required>
            </div>
            <div>
                <label class="form-label">UOM</label>
                <input type="text" name="uom" value="{{ $bom->uom }}" class="form-input">
            </div>
        </div>

        <hr class="border-gray-100">

        <div>
            <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-gray-700">Components</h3>
                <button type="button" @click="addComponent()" class="btn-secondary text-xs py-1 px-3">+ Add</button>
            </div>
            <table class="w-full text-sm">
                <thead>
                    <tr class="text-left text-xs font-medium text-gray-400 uppercase border-b border-gray-100">
                        <th class="pb-2 pr-2">Component</th>
                        <th class="pb-2 pr-2 w-24">Qty</th>
                        <th class="pb-2 pr-2 w-20">UOM</th>
                        <th class="pb-2 w-6"></th>
                    </tr>
                </thead>
                <tbody>
                    <template x-for="(comp, idx) in components" :key="idx">
                        <tr>
                            <td class="py-1 pr-2">
                                <select :name="`components[${idx}][component_id]`" class="form-select text-xs" required>
                                    <option value="">Select component</option>
                                    @foreach($products as $product)
                                    <option value="{{ $product->id }}"
                                        :selected="comp.component_id == {{ $product->id }}">
                                        {{ $product->reference }} — {{ $product->name }}
                                    </option>
                                    @endforeach
                                </select>
                            </td>
                            <td class="py-1 pr-2">
                                <input type="number" :name="`components[${idx}][to_consume_qty]`"
                                    x-model="comp.qty" min="0.001" step="0.001" class="form-input text-xs" required>
                            </td>
                            <td class="py-1 pr-2">
                                <input type="text" :name="`components[${idx}][uom]`"
                                    x-model="comp.uom" class="form-input text-xs">
                            </td>
                            <td class="py-1">
                                <button type="button" @click="removeComponent(idx)"
                                    class="text-red-400 hover:text-red-600 text-xs">x</button>
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>

        <hr class="border-gray-100">

        <div>
            <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-gray-700">Operations</h3>
                <button type="button" @click="addOperation()" class="btn-secondary text-xs py-1 px-3">+ Add</button>
            </div>
            <table class="w-full text-sm" x-show="operations.length > 0">
                <thead>
                    <tr class="text-left text-xs font-medium text-gray-400 uppercase border-b border-gray-100">
                        <th class="pb-2 pr-2">Operation</th>
                        <th class="pb-2 pr-2">Work center</th>
                        <th class="pb-2 pr-2 w-24">Duration</th>
                        <th class="pb-2 w-6"></th>
                    </tr>
                </thead>
                <tbody>
                    <template x-for="(op, idx) in operations" :key="idx">
                        <tr>
                            <td class="py-1 pr-2">
                                <input type="text" :name="`operations[${idx}][operation_name]`"
                                    x-model="op.name" class="form-input text-xs">
                            </td>
                            <td class="py-1 pr-2">
                                <select :name="`operations[${idx}][work_center_id]`" class="form-select text-xs">
                                    <option value="">— none —</option>
                                    @foreach($workCenters as $id => $name)
                                    <option value="{{ $id }}" :selected="op.work_center_id == {{ $id }}">{{ $name }}</option>
                                    @endforeach
                                </select>
                            </td>
                            <td class="py-1 pr-2">
                                <input type="number" :name="`operations[${idx}][expected_duration_mins]`"
                                    x-model="op.duration" min="0" class="form-input text-xs">
                            </td>
                            <td class="py-1">
                                <button type="button" @click="removeOperation(idx)"
                                    class="text-red-400 hover:text-red-600 text-xs">x</button>
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>

        <div>
            <label class="form-label">Notes</label>
            <textarea name="notes" rows="2" class="form-input">{{ $bom->notes }}</textarea>
        </div>

        @if($errors->any())
        <div class="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            @foreach($errors->all() as $error)<p>{{ $error }}</p>@endforeach
        </div>
        @endif

        <div class="flex justify-end gap-3">
            <a href="{{ route('bom.show', $bom) }}" class="btn-secondary">Cancel</a>
            <button type="submit" class="btn-primary">Save changes</button>
        </div>
    </form>
</div>

<script>
function bomEditForm() {
    return {
        components: @json($bom->components->map(fn($c) => ['component_id' => $c->component_id, 'qty' => $c->to_consume_qty, 'uom' => $c->uom])),
        operations: @json($bom->operations->map(fn($o) => ['name' => $o->operation_name, 'work_center_id' => $o->work_center_id, 'duration' => $o->expected_duration_mins])),
        addComponent() { this.components.push({ component_id: '', qty: 1, uom: 'pcs' }); },
        removeComponent(idx) { if (this.components.length > 1) this.components.splice(idx, 1); },
        addOperation() { this.operations.push({ name: '', work_center_id: null, duration: null }); },
        removeOperation(idx) { this.operations.splice(idx, 1); },
    };
}
</script>
@endsection
