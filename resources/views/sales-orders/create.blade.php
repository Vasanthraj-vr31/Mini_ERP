@extends('layouts.app')
@section('title', 'New Sales Order')

@section('content')
<div class="flex items-center justify-between mb-6">
    <h1 class="text-xl font-semibold text-gray-900">New Sales Order</h1>
    <a href="{{ route('sales-orders.index') }}" class="btn-secondary">Cancel</a>
</div>

<div class="card max-w-3xl" x-data="soForm()">
    <form method="POST" action="{{ route('sales-orders.store') }}" class="space-y-5">
        @csrf

        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="form-label">Reference</label>
                <input type="text" value="{{ $nextRef }}" class="form-input bg-gray-50" disabled>
            </div>
            <div>
                <label class="form-label">Order date *</label>
                <input type="date" name="order_date" value="{{ old('order_date', today()->format('Y-m-d')) }}"
                    class="form-input" required>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="form-label">Customer *</label>
                <select name="customer_id" class="form-select" required>
                    <option value="">Select customer</option>
                    @foreach($customers as $customer)
                    <option value="{{ $customer->id }}" {{ old('customer_id') == $customer->id ? 'selected' : '' }}>
                        {{ $customer->name }}
                    </option>
                    @endforeach
                </select>
            </div>
            <div>
                <label class="form-label">Expected delivery date</label>
                <input type="date" name="expected_delivery_date"
                    value="{{ old('expected_delivery_date') }}" class="form-input">
            </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="form-label">Sales person</label>
                <select name="sales_person_id" class="form-select">
                    <option value="">— none —</option>
                    @foreach($salesPeople as $sp)
                    <option value="{{ $sp->id }}" {{ old('sales_person_id') == $sp->id ? 'selected' : '' }}>
                        {{ $sp->name }}
                    </option>
                    @endforeach
                </select>
            </div>
            <div>
                <label class="form-label">Shipping address</label>
                <input type="text" name="shipping_address" value="{{ old('shipping_address') }}" class="form-input">
            </div>
        </div>

        <hr class="border-gray-100">

        <div>
            <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-gray-700">Order lines</h3>
                <button type="button" @click="addLine()" class="btn-secondary text-xs py-1 px-3">+ Add line</button>
            </div>

            <table class="w-full text-sm mb-2">
                <thead>
                    <tr class="text-left text-xs font-medium text-gray-400 uppercase border-b border-gray-100">
                        <th class="pb-2 pr-2">Product</th>
                        <th class="pb-2 pr-2 w-20">UOM</th>
                        <th class="pb-2 pr-2 w-24">Qty</th>
                        <th class="pb-2 pr-2 w-28">Free to use</th>
                        <th class="pb-2 pr-2 w-28">Unit price</th>
                        <th class="pb-2 w-6"></th>
                    </tr>
                </thead>
                <tbody>
                    <template x-for="(line, idx) in lines" :key="idx">
                        <tr>
                            <td class="py-1 pr-2">
                                <select :name="`lines[${idx}][product_id]`" class="form-select text-xs"
                                    @change="onProductChange(idx, $event)" required>
                                    <option value="">Select product</option>
                                    @foreach($products as $product)
                                    <option value="{{ $product->id }}"
                                        data-price="{{ $product->sales_price }}"
                                        data-uom="{{ $product->uom }}"
                                        data-free="{{ $product->free_to_use_qty }}">
                                        {{ $product->reference }} — {{ $product->name }}
                                    </option>
                                    @endforeach
                                </select>
                            </td>
                            <td class="py-1 pr-2">
                                <input type="text" :name="`lines[${idx}][uom]`" x-model="line.uom"
                                    class="form-input text-xs" readonly>
                            </td>
                            <td class="py-1 pr-2">
                                <input type="number" :name="`lines[${idx}][ordered_qty]`"
                                    x-model="line.qty" min="0.001" step="0.001" class="form-input text-xs" required>
                            </td>
                            <td class="py-1 pr-2">
                                <span class="text-xs" :class="line.freeToUse < line.qty ? 'text-red-600 font-medium' : 'text-green-700'"
                                    x-text="line.freeToUse !== null ? line.freeToUse : '—'"></span>
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

            <p class="text-xs text-red-500" x-show="lines.some(l => l.freeToUse !== null && l.freeToUse < l.qty)">
                One or more lines exceed available stock. A procurement order will be triggered automatically on confirm.
            </p>
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
            <a href="{{ route('sales-orders.index') }}" class="btn-secondary">Cancel</a>
            <button type="submit" class="btn-primary">Create order</button>
        </div>
    </form>
</div>

<script>
function soForm() {
    return {
        lines: [{ uom: '', qty: 1, price: 0, freeToUse: null }],
        addLine() {
            this.lines.push({ uom: '', qty: 1, price: 0, freeToUse: null });
        },
        removeLine(idx) {
            if (this.lines.length > 1) this.lines.splice(idx, 1);
        },
        onProductChange(idx, event) {
            const opt = event.target.selectedOptions[0];
            if (opt && opt.value) {
                this.lines[idx].price = parseFloat(opt.dataset.price) || 0;
                this.lines[idx].uom = opt.dataset.uom || 'pcs';
                this.lines[idx].freeToUse = parseFloat(opt.dataset.free) || 0;
            }
        }
    };
}
</script>
@endsection
