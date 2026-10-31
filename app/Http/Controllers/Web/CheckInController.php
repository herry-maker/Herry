<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\CheckIn;
use App\Models\Trail;
use App\Services\BadgeService;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CheckInController extends Controller
{
    public function create(Request $request): View|RedirectResponse
    {
        $user = $request->user();

        if (! $user->emergency_phone) {
            return redirect()->route('profile.edit')
                ->with('status', __('Add an emergency contact before checking in.'));
        }

        $active = $user->checkIns()->active()->with('trail')->first();
        $trails = Trail::orderBy('name')->get(['id', 'name', 'elevation_m']);
        $selected = $request->query('trail');

        return view('checkins.create', compact('active', 'trails', 'selected'));
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->checkIns()->active()->exists()) {
            throw ValidationException::withMessages(['trail_id' => __('You already have an active check-in. Check out first.')]);
        }

        $data = $request->validate([
            'trail_id'           => ['required', 'exists:trails,id'],
            'trip_id'            => ['nullable', 'exists:trips,id'],
            'expected_return_at' => ['required', 'date', 'after:now'],
        ]);

        $user->checkIns()->create([...$data, 'checkin_at' => now()]);

        return redirect()->route('home')->with('status', __('Checked in. Stay safe and check out when you are back.'));
    }

    public function checkout(Request $request, CheckIn $checkIn, BadgeService $badges): RedirectResponse
    {
        abort_unless($checkIn->user_id === $request->user()->id, 403);
        abort_if($checkIn->checkout_at !== null, 409);

        $data = $request->validate(['reached_summit' => ['nullable', 'boolean']]);
        $reached = (bool) ($data['reached_summit'] ?? false);

        $checkIn->update(['checkout_at' => now(), 'reached_summit' => $reached]);

        if ($reached) {
            $request->user()->increment('summit_count');
            $request->user()->increment('total_elevation_m', $checkIn->trail->elevation_m);
        }

        $newBadges = $badges->evaluate($request->user()->fresh());

        $message = $reached
            ? __('Summit logged: :trail, :m m.', ['trail' => $checkIn->trail->name, 'm' => number_format($checkIn->trail->elevation_m, 0, ',', '.')])
            : __('Checked out. Glad you are back.');

        if ($newBadges->isNotEmpty()) {
            $message .= ' '.__('New badge: :badges', ['badges' => $newBadges->map->name()->join(', ')]);
        }

        return redirect()->route('profile.show', $request->user())->with('status', $message);
    }
}
