<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Permit;
use App\Models\Trail;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PermitController extends Controller
{
    public function index(Request $request): View
    {
        $permits = $request->user()->permits()->with(['trail', 'trip'])->orderByDesc('hike_date')->get();

        return view('permits.index', [
            'upcoming' => $permits->filter(fn ($p) => $p->hike_date->gte(today()))->sortBy('hike_date'),
            'past'     => $permits->filter(fn ($p) => $p->hike_date->lt(today())),
        ]);
    }

    public function create(Request $request): View
    {
        $trails = Trail::whereIn('permit_type', ['simaksi', 'esimaksi', 'ticket'])->orderBy('name')->get();
        $selected = $request->query('trail');
        $trip = $request->query('trip') ? $request->user()->trips()->find($request->query('trip')) : null;

        return view('permits.create', compact('trails', 'selected', 'trip'));
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'trail_id'   => ['required', 'exists:trails,id'],
            'trip_id'    => ['nullable', 'exists:trips,id'],
            'hike_date'  => ['required', 'date', 'after_or_equal:today'],
            'party_size' => ['required', 'integer', 'between:1,50'],
            'notes'      => ['nullable', 'string', 'max:500'],
        ]);

        $permit = $request->user()->permits()->create($data);

        return redirect()->route('permits.index')->with('status', $permit->bookingWindowOpen()
            ? __('Permit planned. The booking window is open now, book it today.')
            : __('Permit planned. We will remind you when booking opens on :date.', ['date' => $permit->bookingOpensOn()->translatedFormat('j M Y')]));
    }

    public function update(Request $request, Permit $permit): RedirectResponse
    {
        abort_unless($permit->user_id === $request->user()->id, 403);

        $data = $request->validate([
            'status'       => ['required', Rule::in(Permit::STATUSES)],
            'simaksi_code' => ['nullable', 'string', 'max:64'],
            'notes'        => ['nullable', 'string', 'max:500'],
        ]);

        if (in_array($data['status'], ['booked', 'approved'], true) && ! $permit->booked_at) {
            $data['booked_at'] = now();
        }

        $permit->update($data);

        return back()->with('status', __('Permit updated: :status', ['status' => $permit->statusLabel()]));
    }

    public function destroy(Request $request, Permit $permit): RedirectResponse
    {
        abort_unless($permit->user_id === $request->user()->id, 403);
        $permit->delete();

        return redirect()->route('permits.index')->with('status', __('Permit removed.'));
    }
}
