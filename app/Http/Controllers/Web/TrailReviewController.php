<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\Web\StoreTrailReviewRequest;
use App\Models\Trail;
use App\Services\BadgeService;
use Illuminate\Http\RedirectResponse;

class TrailReviewController extends Controller
{
    public function store(StoreTrailReviewRequest $request, Trail $trail, BadgeService $badges): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('photos')) {
            $data['photo_paths'] = collect($request->file('photos'))
                ->map(fn ($file) => $file->store('reviews', 'public'))
                ->all();
        }

        $trail->reviews()->create([...$data, 'user_id' => $request->user()->id]);
        $badges->evaluate($request->user());

        return redirect()->route('trails.show', $trail)->with('status', __('Thanks, your report is live.'));
    }
}
