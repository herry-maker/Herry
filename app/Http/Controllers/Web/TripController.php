<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\Web\StoreTripRequest;
use App\Models\Trail;
use App\Models\Trip;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TripController extends Controller
{
    public function index(Request $request): View
    {
        $filters = $request->only(['when', 'max_price', 'beginner']);

        $trips = Trip::with(['trail', 'organizer'])
            ->withCount(['memberships as active_members_count' => fn ($q) => $q->whereIn('status', ['pending', 'paid', 'confirmed'])])
            ->upcoming()
            ->when(($filters['when'] ?? null) === 'weekend', fn ($q) => $q->whereBetween('departure_at', [now(), now()->endOfWeek()->addDay()]))
            ->when(($filters['when'] ?? null) === 'month', fn ($q) => $q->where('departure_at', '<=', now()->addMonth()))
            ->when($filters['max_price'] ?? null, fn ($q, $p) => $q->where('price_idr', '<=', (int) $p))
            ->when($filters['beginner'] ?? null, fn ($q) => $q->where('beginner_friendly', true))
            ->paginate(12)
            ->withQueryString();

        return view('trips.index', compact('trips', 'filters'));
    }

    public function show(Request $request, Trip $trip): View
    {
        $trip->load(['trail', 'organizer', 'memberships.user']);
        $membership = $trip->membershipFor($request->user());
        $isOrganizer = $request->user()?->id === $trip->organizer_id;

        return view('trips.show', compact('trip', 'membership', 'isOrganizer'));
    }

    public function create(Request $request): View
    {
        $trails = Trail::orderBy('name')->get(['id', 'name', 'elevation_m']);
        $selected = $request->query('trail');

        return view('trips.create', compact('trails', 'selected'));
    }

    public function store(StoreTripRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['includes'] = array_values(array_filter(array_map('trim', explode("\n", $data['includes'] ?? ''))));

        if ($request->hasFile('qris_image')) {
            $data['qris_image_path'] = $request->file('qris_image')->store('qris', 'public');
        }
        unset($data['qris_image']);

        $trip = $request->user()->organizedTrips()->create($data);
        $trip->memberships()->create(['user_id' => $request->user()->id, 'role' => 'leader', 'status' => 'confirmed', 'confirmed_at' => now()]);

        return redirect()->route('trips.show', $trip)->with('status', __('Trip published.'));
    }
}
