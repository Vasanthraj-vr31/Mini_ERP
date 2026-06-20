@extends('layouts.app')
@section('title', 'New Product')

@section('content')
<div class="flex items-center justify-between mb-6">
    <h1 class="text-xl font-semibold text-gray-900">New Product</h1>
    <a href="{{ route('products.index') }}" class="btn-secondary">Cancel</a>
</div>

<div class="card max-w-2xl">
    <form method="POST" action="{{ route('products.store') }}" class="space-y-5">
        @csrf

        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="form-label">Reference *</label>
                <input type="text" name="reference" value="{{ old('reference') }}" class="form-input" required
                    placeholder="RM-001, FG-001, etc.">
            </div>
            <div>
                <label class="form-label">Category</label>
                <input type="text" name="category" value="{{ old('category') }}" class="form-input"
                    placeholder="Raw Material, Finished Good">
            </div>
        </div>

        <div>
            <label class="form-label">Product name *</label>
            <input type="text" name="name" value="{{ old('name') }}" class="form-input" required>
        </div>

        <div>
            <label class="form-label">Description</label>
            <textarea name="description" rows="2" class="form-input">{{ old('description') }}</textarea>
        </div>

        <div class="grid grid-cols-3 gap-4">
            <div>
                <label class="form-label">UOM *</label>
                <input type="text" name="uom" value="{{ old('uom', 'pcs') }}" class="form-input" required>
            </div>
            <div>
                <label class="form-label">Cost price *</label>
                <input type="number" name="cost_price" value="{{ old('cost_price', '0') }}"
                    step="0.01" min="0" class="form-input" required>
            </div>
            <div>
                <label class="form-label">Sales price *</label>
                <input type="number" name="sales_price" value="{{ old('sales_price', '0') }}"
                    step="0.01" min="0" class="form-input" required>
            </div>
        </div>

        <div>
            <label class="form-label">Opening stock (on hand) *</label>
            <input type="number" name="on_hand_qty" value="{{ old('on_hand_qty', '0') }}"
                step="0.001" min="0" class="form-input" required>
        </div>

        <hr class="border-gray-100">

        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="form-label">Replenishment route *</label>
                <select name="replenishment_route" class="form-select" required>
                    <option value="Vendor" {{ old('replenishment_route') === 'Vendor' ? 'selected' : '' }}>Buy from vendor</option>
                    <option value="BoM" {{ old('replenishment_route') === 'BoM' ? 'selected' : '' }}>Manufacture (BoM)</option>
                </select>
            </div>
            <div>
                <label class="form-label">Preferred vendor</label>
                <select name="preferred_vendor_id" class="form-select">
                    <option value="">— none —</option>
                    @foreach($vendors as $id => $name)
                    <option value="{{ $id }}" {{ old('preferred_vendor_id') == $id ? 'selected' : '' }}>{{ $name }}</option>
                    @endforeach
                </select>
            </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
            <div>
                <label class="form-label">Reorder point</label>
                <input type="number" name="reorder_point" value="{{ old('reorder_point', '0') }}"
                    step="0.1" min="0" class="form-input">
            </div>
            <div>
                <label class="form-label">Safety stock</label>
                <input type="number" name="safety_stock" value="{{ old('safety_stock', '0') }}"
                    step="0.1" min="0" class="form-input">
            </div>
            <div>
                <label class="form-label">Lead time (days)</label>
                <input type="number" name="lead_time_days" value="{{ old('lead_time_days', '7') }}"
                    step="1" min="1" class="form-input">
            </div>
        </div>

        <div>
            <label class="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" name="procure_on_demand" value="1"
                    {{ old('procure_on_demand') ? 'checked' : '' }}
                    class="rounded border-gray-300 text-blue-600">
                Procure on demand (auto-raise PO/MO on SO confirm when stock is short)
            </label>
        </div>

        @if($errors->any())
        <div class="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            @foreach($errors->all() as $error)
            <p>{{ $error }}</p>
            @endforeach
        </div>
        @endif

        <div class="flex justify-end gap-3">
            <a href="{{ route('products.index') }}" class="btn-secondary">Cancel</a>
            <button type="submit" class="btn-primary">Create product</button>
        </div>
    </form>
</div>
@endsection
