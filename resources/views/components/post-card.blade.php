@props(['post'])
<article id="post-{{ $post->id }}" class="rounded-2xl bg-white border border-stone-200 overflow-hidden">
    <div class="flex items-center gap-3 px-4 pt-3 pb-2">
        <a href="{{ route('profile.show', $post->user) }}"><x-avatar :user="$post->user" /></a>
        <div class="min-w-0">
            <a href="{{ route('profile.show', $post->user) }}" class="block text-sm font-bold truncate">{{ $post->user->name }}</a>
            <div class="text-xs text-stone-500">
                {{ $post->created_at->diffForHumans() }}
                @if ($post->type === 'condition_alert') · <span class="text-summit font-bold">{{ __('Trail condition alert') }}</span>@endif
            </div>
        </div>
    </div>

    @if ($post->photo_paths)
        <div class="grid {{ count($post->photo_paths) > 1 ? 'grid-cols-2' : '' }} gap-0.5">
            @foreach ($post->photo_paths as $path)
                <img src="{{ asset('storage/'.$path) }}" alt="" class="w-full h-44 object-cover" loading="lazy">
            @endforeach
        </div>
    @endif

    <div class="px-4 py-3">
        <p class="text-sm leading-relaxed whitespace-pre-line">{{ $post->body }}</p>
        @if ($post->trail)
            <a href="{{ route('trails.show', $post->trail) }}" class="mt-2 inline-flex items-center gap-1 rounded-full bg-canopy-light px-2.5 py-1 text-xs font-bold text-canopy">▲ {{ $post->trail->name }}</a>
        @endif
    </div>

    <div class="flex items-center gap-4 border-t border-stone-200 px-4 py-2 text-xs font-semibold text-stone-500" x-data="share('{{ route('posts.show', $post) }}')">
        @auth
            <form method="post" action="{{ route('posts.like', $post) }}">@csrf
                <button class="flex items-center gap-1 {{ $post->isLikedBy(auth()->user()) ? 'text-summit' : '' }}">♥ <span class="tabular">{{ $post->likes_count }}</span></button>
            </form>
        @else
            <span class="flex items-center gap-1">♥ <span class="tabular">{{ $post->likes_count }}</span></span>
        @endauth
        <a href="{{ route('posts.show', $post) }}#comments" class="tabular">{{ $post->comments_count }} {{ __('comments') }}</a>
        <button @click="copy()" class="ml-auto" x-text="copied ? '{{ __('Link copied') }}' : '{{ __('Share') }}'"></button>
    </div>
</article>
