<?php
/**
 * Script de debugging para capturar errores de la aplicación
 * 
 * Este archivo captura y muestra los errores reales que están causando el 500
 */

// Habilitar mostrar todos los errores
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

echo "<h2>Debug de Error 500</h2>";
echo "<hr>";

try {
    echo "<h3>1. Verificando archivos básicos...</h3>";
    
    $files = [
        'vendor/autoload.php',
        'bootstrap/app.php',
        'public/index.php',
        '.env'
    ];
    
    foreach ($files as $file) {
        $path = __DIR__ . '/' . $file;
        if (file_exists($path)) {
            echo "✅ $file existe<br>";
        } else {
            echo "❌ $file NO existe<br>";
        }
    }
    
    echo "<hr>";
    echo "<h3>2. Intentando cargar Laravel...</h3>";
    
    require __DIR__ . '/vendor/autoload.php';
    echo "✅ Autoloader cargado<br>";
    
    $app = require_once __DIR__ . '/bootstrap/app.php';
    echo "✅ Bootstrap app cargado<br>";
    
    echo "<hr>";
    echo "<h3>3. Intentando capturar request...</h3>";
    
    $request = \Illuminate\Http\Request::capture();
    echo "✅ Request capturado<br>";
    echo "URI: " . $request->getRequestUri() . "<br>";
    echo "Path: " . $request->getPathInfo() . "<br>";
    
    echo "<hr>";
    echo "<h3>4. Intentando manejar request...</h3>";
    
    $response = $app->handleRequest($request);
    echo "✅ Request manejado exitosamente<br>";
    
    echo "<hr>";
    echo "<h3>5. Preparando respuesta...</h3>";
    $response->send();
    
} catch (\Throwable $e) {
    echo "<div style='background: #fee; padding: 15px; border: 2px solid #f00; border-radius: 5px;'>";
    echo "<h3 style='color: #c00;'>❌ Error Capturado</h3>";
    echo "<p><strong>Tipo:</strong> " . get_class($e) . "</p>";
    echo "<p><strong>Mensaje:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p><strong>Archivo:</strong> " . htmlspecialchars($e->getFile()) . "</p>";
    echo "<p><strong>Línea:</strong> " . $e->getLine() . "</p>";
    
    if ($e->getPrevious()) {
        echo "<h4>Error Anterior:</h4>";
        echo "<p><strong>Mensaje:</strong> " . htmlspecialchars($e->getPrevious()->getMessage()) . "</p>";
    }
    
    echo "<h4>Stack Trace:</h4>";
    echo "<pre style='background: #fdd; padding: 10px; overflow: auto; max-height: 400px;'>";
    echo htmlspecialchars($e->getTraceAsString());
    echo "</pre>";
    echo "</div>";
}
