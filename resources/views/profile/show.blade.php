@extends('layouts.app')
@section('title', 'My Profile')

@section('content')
<div class="max-w-lg">
    <h1 class="text-xl font-semibold text-gray-900 mb-6">My Profile</h1>

    <div class="card">
        <form method="POST" action="{{ route('profile.update') }}" class="space-y-4">
            @csrf
            @method('PUT')

            <div>
                <label class="form-label">Full name</label>
                <input type="text" name="name" value="{{ old('name', $user->name) }}" class="form-input" required>
            </div>

            <div>
                <label class="form-label">Email</label>
                <input type="email" value="{{ $user->email }}" class="form-input bg-gray-50" disabled>
                <p class="text-xs text-gray-400 mt-1">Email cannot be changed. Contact admin.</p>
            </div>

            <div>
                <label class="form-label">Mobile</label>
                <input type="text" name="mobile" value="{{ old('mobile', $user->mobile) }}" class="form-input">
            </div>

            <div>
                <label class="form-label">Address</label>
                <textarea name="address" rows="2" class="form-input">{{ old('address', $user->address) }}</textarea>
            </div>

            <div>
                <label class="form-label">Role</label>
                <p class="text-sm text-gray-700 mt-1">{{ $user->roles->pluck('name')->join(', ') }}</p>
            </div>

            <hr class="border-gray-100">

            <div>
                <label class="form-label">New password <span class="text-gray-400">(leave blank to keep current)</span></label>
                <input type="password" name="password" class="form-input">
            </div>

            <div>
                <label class="form-label">Confirm new password</label>
                <input type="password" name="password_confirmation" class="form-input">
            </div>

            @if ($errors->any())
                <div class="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    {{ $errors->first() }}
                </div>
            @endif

            <div class="flex justify-end">
                <button type="submit" class="btn-primary">Save changes</button>
            </div>
        </form>
    </div>
</div>
@endsection
