<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Trail;
use App\Services\WeatherService;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;

class TrailController extends Controller
{
    public function index(Request $request): View
    {
        $filters = $request->only(['q', 'difficulty', 'max_hours', 'permit']);

        $trails = Trail::query()
            ->withCount('reviews')
            ->withAvg('reviews', 'rating')
            ->with('latestReview')
            ->when($filters['q'] ?? null, fn ($q, $term) => $q->where(fn ($w) => $w
                ->where('name', 'like', "%{$term}%")
                ->orWhere('regency', 'like', "%{$term}%")
                ->orWhere('province', 'like', "%{$term}%")))
            ->when($filters['difficulty'] ?? null, fn ($q, $d) => $q->where('difficulty', $d))
            ->when($filters['max_hours'] ?? null, fn ($q, $h) => $q->where('hours_from_jakarta', '<=', (float) $h))
            ->when(($filters['permit'] ?? null) === 'simaksi', fn ($q) => $q->whereIn('permit_type', ['simaksi', 'esimaksi']))
            ->orderBy('hours_from_jakarta')
            ->get();

        return view('trails.index', compact('trails', 'filters'));
    }

    public function map(): View
    {
        $trails = Trail::withCount('reviews')->orderBy('name')->get()->map(fn (Trail $t) => [
            'slug'       => $t->slug,
            'name'       => $t->name,
            'lat'        => $t->lat,
            'lng'        => $t->lng,
            'elevation'  => $t->elevation_m,
            'regency'    => $t->regency,
            'province'   => $t->province,
            'difficulty' => $t->difficulty,
            'label'      => $t->difficultyLabel(),
            'hours'      => $t->hours_from_jakarta,
            'permit'     => $t->requiresPermit(),
            'url'        => route('trails.show', $t),
            'gradient'   => $t->cover_gradient,
        ]);

        return view('trails.map', compact('trails'));
    }

    public function show(Trail $trail, WeatherService $weather): View
    {
        $trail->load([
            'reviews.user',
            'upcomingTrips.organizer',
            'porters',
            'posts' => fn ($q) => $q->with(['user', 'likers:id'])->limit(5),
        ])->loadCount('reviews')->loadAvg('reviews', 'rating');

        $forecast = $weather->forecast($trail);

        return view('trails.show', compact('trail', 'forecast'));
    }
}
