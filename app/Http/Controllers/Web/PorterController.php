<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Porter;
use App\Models\Trail;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;

class PorterController extends Controller
{
    public function index(Request $request): View
    {
        $filters = $request->only(['trail', 'role', 'english', 'verified']);

        $porters = Porter::with('trails')
            ->when($filters['trail'] ?? null, fn ($q, $slug) => $q->forTrail(Trail::where('slug', $slug)->value('id') ?? 0))
            ->when($filters['role'] ?? null, fn ($q, $role) => $q->where('role', $role))
            ->when($filters['english'] ?? null, fn ($q) => $q->whereJsonContains('languages', 'en'))
            ->when($filters['verified'] ?? null, fn ($q) => $q->where('is_verified', true))
            ->orderByDesc('is_verified')
            ->orderByDesc('rating_avg')
            ->get();

        $trails = Trail::orderBy('name')->get(['slug', 'name']);

        return view('porters.index', compact('porters', 'filters', 'trails'));
    }

    public function show(Porter $porter): View
    {
        $porter->load(['trails', 'trips' => fn ($q) => $q->upcoming()->with(['trail', 'organizer'])->limit(4)]);

        return view('porters.show', compact('porter'));
    }
}
