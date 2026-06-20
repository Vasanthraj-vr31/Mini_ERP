<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Dashboard') — Shiv Furniture Works</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ mix('css/app.css') }}">
    @stack('styles')
</head>
<body class="h-full" x-data>

<div class="flex h-screen overflow-hidden">

    {{-- ===== SIDEBAR ===== --}}
    <aside class="w-56 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div class="h-14 flex items-center px-4 border-b border-gray-200">
            <span class="text-blue-700 font-bold text-base tracking-tight leading-tight">
                Shiv Furniture<br><span class="text-gray-400 text-xs font-normal">ERP System</span>
            </span>
        </div>

        <nav class="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
            @can('view dashboard')
            <a href="{{ route('dashboard') }}"
               class="sidebar-link {{ request()->routeIs('dashboard') ? 'active' : '' }}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                Dashboard
            </a>
            @endcan

            @can('view sales orders')
            <a href="{{ route('sales-orders.index') }}"
               class="sidebar-link {{ request()->routeIs('sales-orders.*') ? 'active' : '' }}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
                Sale Orders
            </a>
            @endcan

            @can('view purchase orders')
            <a href="{{ route('purchase-orders.index') }}"
               class="sidebar-link {{ request()->routeIs('purchase-orders.*') ? 'active' : '' }}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                Purchase Orders
            </a>
            @endcan

            @can('view manufacturing orders')
            <a href="{{ route('manufacturing-orders.index') }}"
               class="sidebar-link {{ request()->routeIs('manufacturing-orders.*') ? 'active' : '' }}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                Manufacturing
            </a>
            @endcan

            @can('view bom')
            <a href="{{ route('bom.index') }}"
               class="sidebar-link {{ request()->routeIs('bom.*') ? 'active' : '' }}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/></svg>
                Bills of Materials
            </a>
            @endcan

            @can('view products')
            <a href="{{ route('products.index') }}"
               class="sidebar-link {{ request()->routeIs('products.*') ? 'active' : '' }}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                Products
            </a>
            @endcan

            @can('view stock ledger')
            <a href="{{ route('stock-ledger.index') }}"
               class="sidebar-link {{ request()->routeIs('stock-ledger.*') ? 'active' : '' }}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Stock Ledger
            </a>
            @endcan

            @can('view audit logs')
            <a href="{{ route('audit-logs.index') }}"
               class="sidebar-link {{ request()->routeIs('audit-logs.*') ? 'active' : '' }}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Audit Logs
            </a>
            @endcan
        </nav>

        <div class="border-t border-gray-200 p-3">
            <div x-data="{ open: false }" class="relative">
                <button @click="open = !open"
                        class="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 text-left">
                    <div class="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {{ strtoupper(substr(auth()->user()->name, 0, 2)) }}
                    </div>
                    <div class="min-w-0 flex-1">
                        <p class="text-xs font-medium text-gray-900 truncate">{{ auth()->user()->name }}</p>
                        <p class="text-xs text-gray-500 truncate">{{ auth()->user()->getRoleNames()->first() }}</p>
                    </div>
                </button>
                <div x-show="open" x-cloak @click.away="open = false"
                     class="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                    <a href="{{ route('profile.show') }}" class="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Profile
                    </a>
                    <form method="POST" action="{{ route('logout') }}">
                        @csrf
                        <button type="submit" class="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                            Sign out
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </aside>

    {{-- ===== MAIN CONTENT ===== --}}
    <div class="flex-1 flex flex-col overflow-hidden">
        <header class="h-14 flex items-center justify-between px-6 bg-white border-b border-gray-200 flex-shrink-0">
            <h1 class="text-sm font-semibold text-gray-900">@yield('page-title', 'Dashboard')</h1>
            <div class="flex items-center gap-4">
                @can('view ai alerts')
                @php $alertCount = \App\Models\AiAlert::where('is_resolved', false)->count(); @endphp
                <a href="{{ route('dashboard') }}#alerts"
                   class="relative p-1.5 text-gray-500 hover:text-gray-700">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                    @if($alertCount > 0)
                    <span class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {{ $alertCount > 9 ? '9+' : $alertCount }}
                    </span>
                    @endif
                </a>
                @endcan
            </div>
        </header>

        @if(session('success'))
        <div class="mx-6 mt-4 px-4 py-3 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg flex items-center gap-2"
             x-data x-init="setTimeout(() => $el.remove(), 4000)">
            <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
            {{ session('success') }}
        </div>
        @endif
        @if(session('error'))
        <div class="mx-6 mt-4 px-4 py-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg flex items-center gap-2"
             x-data x-init="setTimeout(() => $el.remove(), 6000)">
            <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
            {{ session('error') }}
        </div>
        @endif

        <main class="flex-1 overflow-y-auto p-6">
            @yield('content')
        </main>
    </div>
</div>

<style>[x-cloak]{display:none!important}</style>
<script src="{{ mix('js/app.js') }}"></script>
@stack('scripts')
</body>
</html>
