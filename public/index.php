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
    
    // Ajustar SCRIPT_NAME para que Laravel detecte el path base correctamente
    if (isset($_SERVER['SCRIPT_NAME'])) {
        $_SERVER['SCRIPT_NAME'] = $subdirectory . '/index.php';
    }
    
    // Ajustar PATH_INFO para remover el subdirectorio
    // Esto es crítico para que las rutas funcionen correctamente
    if (isset($_SERVER['PATH_INFO'])) {
        $pathInfo = $_SERVER['PATH_INFO'];
        if (strpos($pathInfo, $subdirectory) === 0) {
            $_SERVER['PATH_INFO'] = substr($pathInfo, strlen($subdirectory));
            if (empty($_SERVER['PATH_INFO'])) {
                $_SERVER['PATH_INFO'] = '/';
            }
        }
    } else {
        // Si no hay PATH_INFO, extraerlo de REQUEST_URI
        $pathWithoutSubdir = substr($requestPath, strlen($subdirectory));
        if ($pathWithoutSubdir === '') {
            $pathWithoutSubdir = '/';
        }
        $_SERVER['PATH_INFO'] = $pathWithoutSubdir;
    }
}

// Bootstrap Laravel and handle the request...
(require_once __DIR__.'/../bootstrap/app.php')
    ->handleRequest(Request::capture());
