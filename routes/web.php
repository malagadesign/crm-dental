<?php

use App\Http\Controllers\WhatsAppWebhookController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Webhook de WhatsApp Business API
Route::get('/webhook/whatsapp', [WhatsAppWebhookController::class, 'verify']);
Route::post('/webhook/whatsapp', [WhatsAppWebhookController::class, 'webhook']);

// API para procesar DNI con OCR
Route::middleware(['auth'])->group(function () {
    Route::post('/api/dni/process', [\App\Http\Controllers\Api\DniOcrController::class, 'process']);
});
