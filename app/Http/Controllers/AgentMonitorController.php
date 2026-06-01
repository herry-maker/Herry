<?php

namespace App\Http\Controllers;

use App\Models\TranscriptionJob;
use Illuminate\Http\JsonResponse;
use Illuminate\View\View;

class AgentMonitorController extends Controller
{
    public function index(): View
    {
        return view('agent-monitor');
    }

    public function status(): JsonResponse
    {
        $total = TranscriptionJob::count();
        $completed = TranscriptionJob::where('status', 'completed')->count();
        $failed = TranscriptionJob::where('status', 'failed')->count();
        $processing = TranscriptionJob::where('status', 'processing')->count();
        $pending = TranscriptionJob::where('status', 'pending')->count();

        $avgSeconds = TranscriptionJob::where('status', 'completed')
            ->whereNotNull('started_at')
            ->whereNotNull('completed_at')
            ->selectRaw('AVG(strftime("%s", completed_at) - strftime("%s", started_at)) as avg_seconds')
            ->value('avg_seconds');

        $successRate = $total > 0
            ? round(($completed / $total) * 100, 1)
            : 0.0;

        $recentJobs = TranscriptionJob::latest()
            ->take(20)
            ->get([
                'id', 'original_filename', 'title', 'output_format',
                'status', 'pages_processed', 'notes_detected',
                'error_message', 'started_at', 'completed_at', 'created_at',
            ])
            ->map(function (TranscriptionJob $job) {
                return array_merge($job->toArray(), [
                    'processing_seconds' => $job->processingSeconds(),
                ]);
            });

        return response()->json([
            'agent' => [
                'status' => $processing > 0 ? 'busy' : 'idle',
                'version' => '1.0.0',
            ],
            'stats' => [
                'total' => $total,
                'completed' => $completed,
                'failed' => $failed,
                'processing' => $processing,
                'pending' => $pending,
                'success_rate' => $successRate,
                'avg_processing_seconds' => $avgSeconds ? round($avgSeconds, 1) : null,
            ],
            'recent_jobs' => $recentJobs,
            'generated_at' => now()->toIso8601String(),
        ]);
    }
}
