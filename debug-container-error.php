<?php
/**
 * Script para capturar el error exacto del contenedor
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Debug: Error del Contenedor</h2>";
echo "<hr>";

try {
    require __DIR__ . '/vendor/autoload.php';
    
    // Aplicar ajustes de subdirectorio
    $requestUri = $_SERVER['REQUEST_URI'] ?? '/';
    $requestPath = parse_url($requestUri, PHP_URL_PATH);
    $subdirectory = '';
    
    if (preg_match('#^/([^/]+)/#', $requestPath, $matches)) {
        $subdirectory = '/' . $matches[1];
        if (!isset($_ENV['ASSET_URL'])) {
            $_ENV['ASSET_URL'] = $subdirectory;
        }
        if (!getenv('ASSET_URL')) {
            putenv('ASSET_URL=' . $subdirectory);
        }
        $_SERVER['ASSET_URL'] = $subdirectory;
        
        if (isset($_SERVER['SCRIPT_NAME'])) {
            $_SERVER['SCRIPT_NAME'] = $subdirectory . '/index.php';
        }
        
        if (strpos($requestPath, $subdirectory) === 0) {
            $pathWithoutSubdir = substr($requestPath, strlen($subdirectory));
            if ($pathWithoutSubdir === '') {
                $pathWithoutSubdir = '/';
            }
            $_SERVER['REQUEST_URI'] = $pathWithoutSubdir . 
                (isset($_SERVER['QUERY_STRING']) && $_SERVER['QUERY_STRING'] ? '?' . $_SERVER['QUERY_STRING'] : '');
        }
        
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
    
    $app = require_once __DIR__ . '/bootstrap/app.php';
    echo "✅ Aplicación creada<br>";
    
    echo "<h3>Intentando hacer boot con captura de errores detallada:</h3>";
    
    // Registrar un handler de errores personalizado
    set_error_handler(function($errno, $errstr, $errfile, $errline) {
        echo "<div style='background: #fee; padding: 10px; margin: 10px 0; border: 1px solid #f00;'>";
        echo "<strong>Error:</strong> $errstr<br>";
        echo "<strong>Archivo:</strong> $errfile:$errline<br>";
        echo "</div>";
    });
    
    try {
        $app->boot();
        echo "<p style='color: green;'>✅ Boot completado sin errores</p>";
    } catch (\Illuminate\Contracts\Container\BindingResolutionException $e) {
        echo "<div style='background: #fee; padding: 15px; border: 2px solid #f00;'>";
        echo "<h3 style='color: #c00;'>❌ BindingResolutionException</h3>";
        echo "<p><strong>Mensaje:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
        echo "<p><strong>Archivo:</strong> " . htmlspecialchars($e->getFile()) . "</p>";
        echo "<p><strong>Línea:</strong> " . $e->getLine() . "</p>";
        
        // Intentar extraer qué clase está intentando resolver
        $message = $e->getMessage();
        if (preg_match('/Target class \[([^\]]+)\]/', $message, $matches)) {
            echo "<p><strong>Clase que intenta resolver:</strong> <code>" . htmlspecialchars($matches[1]) . "</code></p>";
        }
        
        echo "<h4>Stack Trace:</h4>";
        echo "<pre style='background: #fdd; padding: 10px; overflow: auto; max-height: 400px; font-size: 11px;'>";
        echo htmlspecialchars($e->getTraceAsString());
        echo "</pre>";
        echo "</div>";
    } catch (\Throwable $e) {
        echo "<div style='background: #fee; padding: 15px; border: 2px solid #f00;'>";
        echo "<h3 style='color: #c00;'>❌ Error durante boot</h3>";
        echo "<p><strong>Tipo:</strong> " . get_class($e) . "</p>";
        echo "<p><strong>Mensaje:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
        echo "<p><strong>Archivo:</strong> " . htmlspecialchars($e->getFile()) . "</p>";
        echo "<p><strong>Línea:</strong> " . $e->getLine() . "</p>";
        
        // Intentar extraer información útil
        $message = $e->getMessage();
        if (preg_match('/Target class \[([^\]]+)\]/', $message, $matches)) {
            echo "<p><strong>⚠️ Clase que intenta resolver:</strong> <code style='background: #fff; padding: 5px;'>" . htmlspecialchars($matches[1]) . "</code></p>";
            echo "<p>Esta clase no está registrada en el contenedor de Laravel.</p>";
        }
        
        echo "<h4>Stack Trace (primeras 20 líneas):</h4>";
        echo "<pre style='background: #fdd; padding: 10px; overflow: auto; max-height: 400px; font-size: 11px;'>";
        $trace = explode("\n", $e->getTraceAsString());
        echo htmlspecialchars(implode("\n", array_slice($trace, 0, 20)));
        echo "</pre>";
        echo "</div>";
    }
    
    restore_error_handler();
    
} catch (\Throwable $e) {
    echo "<div style='background: #fee; padding: 15px; border: 2px solid #f00;'>";
    echo "<h3 style='color: #c00;'>❌ Error Fatal</h3>";
    echo "<p><strong>Tipo:</strong> " . get_class($e) . "</p>";
    echo "<p><strong>Mensaje:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "</div>";
}

