<?php

/**
 * Front controller para hosting compartido.
 *
 * Este archivo sirve archivos estáticos desde public/ si existen,
 * o carga el index.php original de Laravel si no existen.
 */

// Habilitar errores para debugging (remover en producción si es necesario)
if (getenv('APP_DEBUG') === 'true' || (isset($_GET['debug']) && $_GET['debug'] === '1')) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
}

$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$requestPath = parse_url($requestUri, PHP_URL_PATH);

// Detectar si estamos en un subdirectorio (/crm/)
$subdirectory = '';
if (preg_match('#^/([^/]+)/#', $requestPath, $matches)) {
    $subdirectory = '/' . $matches[1];
}

// Establecer ASSET_URL para que Laravel genere URLs correctas
// Esto debe hacerse ANTES de que Laravel bootstrape
if ($subdirectory) {
    if (!isset($_ENV['ASSET_URL'])) {
        $_ENV['ASSET_URL'] = $subdirectory;
    }
    if (!getenv('ASSET_URL')) {
        putenv('ASSET_URL=' . $subdirectory);
    }
    // También establecerlo en $_SERVER para que esté disponible inmediatamente
    $_SERVER['ASSET_URL'] = $subdirectory;
}

// Remover el prefijo /crm/ si existe para procesamiento interno
$requestPath = preg_replace('#^/crm/#', '/', $requestPath);
$requestPath = ltrim($requestPath, '/');

// Si es un archivo estático que existe en public/, servirlo directamente
if ($requestPath && $requestPath !== '' && $requestPath !== 'index.php') {
    $publicPath = __DIR__ . '/public/' . $requestPath;
    
    if (file_exists($publicPath) && is_file($publicPath)) {
        // Determinar el tipo MIME
        $mimeType = @mime_content_type($publicPath);
        if (!$mimeType) {
            $extension = pathinfo($publicPath, PATHINFO_EXTENSION);
            $mimeTypes = [
                'css' => 'text/css',
                'js' => 'application/javascript',
                'png' => 'image/png',
                'jpg' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'gif' => 'image/gif',
                'svg' => 'image/svg+xml',
                'ico' => 'image/x-icon',
            ];
            $mimeType = $mimeTypes[$extension] ?? 'application/octet-stream';
        }
        
        header('Content-Type: ' . $mimeType);
        readfile($publicPath);
        exit;
    }
}

// Modificar SCRIPT_NAME para que Laravel detecte el subdirectorio correctamente
if ($subdirectory && isset($_SERVER['SCRIPT_NAME'])) {
    $_SERVER['SCRIPT_NAME'] = $subdirectory . '/index.php';
}

// Si no es un archivo estático, cargar Laravel
try {
    require __DIR__ . '/public/index.php';
} catch (\Throwable $e) {
    // Si hay un error fatal, mostrar información útil
    http_response_code(500);
    header('Content-Type: text/html; charset=utf-8');
    echo "<!DOCTYPE html><html><head><title>Error 500</title></head><body>";
    echo "<h1>Error 500 - Error del Servidor</h1>";
    if (getenv('APP_DEBUG') === 'true' || (isset($_GET['debug']) && $_GET['debug'] === '1')) {
        echo "<h2>Detalles del Error:</h2>";
        echo "<p><strong>Mensaje:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
        echo "<p><strong>Archivo:</strong> " . htmlspecialchars($e->getFile()) . "</p>";
        echo "<p><strong>Línea:</strong> " . $e->getLine() . "</p>";
        echo "<pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
    } else {
        echo "<p>Ha ocurrido un error. Por favor, contactá al administrador.</p>";
        echo "<p>Para ver detalles del error, agregá <code>?debug=1</code> a la URL.</p>";
    }
    echo "</body></html>";
    exit(1);
}
