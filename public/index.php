<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Detectar subdirectorio desde la URL
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$requestPath = parse_url($requestUri, PHP_URL_PATH);
$subdirectory = '';

if (preg_match('#^/([^/]+)/#', $requestPath, $matches)) {
    $subdirectory = '/' . $matches[1];
    
    // Establecer ASSET_URL para que Laravel genere URLs correctas
    // Esto debe hacerse ANTES de que Laravel bootstrape
    if (!isset($_ENV['ASSET_URL'])) {
        $_ENV['ASSET_URL'] = $subdirectory;
    }
    if (!getenv('ASSET_URL')) {
        putenv('ASSET_URL=' . $subdirectory);
    }
    // También establecerlo en $_SERVER para que esté disponible inmediatamente
    $_SERVER['ASSET_URL'] = $subdirectory;
    
    // Guardar el REQUEST_URI original para usarlo después
    $originalRequestUri = $_SERVER['REQUEST_URI'];
    
    // Ajustar SCRIPT_NAME para que Laravel detecte el path base correctamente
    if (isset($_SERVER['SCRIPT_NAME'])) {
        $_SERVER['SCRIPT_NAME'] = $subdirectory . '/index.php';
    }
}

// Bootstrap Laravel PRIMERO (sin ajustar REQUEST_URI para que Filament registre rutas correctamente)
$app = require_once __DIR__.'/../bootstrap/app.php';

// AHORA ajustar REQUEST_URI solo para el request actual (después de que las rutas se registren)
if ($subdirectory && isset($originalRequestUri)) {
    $requestPath = parse_url($originalRequestUri, PHP_URL_PATH);
    if (strpos($requestPath, $subdirectory) === 0) {
        $pathWithoutSubdir = substr($requestPath, strlen($subdirectory));
        if ($pathWithoutSubdir === '') {
            $pathWithoutSubdir = '/';
        }
        $_SERVER['REQUEST_URI'] = $pathWithoutSubdir . 
            (isset($_SERVER['QUERY_STRING']) && $_SERVER['QUERY_STRING'] ? '?' . $_SERVER['QUERY_STRING'] : '');
    }
    
    // Ajustar PATH_INFO
    if (isset($_SERVER['PATH_INFO'])) {
        $pathInfo = $_SERVER['PATH_INFO'];
        if (strpos($pathInfo, $subdirectory) === 0) {
            $_SERVER['PATH_INFO'] = substr($pathInfo, strlen($subdirectory));
            if (empty($_SERVER['PATH_INFO'])) {
                $_SERVER['PATH_INFO'] = '/';
            }
        }
    } else {
        $_SERVER['PATH_INFO'] = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    }
}

// Crear el Request usando la URI ajustada
$request = Request::capture();

// Manejar el request
$app->handleRequest($request);
