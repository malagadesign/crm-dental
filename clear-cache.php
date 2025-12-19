<?php
/**
 * Script para limpiar todas las cachés de Laravel
 * Acceder desde: https://agoradental.com.ar/crm/clear-cache.php
 * 
 * IMPORTANTE: Eliminar este archivo después de usarlo por seguridad
 */

// Detectar subdirectorio
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$requestPath = parse_url($requestUri, PHP_URL_PATH);
$subdirectory = '';

if (preg_match('#^/([^/]+)/#', $requestPath, $matches)) {
    $subdirectory = '/' . $matches[1];
    
    // Establecer ASSET_URL
    if (!isset($_ENV['ASSET_URL'])) {
        $_ENV['ASSET_URL'] = $subdirectory;
    }
    if (!getenv('ASSET_URL')) {
        putenv('ASSET_URL=' . $subdirectory);
    }
    $_SERVER['ASSET_URL'] = $subdirectory;
    
    // Limpiar REQUEST_URI antes del bootstrap
    $requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (strpos($requestPath, $subdirectory) === 0) {
        $pathWithoutSubdir = substr($requestPath, strlen($subdirectory));
        if ($pathWithoutSubdir === '') {
            $pathWithoutSubdir = '/';
        }
        $_SERVER['REQUEST_URI'] = $pathWithoutSubdir;
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
    
    // Ajustar SCRIPT_NAME
    if (isset($_SERVER['SCRIPT_NAME'])) {
        $_SERVER['SCRIPT_NAME'] = $subdirectory . '/index.php';
    }
}

// Bootstrap Laravel
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

// Ejecutar los comandos de limpieza
$results = [];
$success = true;

try {
    // Método 1: Intentar usar Artisan directamente (más confiable)
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    
    // Limpiar caché de rutas
    try {
        $kernel->call('route:clear');
        $results['route:clear'] = '✅ Caché de rutas limpiada correctamente';
    } catch (Exception $e) {
        $results['route:clear'] = '❌ Error: ' . $e->getMessage();
        $success = false;
    }
    
    // Limpiar caché de configuración
    try {
        $kernel->call('config:clear');
        $results['config:clear'] = '✅ Caché de configuración limpiada correctamente';
    } catch (Exception $e) {
        $results['config:clear'] = '❌ Error: ' . $e->getMessage();
        $success = false;
    }
    
    // Limpiar caché de vistas
    try {
        $kernel->call('view:clear');
        $results['view:clear'] = '✅ Caché de vistas limpiada correctamente';
    } catch (Exception $e) {
        $results['view:clear'] = '❌ Error: ' . $e->getMessage();
        $success = false;
    }
    
    // Limpiar caché general
    try {
        $kernel->call('cache:clear');
        $results['cache:clear'] = '✅ Caché general limpiada correctamente';
    } catch (Exception $e) {
        $results['cache:clear'] = '❌ Error: ' . $e->getMessage();
        $success = false;
    }
    
    // Limpiar caché optimizada (si existe)
    try {
        $kernel->call('optimize:clear');
        $results['optimize:clear'] = '✅ Caché optimizada limpiada correctamente';
    } catch (Exception $e) {
        $results['optimize:clear'] = '⚠️ Comando no disponible o ya estaba limpio: ' . $e->getMessage();
    }
    
    // Método alternativo: Limpiar archivos manualmente si es necesario
    $cacheDirs = [
        __DIR__ . '/bootstrap/cache/config.php',
        __DIR__ . '/bootstrap/cache/routes-v7.php',
        __DIR__ . '/bootstrap/cache/routes.php',
        __DIR__ . '/storage/framework/views',
        __DIR__ . '/storage/framework/cache',
    ];
    
    $manualClears = [];
    foreach ($cacheDirs as $cachePath) {
        if (is_file($cachePath)) {
            if (@unlink($cachePath)) {
                $manualClears[] = '✅ Eliminado: ' . basename($cachePath);
            }
        } elseif (is_dir($cachePath)) {
            // Limpiar directorio de caché
            $files = glob($cachePath . '/*');
            $deleted = 0;
            foreach ($files as $file) {
                if (is_file($file) && @unlink($file)) {
                    $deleted++;
                }
            }
            if ($deleted > 0) {
                $manualClears[] = "✅ Limpiado directorio: " . basename($cachePath) . " ($deleted archivos)";
            }
        }
    }
    
    if (!empty($manualClears)) {
        $results['manual_cleanup'] = implode("\n", $manualClears);
    }
    
} catch (Exception $e) {
    $results['error'] = 'Error general: ' . $e->getMessage();
    $success = false;
}

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Limpiar Caché - CRM Dental</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-top: 0;
        }
        .command {
            background: #f8f9fa;
            padding: 15px;
            margin: 10px 0;
            border-radius: 4px;
            border-left: 4px solid #007bff;
        }
        .command h3 {
            margin-top: 0;
            color: #007bff;
        }
        .output {
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 10px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            overflow-x: auto;
            white-space: pre-wrap;
        }
        .success {
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 4px;
            border-left: 4px solid #28a745;
            margin: 20px 0;
        }
        .error {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 4px;
            border-left: 4px solid #dc3545;
            margin: 20px 0;
        }
        .warning {
            background: #fff3cd;
            color: #856404;
            padding: 15px;
            border-radius: 4px;
            border-left: 4px solid #ffc107;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧹 Limpiar Caché de Laravel</h1>
        
        <?php if ($success): ?>
            <div class="success">
                <strong>✅ Cachés limpiadas correctamente</strong>
            </div>
        <?php else: ?>
            <div class="error">
                <strong>❌ Error al limpiar cachés</strong>
            </div>
        <?php endif; ?>
        
        <div class="warning">
            <strong>⚠️ IMPORTANTE:</strong> Elimina este archivo después de usarlo por seguridad.
        </div>
        
        <?php foreach ($results as $command => $output): ?>
            <div class="command">
                <h3>php artisan <?php echo htmlspecialchars($command); ?></h3>
                <div class="output"><?php echo htmlspecialchars($output ?: '(sin salida)'); ?></div>
            </div>
        <?php endforeach; ?>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p><strong>Próximos pasos:</strong></p>
            <ol>
                <li>Verifica que las rutas se hayan limpiado correctamente</li>
                <li>Prueba hacer login nuevamente</li>
                <li>Elimina este archivo (<code>clear-cache.php</code>) del servidor</li>
            </ol>
        </div>
    </div>
</body>
</html>
