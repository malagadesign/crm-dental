<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;
use Illuminate\Filesystem\Filesystem;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Registrar el servicio 'files' que Laravel necesita
        // Esto es necesario porque Laravel intenta acceder a él durante el boot
        // antes de que el FilesystemServiceProvider se registre
        $this->app->singleton('files', function () {
            return new Filesystem();
        });
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
        
        // Asegurar que el REQUEST_URI esté limpio durante el registro de rutas
        // Esto es crítico para que Filament registre correctamente las rutas POST
        if (isset($_SERVER['ORIGINAL_REQUEST_URI'])) {
            // Si hay un REQUEST_URI original guardado, restaurarlo temporalmente
            // solo para el contexto actual, pero mantener limpio para el registro de rutas
            $_SERVER['REQUEST_URI'] = $_SERVER['ORIGINAL_REQUEST_URI'];
        }
    }
}
