<?php

/**
 * Front controller para hosting compartido.
 *
 * Este archivo sirve archivos estáticos desde public/ si existen,
 * o carga el index.php original de Laravel si no existen.
 */

$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$requestPath = parse_url($requestUri, PHP_URL_PATH);

// Remover el prefijo /crm/ si existe
$requestPath = preg_replace('#^/crm/#', '/', $requestPath);
$requestPath = ltrim($requestPath, '/');

// Si es un archivo estático que existe en public/, servirlo directamente
if ($requestPath && $requestPath !== '' && $requestPath !== 'index.php') {
    $publicPath = __DIR__ . '/public/' . $requestPath;
    
    if (file_exists($publicPath) && is_file($publicPath)) {
        // Determinar el tipo MIME
        $mimeType = mime_content_type($publicPath);
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

// Si no es un archivo estático, cargar Laravel
require __DIR__ . '/public/index.php';
