<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function show()
    {
        $user = auth()->user();
        return view('profile.show', compact('user'));
    }

    public function update(Request $request)
    {
        $user = auth()->user();

        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'mobile'   => 'nullable|string|max:20',
            'address'  => 'nullable|string|max:500',
            'password' => 'nullable|min:8|confirmed',
        ]);

        $user->name    = $validated['name'];
        $user->mobile  = $validated['mobile'];
        $user->address = $validated['address'];

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return back()->with('success', 'Profile updated.');
    }
}
