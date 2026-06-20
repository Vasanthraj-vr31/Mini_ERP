@extends('layouts.app')
@section('title', 'Audit Log')

@section('content')
<div class="flex items-center justify-between mb-6">
    <h1 class="text-xl font-semibold text-gray-900">Audit Log</h1>
</div>

<form method="GET" class="flex flex-wrap gap-3 mb-4">
    <select name="model_type" class="form-select w-48">
        <option value="">All modules</option>
        @foreach($modelTypes as $type)
        <option value="{{ $type }}" {{ request('model_type') === $type ? 'selected' : '' }}>{{ $type }}</option>
        @endforeach
    </select>
    <select name="action" class="form-select w-40">
        <option value="">All actions</option>
        @foreach($actions as $action)
        <option value="{{ $action }}" {{ request('action') === $action ? 'selected' : '' }}>{{ $action }}</option>
        @endforeach
    </select>
    <input type="date" name="date_from" value="{{ request('date_from') }}" class="form-input w-36">
    <input type="date" name="date_to" value="{{ request('date_to') }}" class="form-input w-36">
    <button type="submit" class="btn-secondary">Filter</button>
    @if(request()->hasAny(['model_type','action','date_from','date_to']))
    <a href="{{ route('audit-logs.index') }}" class="btn-secondary">Clear</a>
    @endif
</form>

<div class="card p-0">
    <table class="w-full text-sm">
        <thead>
            <tr class="text-left text-xs font-medium text-gray-400 uppercase border-b border-gray-100">
                <th class="px-4 py-3">Timestamp</th>
                <th class="px-4 py-3">User</th>
                <th class="px-4 py-3">Module</th>
                <th class="px-4 py-3">Record ID</th>
                <th class="px-4 py-3">Action</th>
                <th class="px-4 py-3">Description</th>
                <th class="px-4 py-3">Change</th>
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
            @forelse($logs as $log)
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {{ $log->created_at->format('d M y H:i') }}
                </td>
                <td class="px-4 py-3 text-xs text-gray-600">{{ $log->user?->name ?? 'System' }}</td>
                <td class="px-4 py-3 text-xs">
                    <span class="text-gray-500">{{ $log->model_type }}</span>
                </td>
                <td class="px-4 py-3 text-xs text-gray-400">{{ $log->model_id }}</td>
                <td class="px-4 py-3">
                    <span class="text-xs font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                        {{ $log->action }}
                    </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">{{ $log->description }}</td>
                <td class="px-4 py-3 text-xs text-gray-400">
                    @if($log->field_changed)
                    <span class="font-mono">{{ $log->field_changed }}:</span>
                    <span class="text-red-400 line-through">{{ $log->old_value }}</span>
                    <span class="mx-1">→</span>
                    <span class="text-green-600">{{ $log->new_value }}</span>
                    @endif
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="7" class="px-4 py-8 text-center text-gray-400 text-sm">No audit records found.</td>
            </tr>
            @endforelse
        </tbody>
    </table>
    <div class="px-4 py-3 border-t border-gray-100">{{ $logs->links() }}</div>
</div>
@endsection
