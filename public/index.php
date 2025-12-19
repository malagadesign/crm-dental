<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Detectar y manejar subdirectorio ANTES de cualquier otra cosa
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$requestPath = parse_url($requestUri, PHP_URL_PATH);
$subdirectory = '';

// Detectar subdirectorio desde el path
if (preg_match('#^/([^/]+)/#', $requestPath, $matches)) {
    $subdirectory = '/' . $matches[1];
}

// Si hay subdirectorio, ajustar las variables del servidor ANTES del bootstrap
if ($subdirectory) {
    // Guardar el REQUEST_URI original
    $originalRequestUri = $_SERVER['REQUEST_URI'];
    $originalPathInfo = $_SERVER['PATH_INFO'] ?? null;
    $originalScriptName = $_SERVER['SCRIPT_NAME'] ?? null;
    
    // Establecer ASSET_URL para que Laravel genere URLs correctas
    if (!isset($_ENV['ASSET_URL'])) {
        $_ENV['ASSET_URL'] = $subdirectory;
    }
    if (!getenv('ASSET_URL')) {
        putenv('ASSET_URL=' . $subdirectory);
    }
    $_SERVER['ASSET_URL'] = $subdirectory;
    
    // CRÍTICO: Limpiar REQUEST_URI ANTES del bootstrap
    // Esto es esencial para que Filament registre las rutas correctamente
    $requestPath = parse_url($originalRequestUri, PHP_URL_PATH);
    if (strpos($requestPath, $subdirectory) === 0) {
        $pathWithoutSubdir = substr($requestPath, strlen($subdirectory));
        if ($pathWithoutSubdir === '') {
            $pathWithoutSubdir = '/';
        }
        // Limpiar completamente el REQUEST_URI para el bootstrap
        $_SERVER['REQUEST_URI'] = $pathWithoutSubdir . 
            (isset($_SERVER['QUERY_STRING']) && $_SERVER['QUERY_STRING'] ? '?' . $_SERVER['QUERY_STRING'] : '');
    }
    
    // Ajustar PATH_INFO antes del bootstrap
    if (isset($originalPathInfo)) {
        $pathInfo = $originalPathInfo;
        if (strpos($pathInfo, $subdirectory) === 0) {
            $_SERVER['PATH_INFO'] = substr($pathInfo, strlen($subdirectory));
            if (empty($_SERVER['PATH_INFO'])) {
                $_SERVER['PATH_INFO'] = '/';
            }
        } else {
            $_SERVER['PATH_INFO'] = $pathInfo;
        }
    } else {
        // Si no hay PATH_INFO, crearlo desde el REQUEST_URI limpio
        $_SERVER['PATH_INFO'] = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    }
    
    // Ajustar SCRIPT_NAME para que Laravel detecte el path base correctamente
    // Pero mantenerlo relativo para que las rutas se registren correctamente
    if (isset($_SERVER['SCRIPT_NAME'])) {
        // Guardar el original pero ajustar para el contexto
        $_SERVER['ORIGINAL_SCRIPT_NAME'] = $_SERVER['SCRIPT_NAME'];
        $_SERVER['SCRIPT_NAME'] = $subdirectory . '/index.php';
    }
}

// Bootstrap Laravel con REQUEST_URI limpio (sin subdirectorio)
// Esto permite que Filament registre las rutas correctamente
$app = require_once __DIR__.'/../bootstrap/app.php';

// Crear el Request usando la URI ajustada
$request = Request::capture();

// Manejar el request
$app->handleRequest($request);
