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
        // Detectar subdirectorio y forzar que todas las URLs lo incluyan
        $requestUri = $_SERVER['REQUEST_URI'] ?? '/';
        $requestPath = parse_url($requestUri, PHP_URL_PATH);
        
        if (preg_match('#^/([^/]+)/#', $requestPath, $matches)) {
            $subdirectory = '/' . $matches[1];
            
            // Establecer ASSET_URL si no está configurado
            if (!env('ASSET_URL')) {
                config(['app.asset_url' => $subdirectory]);
            }
            
            // Forzar que el UrlGenerator use el prefijo para assets
            if (app()->bound('url')) {
                $urlGenerator = app('url');
                $root = $urlGenerator->getRootUrl();
                if (!str_ends_with($root, $subdirectory)) {
                    $urlGenerator->forceRootUrl($root . $subdirectory);
                }
            }
        }
    }
}
