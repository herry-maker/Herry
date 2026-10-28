<?php

namespace Tests\Feature;

use Illuminate\Http\Request;
use Tests\TestCase;

/**
 * The tuner and the pitch detector are self-contained static pages in public/.
 * These tests cover the Laravel routes that serve them when the web server does not serve the folder directly.
 */
class StaticAppsTest extends TestCase
{
    public function test_tuner_redirects_to_folder_address(): void
    {
        $this->get('/tuner')->assertRedirect('/tuner/');
    }

    public function test_tuner_folder_address_serves_the_page(): void
    {
        // The test client trims trailing slashes, so dispatch a real request for the folder address.
        $response = $this->app->handle(Request::create('/tuner/'));

        $this->assertSame(200, $response->getStatusCode());
        $this->assertStringContainsString('Djahwasi Guitar Tuner', $response->getFile()->getContent());
    }

    public function test_pitch_detector_redirects_to_folder_address(): void
    {
        $this->get('/pitch')->assertRedirect('/pitch/');
    }

    public function test_pitch_detector_folder_address_serves_the_page(): void
    {
        $response = $this->app->handle(Request::create('/pitch/'));

        $this->assertSame(200, $response->getStatusCode());
        $this->assertStringContainsString("<title>Djahwasi's Performance Tools</title>", $response->getFile()->getContent());
    }
}
