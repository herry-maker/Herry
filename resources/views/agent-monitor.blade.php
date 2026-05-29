<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Research Agent Monitor — {{ config('app.name') }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .pulse-dot { animation: pulse-dot 1.5s ease-in-out infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
    </style>
</head>
<body class="bg-gray-950 text-gray-100 min-h-screen font-mono">

    {{-- Header --}}
    <header class="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
            <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
            </svg>
            <span class="text-sm font-semibold text-gray-200 uppercase tracking-widest">Research Agent Monitor</span>
        </div>
        <div class="flex items-center gap-4 text-xs text-gray-500">
            <span id="refresh-timer">Refreshing in <span id="countdown">15</span>s</span>
            <div class="flex items-center gap-1.5">
                <span id="agent-status-dot" class="w-2 h-2 rounded-full bg-gray-600"></span>
                <span id="agent-status-label" class="uppercase tracking-wider">—</span>
            </div>
        </div>
    </header>

    <main class="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {{-- Stats grid --}}
        <section>
            <h2 class="text-xs text-gray-500 uppercase tracking-widest mb-4">Pipeline Overview</h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" id="stats-grid">
                <div class="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <div class="text-xs text-gray-500 mb-1">Total</div>
                    <div class="text-2xl font-bold text-gray-100" id="stat-total">—</div>
                </div>
                <div class="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <div class="text-xs text-gray-500 mb-1">Completed</div>
                    <div class="text-2xl font-bold text-green-400" id="stat-completed">—</div>
                </div>
                <div class="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <div class="text-xs text-gray-500 mb-1">Processing</div>
                    <div class="text-2xl font-bold text-yellow-400" id="stat-processing">—</div>
                </div>
                <div class="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <div class="text-xs text-gray-500 mb-1">Pending</div>
                    <div class="text-2xl font-bold text-blue-400" id="stat-pending">—</div>
                </div>
                <div class="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <div class="text-xs text-gray-500 mb-1">Failed</div>
                    <div class="text-2xl font-bold text-red-400" id="stat-failed">—</div>
                </div>
                <div class="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <div class="text-xs text-gray-500 mb-1">Success Rate</div>
                    <div class="text-2xl font-bold text-indigo-400" id="stat-success-rate">—</div>
                </div>
            </div>
            <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 flex items-center justify-between">
                    <span class="text-xs text-gray-500">Avg Processing Time</span>
                    <span class="text-sm text-gray-200" id="stat-avg-time">—</span>
                </div>
                <div class="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 flex items-center justify-between">
                    <span class="text-xs text-gray-500">Last Refreshed</span>
                    <span class="text-sm text-gray-200" id="last-refreshed">—</span>
                </div>
            </div>
        </section>

        {{-- Progress bar --}}
        <section>
            <div class="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>Success / Failure Distribution</span>
                <span id="dist-label">—</span>
            </div>
            <div class="h-2 bg-gray-800 rounded-full overflow-hidden flex">
                <div id="bar-completed" class="h-full bg-green-500 transition-all duration-500" style="width:0%"></div>
                <div id="bar-processing" class="h-full bg-yellow-500 transition-all duration-500" style="width:0%"></div>
                <div id="bar-pending" class="h-full bg-blue-500 transition-all duration-500" style="width:0%"></div>
                <div id="bar-failed" class="h-full bg-red-500 transition-all duration-500" style="width:0%"></div>
            </div>
            <div class="flex gap-4 mt-2 text-xs text-gray-500">
                <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-green-500 inline-block"></span>Completed</span>
                <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-yellow-500 inline-block"></span>Processing</span>
                <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>Pending</span>
                <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-red-500 inline-block"></span>Failed</span>
            </div>
        </section>

        {{-- Recent jobs table --}}
        <section>
            <h2 class="text-xs text-gray-500 uppercase tracking-widest mb-4">Recent Transcription Jobs</h2>
            <div class="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                                <th class="text-left px-4 py-3">ID</th>
                                <th class="text-left px-4 py-3">File</th>
                                <th class="text-left px-4 py-3">Title</th>
                                <th class="text-left px-4 py-3">Status</th>
                                <th class="text-right px-4 py-3">Pages</th>
                                <th class="text-right px-4 py-3">Notes</th>
                                <th class="text-right px-4 py-3">Duration</th>
                                <th class="text-left px-4 py-3">Submitted</th>
                            </tr>
                        </thead>
                        <tbody id="jobs-tbody">
                            <tr>
                                <td colspan="8" class="px-4 py-8 text-center text-gray-600 text-xs">Loading…</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

    </main>

    <footer class="border-t border-gray-800 px-6 py-4 text-center text-xs text-gray-700">
        Music Transcription Research Pipeline &mdash; {{ config('app.name') }}
    </footer>

    <script>
        const API_URL = '/api/music/agent';
        let countdown = 15;
        let countdownInterval;

        function statusBadge(status) {
            const map = {
                completed: 'bg-green-900 text-green-300 border border-green-700',
                processing: 'bg-yellow-900 text-yellow-300 border border-yellow-700',
                pending:    'bg-blue-900 text-blue-300 border border-blue-700',
                failed:     'bg-red-900 text-red-300 border border-red-700',
            };
            const cls = map[status] ?? 'bg-gray-800 text-gray-400';
            const dot = status === 'processing'
                ? '<span class="pulse-dot w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block mr-1"></span>'
                : '';
            return `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}">${dot}${status}</span>`;
        }

        function fmt(val, fallback = '—') {
            return val !== null && val !== undefined ? val : fallback;
        }

        function relativeTime(isoStr) {
            if (!isoStr) return '—';
            const diff = Math.floor((Date.now() - new Date(isoStr)) / 1000);
            if (diff < 60) return `${diff}s ago`;
            if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
            if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
            return new Date(isoStr).toLocaleDateString();
        }

        function duration(secs) {
            if (secs === null || secs === undefined) return '—';
            if (secs < 60) return `${secs}s`;
            return `${Math.floor(secs / 60)}m ${secs % 60}s`;
        }

        function truncate(str, n = 28) {
            if (!str) return '—';
            return str.length > n ? str.slice(0, n) + '…' : str;
        }

        async function fetchStatus() {
            try {
                const res = await fetch(API_URL);
                if (!res.ok) throw new Error(res.status);
                const data = await res.json();
                renderDashboard(data);
            } catch (e) {
                document.getElementById('agent-status-label').textContent = 'error';
                document.getElementById('agent-status-dot').className = 'w-2 h-2 rounded-full bg-red-500';
            }
        }

        function renderDashboard(data) {
            const { agent, stats, recent_jobs, generated_at } = data;

            // Agent status indicator
            const isIdle = agent.status === 'idle';
            document.getElementById('agent-status-dot').className =
                `w-2 h-2 rounded-full ${isIdle ? 'bg-green-500' : 'bg-yellow-400 pulse-dot'}`;
            document.getElementById('agent-status-label').textContent = agent.status;

            // Stats
            document.getElementById('stat-total').textContent = fmt(stats.total, 0);
            document.getElementById('stat-completed').textContent = fmt(stats.completed, 0);
            document.getElementById('stat-processing').textContent = fmt(stats.processing, 0);
            document.getElementById('stat-pending').textContent = fmt(stats.pending, 0);
            document.getElementById('stat-failed').textContent = fmt(stats.failed, 0);
            document.getElementById('stat-success-rate').textContent =
                stats.total > 0 ? `${stats.success_rate}%` : '—';
            document.getElementById('stat-avg-time').textContent =
                stats.avg_processing_seconds ? duration(Math.round(stats.avg_processing_seconds)) : '—';
            document.getElementById('last-refreshed').textContent =
                generated_at ? new Date(generated_at).toLocaleTimeString() : '—';

            // Progress bar
            const total = stats.total || 1;
            document.getElementById('bar-completed').style.width = `${(stats.completed / total) * 100}%`;
            document.getElementById('bar-processing').style.width = `${(stats.processing / total) * 100}%`;
            document.getElementById('bar-pending').style.width = `${(stats.pending / total) * 100}%`;
            document.getElementById('bar-failed').style.width = `${(stats.failed / total) * 100}%`;
            document.getElementById('dist-label').textContent =
                stats.total > 0
                    ? `${stats.completed} completed · ${stats.failed} failed · ${stats.processing + stats.pending} in queue`
                    : 'No jobs yet';

            // Jobs table
            const tbody = document.getElementById('jobs-tbody');
            if (!recent_jobs || recent_jobs.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" class="px-4 py-8 text-center text-gray-600 text-xs">No transcription jobs yet</td></tr>`;
                return;
            }

            tbody.innerHTML = recent_jobs.map(job => `
                <tr class="border-t border-gray-800 hover:bg-gray-800/40 transition-colors">
                    <td class="px-4 py-3 text-gray-500 text-xs">#${job.id}</td>
                    <td class="px-4 py-3 text-gray-300 text-xs max-w-[160px] truncate" title="${job.original_filename}">${truncate(job.original_filename)}</td>
                    <td class="px-4 py-3 text-gray-400 text-xs">${truncate(job.title ?? '—', 24)}</td>
                    <td class="px-4 py-3">${statusBadge(job.status)}</td>
                    <td class="px-4 py-3 text-right text-gray-400 text-xs">${fmt(job.pages_processed)}</td>
                    <td class="px-4 py-3 text-right text-gray-400 text-xs">${fmt(job.notes_detected)}</td>
                    <td class="px-4 py-3 text-right text-gray-400 text-xs">${duration(job.processing_seconds)}</td>
                    <td class="px-4 py-3 text-gray-500 text-xs">${relativeTime(job.created_at)}</td>
                </tr>
                ${job.status === 'failed' && job.error_message ? `
                <tr class="border-t border-gray-800 bg-red-950/20">
                    <td colspan="8" class="px-4 py-2">
                        <span class="text-xs text-red-400 font-mono">${job.error_message}</span>
                    </td>
                </tr>` : ''}
            `).join('');
        }

        function startCountdown() {
            clearInterval(countdownInterval);
            countdown = 15;
            document.getElementById('countdown').textContent = countdown;
            countdownInterval = setInterval(() => {
                countdown--;
                document.getElementById('countdown').textContent = countdown;
                if (countdown <= 0) {
                    clearInterval(countdownInterval);
                    fetchStatus().then(startCountdown);
                }
            }, 1000);
        }

        fetchStatus().then(startCountdown);
    </script>
</body>
</html>
