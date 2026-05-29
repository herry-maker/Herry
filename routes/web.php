<?php

use App\Http\Controllers\AgentMonitorController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/agent-monitor', [AgentMonitorController::class, 'index'])->name('agent-monitor');
