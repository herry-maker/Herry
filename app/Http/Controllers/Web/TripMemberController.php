<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Trip;
use App\Models\TripMember;
use App\Services\BadgeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TripMemberController extends Controller
{
    public function join(Request $request, Trip $trip): RedirectResponse
    {
        $user = $request->user();

        abort_if($trip->organizer_id === $user->id, 403);

        if ($trip->status !== 'open') {
            return back()->withErrors(['join' => __('This trip is no longer accepting members.')]);
        }

        $result = DB::transaction(function () use ($trip, $user) {
            $trip = Trip::lockForUpdate()->findOrFail($trip->id);

            if ($trip->isFull()) {
                return 'full';
            }

            $existing = $trip->memberships()->where('user_id', $user->id)->first();

            if ($existing?->isActive()) {
                return 'exists';
            }

            $existing
                ? $existing->update(['status' => 'pending', 'payment_proof_path' => null, 'paid_at' => null, 'confirmed_at' => null])
                : $trip->memberships()->create(['user_id' => $user->id]);

            if ($trip->isFull()) {
                $trip->update(['status' => 'full']);
            }

            return 'joined';
        });

        return match ($result) {
            'full'   => back()->withErrors(['join' => __('Sorry, the last seat was just taken.')]),
            'exists' => back(),
            default  => redirect()->route('trips.show', $trip)->with('status', __('Seat reserved. Pay with QRIS and upload your proof to confirm.')),
        };
    }

    public function uploadProof(Request $request, Trip $trip): RedirectResponse
    {
        $membership = $trip->memberships()->where('user_id', $request->user()->id)->firstOrFail();
        abort_unless($membership->isActive(), 409);

        $request->validate(['payment_proof' => ['required', 'image', 'max:4096']]);

        $membership->update([
            'payment_proof_path' => $request->file('payment_proof')->store('payments', 'public'),
            'paid_at'            => now(),
            'status'             => 'paid',
        ]);

        return back()->with('status', __('Proof uploaded. The organizer will confirm shortly.'));
    }

    public function confirm(Request $request, Trip $trip, TripMember $member, BadgeService $badges): RedirectResponse
    {
        abort_unless($trip->organizer_id === $request->user()->id && $member->trip_id === $trip->id, 403);

        $member->update(['status' => 'confirmed', 'confirmed_at' => now()]);
        $badges->evaluate($member->user);

        return back()->with('status', __(':name confirmed.', ['name' => $member->user->name]));
    }

    public function cancel(Request $request, Trip $trip): RedirectResponse
    {
        $membership = $trip->memberships()->where('user_id', $request->user()->id)->firstOrFail();
        abort_if($membership->role === 'leader', 403);

        $membership->update(['status' => 'cancelled']);

        if ($trip->status === 'full' && ! $trip->isFull()) {
            $trip->update(['status' => 'open']);
        }

        return redirect()->route('trips.show', $trip)->with('status', __('You left the trip.'));
    }
}
