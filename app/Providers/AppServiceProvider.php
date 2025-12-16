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
        try {
            $requestUri = $_SERVER['REQUEST_URI'] ?? '/';
            $requestPath = parse_url($requestUri, PHP_URL_PATH);
            
            if (preg_match('#^/([^/]+)/#', $requestPath, $matches)) {
                $subdirectory = '/' . $matches[1];
                
                // Establecer ASSET_URL si no está configurado
                if (!env('ASSET_URL')) {
                    config(['app.asset_url' => $subdirectory]);
                }
                
                // Configurar Livewire para usar el prefijo del subdirectorio
                // Esto se hace después de que Livewire se haya registrado
                try {
                    if ($this->app->bound('livewire')) {
                        // Forzar que Livewire use el prefijo en sus URLs
                        $assetUrl = env('ASSET_URL', $subdirectory);
                        if ($assetUrl) {
                            config(['livewire.asset_url' => $assetUrl]);
                        }
                    }
                } catch (\Exception $e) {
                    // Si falla, no es crítico
                }
                
                // Forzar que el UrlGenerator use el prefijo para assets
                // Solo si el servicio ya está disponible
                try {
                    if ($this->app->bound('url')) {
                        $urlGenerator = $this->app->make('url');
                        // Usar config('app.url') directamente, que es más seguro
                        $root = config('app.url', '');
                        if ($root && !str_ends_with($root, $subdirectory)) {
                            $urlGenerator->forceRootUrl($root . $subdirectory);
                        }
                    }
                } catch (\Exception $e) {
                    // Si falla, no es crítico, continuar
                }
            }
        } catch (\Exception $e) {
            // Si hay algún error en la detección, no bloquear el boot
        }
    }
}
