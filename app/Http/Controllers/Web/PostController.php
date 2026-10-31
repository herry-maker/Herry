<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\Web\StorePostRequest;
use App\Models\Post;
use App\Services\BadgeService;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function store(StorePostRequest $request, BadgeService $badges): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('photos')) {
            $data['photo_paths'] = collect($request->file('photos'))
                ->map(fn ($file) => $file->store('posts', 'public'))
                ->all();
        }

        $request->user()->posts()->create($data);
        $badges->evaluate($request->user());

        return redirect()->route('home')->with('status', __('Posted.'));
    }

    public function show(Post $post): View
    {
        $post->load(['user', 'trail', 'trip', 'comments.user', 'likers:id']);

        return view('posts.show', compact('post'));
    }

    public function toggleLike(Request $request, Post $post): RedirectResponse
    {
        $result = $post->likers()->toggle($request->user()->id);
        $post->likes_count = $post->likers()->count();
        $post->save();

        return back()->withFragment('post-'.$post->id);
    }

    public function comment(Request $request, Post $post): RedirectResponse
    {
        $data = $request->validate(['body' => ['required', 'string', 'min:1', 'max:1000']]);

        $post->comments()->create([...$data, 'user_id' => $request->user()->id]);
        $post->increment('comments_count');

        return redirect()->route('posts.show', $post)->withFragment('comments');
    }
}
