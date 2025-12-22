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
        // Detectar subdirectorio y configurar URLs correctamente
        $subdirectory = '';
        
        // Intentar obtener el subdirectorio desde ASSET_URL si está configurado
        $assetUrl = env('ASSET_URL');
        if ($assetUrl && strpos($assetUrl, '/') === 0) {
            $subdirectory = $assetUrl;
        } else {
            // Si no está en env, intentar detectarlo desde REQUEST_URI
            $requestUri = $_SERVER['REQUEST_URI'] ?? '/';
            $requestPath = parse_url($requestUri, PHP_URL_PATH);
            
            if (preg_match('#^/([^/]+)/#', $requestPath, $matches)) {
                $subdirectory = '/' . $matches[1];
            }
        }
        
        // Si detectamos un subdirectorio, configurar las URLs correctamente
        if ($subdirectory) {
            // Configurar ASSET_URL si no está configurado
            if (!env('ASSET_URL')) {
                config(['app.asset_url' => $subdirectory]);
            }
            
            // Configurar APP_URL para que url() helper funcione correctamente
            $currentAppUrl = config('app.url');
            $appUrl = env('APP_URL');
            
            // Si APP_URL no incluye el subdirectorio, agregarlo
            if ($appUrl && strpos($appUrl, $subdirectory) === false) {
                // Asegurar que APP_URL termine con el subdirectorio
                $appUrl = rtrim($appUrl, '/') . $subdirectory;
                config(['app.url' => $appUrl]);
            } elseif (!$appUrl) {
                // Si no hay APP_URL configurado, construir uno desde el request
                $scheme = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
                $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
                $appUrl = $scheme . '://' . $host . $subdirectory;
                config(['app.url' => $appUrl]);
            }
        }
    }
}
