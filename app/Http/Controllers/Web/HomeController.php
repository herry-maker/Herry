<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Trail;
use App\Models\Trip;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function __invoke(Request $request): View
    {
        $posts = Post::with(['user', 'trail', 'likers:id'])
            ->latest()
            ->paginate(10);

        $popularTrails = Trail::withCount('checkIns')
            ->orderByDesc('check_ins_count')
            ->orderBy('hours_from_jakarta')
            ->limit(6)
            ->get();

        $nextTrips = Trip::with('trail')->upcoming()->limit(3)->get();

        $activeCheckIn = $request->user()?->checkIns()->active()->with('trail')->latest('checkin_at')->first();

        return view('home', compact('posts', 'popularTrails', 'nextTrips', 'activeCheckIn'));
    }
}
