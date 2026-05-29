<?php

namespace App\Http\Controllers;

use App\Models\TranscriptionJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;

class MusicTranscriptionController extends Controller
{
    public function uploadAndTranscribe(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf|max:51200',
            'title' => 'nullable|string|max:255',
            'output_format' => 'nullable|in:mscx,mscz,xml',
        ]);

        $file = $request->file('file');
        $title = $request->input('title') ?? pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $outputFormat = $request->input('output_format', 'mscx');

        $storedPath = $file->store('transcriptions/input', 'local');

        $job = TranscriptionJob::create([
            'user_id' => $request->user()?->id,
            'original_filename' => $file->getClientOriginalName(),
            'title' => $title,
            'output_format' => $outputFormat,
            'status' => 'processing',
            'started_at' => now(),
        ]);

        try {
            $inputPath = storage_path('app/' . $storedPath);
            $outputDir = storage_path('app/transcriptions/output');

            if (! is_dir($outputDir)) {
                mkdir($outputDir, 0755, true);
            }

            $process = new Process([
                'python3',
                base_path('python/transcribe_cli.py'),
                '--input', $inputPath,
                '--output', $outputDir,
                '--title', $title,
            ]);
            $process->setTimeout(300);
            $process->run();

            if ($process->isSuccessful()) {
                $result = json_decode($process->getOutput(), true) ?? [];
                $job->update([
                    'status' => 'completed',
                    'pages_processed' => $result['pages_processed'] ?? null,
                    'notes_detected' => $result['notes_detected'] ?? null,
                    'output_file' => 'transcriptions/output/' . $title . '.' . $outputFormat,
                    'completed_at' => now(),
                ]);
            } else {
                throw new \RuntimeException($process->getErrorOutput() ?: 'Transcription process failed');
            }
        } catch (\Throwable $e) {
            $job->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'completed_at' => now(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Transcription failed',
                'error' => $e->getMessage(),
                'job_id' => $job->id,
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Transcription completed successfully',
            'job_id' => $job->id,
            'pages_processed' => $job->pages_processed,
            'notes_detected' => $job->notes_detected,
            'output_file' => basename((string) $job->output_file),
        ], 201);
    }

    public function listTranscriptions(): JsonResponse
    {
        $jobs = TranscriptionJob::latest()
            ->take(50)
            ->get(['id', 'original_filename', 'title', 'output_format', 'status', 'pages_processed', 'notes_detected', 'output_file', 'created_at', 'completed_at']);

        return response()->json([
            'success' => true,
            'transcriptions' => $jobs,
        ]);
    }

    public function downloadTranscription(string $file): mixed
    {
        if (str_contains($file, '..') || str_contains($file, '/') || str_contains($file, '\\')) {
            return response()->json(['error' => 'Invalid file name'], 400);
        }

        $path = 'transcriptions/output/' . $file;

        if (! Storage::exists($path)) {
            return response()->json(['error' => 'File not found'], 404);
        }

        return Storage::download($path, $file);
    }

    public function deleteTranscription(string $file): JsonResponse
    {
        if (str_contains($file, '..') || str_contains($file, '/') || str_contains($file, '\\')) {
            return response()->json(['error' => 'Invalid file name'], 400);
        }

        $path = 'transcriptions/output/' . $file;

        if (! Storage::exists($path)) {
            return response()->json(['error' => 'File not found'], 404);
        }

        Storage::delete($path);
        TranscriptionJob::where('output_file', $path)->latest()->first()?->delete();

        return response()->json(['success' => true, 'message' => 'File deleted']);
    }
}
