<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Badge;
use App\Models\User;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function show(User $user): View
    {
        $user->load(['badges']);
        $summits = $user->summits()->with('trail')->latest('checkout_at')->get();
        $trips = $user->trips()->with('trail')->wherePivotIn('status', ['paid', 'confirmed'])->orderByDesc('departure_at')->get();
        $allBadges = Badge::all();

        return view('profile.show', compact('user', 'summits', 'trips', 'allBadges'));
    }

    public function edit(Request $request): View
    {
        return view('profile.edit', ['user' => $request->user()]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name'             => ['required', 'string', 'min:2', 'max:255'],
            'phone'            => ['nullable', 'string', 'max:32'],
            'nationality'      => ['required', 'string', 'size:2', 'alpha'],
            'id_type'          => ['required', Rule::in(['ktp', 'passport'])],
            'experience_level' => ['required', Rule::in(['pemula', 'madya', 'ahli'])],
            'bio'              => ['nullable', 'string', 'max:500'],
            'emergency_name'   => ['required', 'string', 'max:255'],
            'emergency_phone'  => ['required', 'string', 'max:32'],
            'avatar'           => ['nullable', 'image', 'max:2048'],
        ]);

        $data['nationality'] = strtoupper($data['nationality']);

        if ($request->hasFile('avatar')) {
            $data['avatar_path'] = $request->file('avatar')->store('avatars', 'public');
        }
        unset($data['avatar']);

        $user->update($data);

        return redirect()->route('profile.show', $user)->with('status', __('Profile saved.'));
    }
}
