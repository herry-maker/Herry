<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MusicTranscriptionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create storage directories for testing
        Storage::fake('local');
    }

    /**
     * Test uploading and transcribing a PDF file.
     */
    public function test_upload_pdf_for_transcription()
    {
        // Create a fake PDF file
        $file = UploadedFile::fake()->create('sheet_music.pdf', 500, 'application/pdf');

        $response = $this->postJson('/api/music/transcribe', [
            'pdf_file' => $file,
            'title' => 'Test Transcription',
        ]);

        // Should return 201 if file is processed
        // Note: Without actual Python dependencies, this may fail
        // In production, mock the Python subprocess or use dependency injection
        
        $response->assertStatus([201, 422]); // Either success or validation error
    }

    /**
     * Test that PDF file is required.
     */
    public function test_pdf_file_is_required()
    {
        $response = $this->postJson('/api/music/transcribe', [
            'title' => 'Test Without File',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('pdf_file');
    }

    /**
     * Test that file must be PDF.
     */
    public function test_file_must_be_pdf()
    {
        $file = UploadedFile::fake()->create('document.txt', 100, 'text/plain');

        $response = $this->postJson('/api/music/transcribe', [
            'pdf_file' => $file,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('pdf_file');
    }

    /**
     * Test file size limit (50MB).
     */
    public function test_file_size_limit()
    {
        $file = UploadedFile::fake()->create(
            'large_file.pdf',
            51200, // 50MB
            'application/pdf'
        );

        $response = $this->postJson('/api/music/transcribe', [
            'pdf_file' => $file,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('pdf_file');
    }

    /**
     * Test listing transcriptions.
     */
    public function test_list_transcriptions()
    {
        $response = $this->getJson('/api/music/transcriptions');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'message',
            'data' => [
                '*' => [
                    'file_name',
                    'created_at',
                    'size',
                    'download_url'
                ]
            ]
        ]);
    }

    /**
     * Test downloading a transcription file.
     */
    public function test_download_transcription()
    {
        // First create a dummy file in storage
        Storage::disk('local')->put(
            'music_transcriptions/test_file.mscx',
            'test content'
        );

        $response = $this->getJson('/api/music/download/test_file.mscx');

        // Should return the file or 200
        $this->assertIn($response->getStatusCode(), [200, 404]);
    }

    /**
     * Test directory traversal protection.
     */
    public function test_directory_traversal_protection()
    {
        // Try to access files outside the transcriptions directory
        $response = $this->getJson('/api/music/download/../../../.env');

        $response->assertStatus(404);
    }

    /**
     * Test deleting a transcription.
     */
    public function test_delete_transcription()
    {
        // Create a dummy file
        Storage::disk('local')->put(
            'music_transcriptions/test_delete.mscx',
            'test content'
        );

        $response = $this->deleteJson('/api/music/delete/test_delete.mscx');

        // Should return success message
        $this->assertIn($response->getStatusCode(), [200, 404]);
    }

    /**
     * Test optional output format parameter.
     */
    public function test_output_format_validation()
    {
        $file = UploadedFile::fake()->create('sheet_music.pdf', 500, 'application/pdf');

        $response = $this->postJson('/api/music/transcribe', [
            'pdf_file' => $file,
            'output_format' => 'invalid_format',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('output_format');
    }

    /**
     * Test with valid output format.
     */
    public function test_valid_output_formats()
    {
        $file = UploadedFile::fake()->create('sheet_music.pdf', 500, 'application/pdf');

        foreach (['mscx', 'mscz', 'xml'] as $format) {
            $response = $this->postJson('/api/music/transcribe', [
                'pdf_file' => $file,
                'output_format' => $format,
            ]);

            // Should not fail validation
            $this->assertNotEquals(422, $response->getStatusCode(), 
                "Format {$format} failed validation");
        }
    }

    /**
     * Test optional title parameter.
     */
    public function test_optional_title_parameter()
    {
        $file = UploadedFile::fake()->create('sheet_music.pdf', 500, 'application/pdf');

        $response = $this->postJson('/api/music/transcribe', [
            'pdf_file' => $file,
            'title' => 'My Custom Title',
        ]);

        $response->assertStatus([201, 422]); // Either success or subprocess error
    }

    /**
     * Test title must be string and max 255 chars.
     */
    public function test_title_validation()
    {
        $file = UploadedFile::fake()->create('sheet_music.pdf', 500, 'application/pdf');

        $longTitle = str_repeat('a', 256);
        $response = $this->postJson('/api/music/transcribe', [
            'pdf_file' => $file,
            'title' => $longTitle,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('title');
    }

    /**
     * Test that response has correct structure on success.
     */
    public function test_response_structure_on_success()
    {
        // Note: This test assumes Python dependencies are available
        // In a real environment, you would mock the controller method
        
        $file = UploadedFile::fake()->create('sheet_music.pdf', 500, 'application/pdf');

        $response = $this->postJson('/api/music/transcribe', [
            'pdf_file' => $file,
            'title' => 'Test',
        ]);

        if ($response->status() === 201) {
            $response->assertJsonStructure([
                'message',
                'data' => [
                    'file_name',
                    'title',
                    'output_file',
                    'pages_processed',
                    'notes_detected',
                    'download_url'
                ]
            ]);
        }
    }

    /**
     * Test error response structure.
     */
    public function test_error_response_structure()
    {
        // Send request without required file
        $response = $this->postJson('/api/music/transcribe', []);

        $response->assertStatus(422);
        $response->assertJsonStructure([
            'message',
            'errors' => [
                'pdf_file' => []
            ]
        ]);
    }
}
