@extends('layouts.app')
@section('title', 'Edit ' . $salesOrder->reference)

@section('content')
<div class="flex items-center justify-between mb-6">
    <h1 class="text-xl font-semibold text-gray-900">Edit: {{ $salesOrder->reference }}</h1>
    <a href="{{ route('sales-orders.show', $salesOrder) }}" class="btn-secondary">Cancel</a>
</div>

<div class="card max-w-3xl" x-data="soEditForm()">
    <form method="POST" action="{{ route('sales-orders.update', $salesOrder) }}" class="space-y-5">
        @csrf @method('PUT')

        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="form-label">Customer *</label>
                <select name="customer_id" class="form-select" required>
                    @foreach($customers as $customer)
                    <option value="{{ $customer->id }}" {{ $salesOrder->customer_id == $customer->id ? 'selected' : '' }}>
                        {{ $customer->name }}
                    </option>
                    @endforeach
                </select>
            </div>
            <div>
                <label class="form-label">Order date</label>
                <input type="date" name="order_date" value="{{ $salesOrder->order_date?->format('Y-m-d') }}" class="form-input">
            </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="form-label">Expected delivery</label>
                <input type="date" name="expected_delivery_date"
                    value="{{ $salesOrder->expected_delivery_date?->format('Y-m-d') }}" class="form-input">
            </div>
            <div>
                <label class="form-label">Sales person</label>
                <select name="sales_person_id" class="form-select">
                    <option value="">— none —</option>
                    @foreach($salesPeople as $sp)
                    <option value="{{ $sp->id }}" {{ $salesOrder->sales_person_id == $sp->id ? 'selected' : '' }}>
                        {{ $sp->name }}
                    </option>
                    @endforeach
                </select>
            </div>
        </div>

        <div>
            <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-gray-700">Order lines</h3>
                <button type="button" @click="addLine()" class="btn-secondary text-xs py-1 px-3">+ Add line</button>
            </div>
            <table class="w-full text-sm">
                <thead>
                    <tr class="text-left text-xs font-medium text-gray-400 uppercase border-b border-gray-100">
                        <th class="pb-2 pr-2">Product</th>
                        <th class="pb-2 pr-2 w-24">Qty</th>
                        <th class="pb-2 pr-2 w-28">Unit price</th>
                        <th class="pb-2 w-6"></th>
                    </tr>
                </thead>
                <tbody>
                    <template x-for="(line, idx) in lines" :key="idx">
                        <tr>
                            <td class="py-1 pr-2">
                                <select :name="`lines[${idx}][product_id]`" class="form-select text-xs" required>
                                    @foreach($products as $product)
                                    <option value="{{ $product->id }}"
                                        data-price="{{ $product->sales_price }}"
                                        data-uom="{{ $product->uom }}"
                                        :selected="line.product_id == {{ $product->id }}">
                                        {{ $product->reference }} — {{ $product->name }}
                                    </option>
                                    @endforeach
                                </select>
                            </td>
                            <td class="py-1 pr-2">
                                <input type="number" :name="`lines[${idx}][ordered_qty]`"
                                    x-model="line.qty" min="0.001" step="0.001" class="form-input text-xs" required>
                                <input type="hidden" :name="`lines[${idx}][uom]`" x-model="line.uom">
                            </td>
                            <td class="py-1 pr-2">
                                <input type="number" :name="`lines[${idx}][unit_price]`"
                                    x-model="line.price" min="0" step="0.01" class="form-input text-xs" required>
                            </td>
                            <td class="py-1">
                                <button type="button" @click="removeLine(idx)"
                                    class="text-red-400 hover:text-red-600 text-xs">x</button>
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>

        <div>
            <label class="form-label">Notes</label>
            <textarea name="notes" rows="2" class="form-input">{{ $salesOrder->notes }}</textarea>
        </div>

        @if($errors->any())
        <div class="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            @foreach($errors->all() as $error)<p>{{ $error }}</p>@endforeach
        </div>
        @endif

        <div class="flex justify-end gap-3">
            <a href="{{ route('sales-orders.show', $salesOrder) }}" class="btn-secondary">Cancel</a>
            <button type="submit" class="btn-primary">Save changes</button>
        </div>
    </form>
</div>

<script>
function soEditForm() {
    return {
        lines: @json($salesOrder->lines->map(fn($l) => ['product_id' => $l->product_id, 'qty' => $l->ordered_qty, 'price' => $l->unit_price, 'uom' => $l->uom])),
        addLine() { this.lines.push({ product_id: '', qty: 1, price: 0, uom: 'pcs' }); },
        removeLine(idx) { if (this.lines.length > 1) this.lines.splice(idx, 1); },
    };
}
</script>
@endsection
