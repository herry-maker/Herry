<x-layouts.app :title="Str::limit($post->body, 40)">
    <a href="{{ url()->previous() !== url()->current() ? url()->previous() : route('home') }}" class="text-xs font-bold text-stone-500">← {{ __('Back') }}</a>
    <div class="mt-2"><x-post-card :post="$post" /></div>

    <section id="comments" class="mt-4 rounded-2xl bg-white border border-stone-200 p-4">
        <h2 class="display text-base font-bold uppercase tracking-wide">{{ $post->comments->count() }} {{ __('comments') }}</h2>
        <ul class="mt-3 space-y-3 text-sm">
            @foreach ($post->comments as $c)
                <li class="flex gap-2">
                    <x-avatar :user="$c->user" size="size-7" />
                    <div class="min-w-0 rounded-xl bg-stone-50 px-3 py-2">
                        <b class="text-xs">{{ $c->user->name }}</b> <span class="text-[11px] text-stone-500">· {{ $c->created_at->diffForHumans(null, true) }}</span>
                        <p class="mt-0.5 whitespace-pre-line">{{ $c->body }}</p>
                    </div>
                </li>
            @endforeach
        </ul>
        @auth
            <form method="post" action="{{ route('posts.comment', $post) }}" class="mt-4 flex gap-2 text-sm">
                @csrf
                <input name="body" id="comment-body" required maxlength="1000" placeholder="{{ __('Write a comment') }}" class="flex-1 rounded-full border border-stone-200 px-4 py-2 focus:border-canopy focus:outline-none">
                <button class="rounded-full bg-canopy px-4 py-2 font-bold text-white">{{ __('Send') }}</button>
            </form>
        @endauth
    </section>
</x-layouts.app>
