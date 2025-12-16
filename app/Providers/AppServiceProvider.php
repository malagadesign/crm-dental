<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // La configuración del subdirectorio se maneja en public/index.php
        // para evitar interferir con el registro de rutas de Filament
        // Solo establecer ASSET_URL si no está configurado
        if (!env('ASSET_URL')) {
            $requestUri = $_SERVER['REQUEST_URI'] ?? '/';
            $requestPath = parse_url($requestUri, PHP_URL_PATH);
            
            if (preg_match('#^/([^/]+)/#', $requestPath, $matches)) {
                $subdirectory = '/' . $matches[1];
                config(['app.asset_url' => $subdirectory]);
            }
        }
    }
}
