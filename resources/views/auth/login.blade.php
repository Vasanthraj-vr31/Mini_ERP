<!DOCTYPE html>
<html lang="en" class="h-full bg-gray-50">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign In — Shiv Furniture Works ERP</title>
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
</head>
<body class="h-full flex items-center justify-center">
    <div class="w-full max-w-sm">
        <div class="mb-8 text-center">
            <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Shiv Furniture Works</h1>
            <p class="text-sm text-gray-500 mt-1">Operations Management System</p>
        </div>

        <div class="card">
            <h2 class="text-base font-semibold text-gray-700 mb-6">Sign in to your account</h2>

            @if ($errors->any())
                <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    {{ $errors->first() }}
                </div>
            @endif

            <form method="POST" action="{{ route('login') }}" class="space-y-4">
                @csrf
                <div>
                    <label for="email" class="form-label">Email address</label>
                    <input id="email" name="email" type="email" autocomplete="email" required
                        class="form-input"
                        value="{{ old('email') }}" autofocus>
                </div>

                <div>
                    <label for="password" class="form-label">Password</label>
                    <input id="password" name="password" type="password" autocomplete="current-password" required
                        class="form-input">
                </div>

                <div class="flex items-center justify-between">
                    <label class="flex items-center gap-2 text-sm text-gray-600">
                        <input type="checkbox" name="remember" class="rounded border-gray-300 text-blue-600">
                        Remember me
                    </label>
                    @if (Route::has('password.request'))
                        <a href="{{ route('password.request') }}" class="text-sm text-blue-600 hover:underline">
                            Forgot password?
                        </a>
                    @endif
                </div>

                <button type="submit" class="btn-primary w-full justify-center">
                    Sign in
                </button>
            </form>
        </div>

        <p class="text-center text-xs text-gray-400 mt-6">
            Shiv Furniture Works ERP v1.0
        </p>
    </div>
</body>
</html>
