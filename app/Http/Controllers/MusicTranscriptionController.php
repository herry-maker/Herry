<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class MusicTranscriptionController extends Controller
{
    private const UPLOAD_DISK      = 'local';
    private const UPLOAD_DIRECTORY = 'music_transcriptions';
    private const MAX_SIZE_KB      = 10240; // 10 MB
    private const VALID_FORMATS    = ['mscx', 'mscz', 'xml'];

    public function uploadAndTranscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pdf_file'      => ['required', 'file', 'mimes:pdf', 'max:' . self::MAX_SIZE_KB],
            'title'         => ['sometimes', 'string', 'max:255'],
            'output_format' => ['sometimes', 'string', 'in:' . implode(',', self::VALID_FORMATS)],
        ]);

        $file   = $validated['pdf_file'];
        $title  = $validated['title'] ?? pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $format = $validated['output_format'] ?? 'mscx';

        // Store the uploaded PDF.
        $storedPath = $file->store(self::UPLOAD_DIRECTORY, self::UPLOAD_DISK);

        // Build the output filename.
        $outputFilename = Str::slug($title) . '_' . time() . '.' . $format;
        $outputPath     = self::UPLOAD_DIRECTORY . '/' . $outputFilename;

        // Invoke the Python transcription script.
        $pythonScript = base_path('python/music_transcriber.py');
        $inputPath    = Storage::disk(self::UPLOAD_DISK)->path($storedPath);
        $outputFull   = Storage::disk(self::UPLOAD_DISK)->path($outputPath);

        $command = sprintf(
            'python3 %s %s %s %s 2>&1',
            escapeshellarg($pythonScript),
            escapeshellarg($inputPath),
            escapeshellarg($outputFull),
            escapeshellarg($format),
        );

        $output    = [];
        $exitCode  = 0;
        exec($command, $output, $exitCode);

        Storage::disk(self::UPLOAD_DISK)->delete($storedPath);

        if ($exitCode !== 0) {
            return response()->json([
                'message' => 'Transcription failed.',
                'errors'  => ['transcription' => implode("\n", $output)],
            ], 422);
        }

        return response()->json([
            'message' => 'Transcription successful.',
            'data'    => [
                'file_name'       => $outputFilename,
                'title'           => $title,
                'output_file'     => $outputPath,
                'pages_processed' => null,
                'notes_detected'  => null,
                'download_url'    => route('download-transcription', ['file' => $outputFilename]),
            ],
        ], 201);
    }

    public function listTranscriptions(): JsonResponse
    {
        $files = collect(Storage::disk(self::UPLOAD_DISK)->files(self::UPLOAD_DIRECTORY))
            ->map(function (string $path): array {
                $name = basename($path);

                return [
                    'file_name'    => $name,
                    'created_at'   => date('Y-m-d H:i:s', Storage::disk(self::UPLOAD_DISK)->lastModified($path)),
                    'size'         => Storage::disk(self::UPLOAD_DISK)->size($path),
                    'download_url' => route('download-transcription', ['file' => $name]),
                ];
            })
            ->values();

        return response()->json([
            'message' => 'Transcriptions retrieved.',
            'data'    => $files,
        ]);
    }

    public function downloadTranscription(string $file): BinaryFileResponse|JsonResponse
    {
        // Prevent directory traversal.
        if (Str::contains($file, ['..', '/'])) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        $path = self::UPLOAD_DIRECTORY . '/' . $file;

        if (! Storage::disk(self::UPLOAD_DISK)->exists($path)) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        return response()->download(Storage::disk(self::UPLOAD_DISK)->path($path));
    }

    public function deleteTranscription(string $file): JsonResponse
    {
        if (Str::contains($file, ['..', '/'])) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        $path = self::UPLOAD_DIRECTORY . '/' . $file;

        if (! Storage::disk(self::UPLOAD_DISK)->exists($path)) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        Storage::disk(self::UPLOAD_DISK)->delete($path);

        return response()->json(['message' => 'File deleted successfully.']);
    }
}
