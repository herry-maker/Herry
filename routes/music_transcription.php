<?php

use App\Http\Controllers\AgentMonitorController;
use App\Http\Controllers\MusicTranscriptionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Music Transcription API Routes
|--------------------------------------------------------------------------
|
| Routes for PDF to MuseScore music transcription feature
|
*/

Route::prefix('api/music')->group(function () {
    // Upload and transcribe PDF
    Route::post('/transcribe', [MusicTranscriptionController::class, 'uploadAndTranscribe']);
    
    // List all transcriptions
    Route::get('/transcriptions', [MusicTranscriptionController::class, 'listTranscriptions']);
    
    // Download a transcribed file
    Route::get('/download/{file}', [MusicTranscriptionController::class, 'downloadTranscription'])
        ->name('download-transcription');
    
    // Delete a transcribed file
    Route::delete('/delete/{file}', [MusicTranscriptionController::class, 'deleteTranscription']);

    // Research agent monitor status (JSON)
    Route::get('/agent', [AgentMonitorController::class, 'status'])->name('agent-status');
});
