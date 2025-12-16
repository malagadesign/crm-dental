<?php
/**
 * Script para verificar qué rutas están registradas
 * 
 * IMPORTANTE: Eliminá este archivo después de usarlo por seguridad
 * 
 * Accedé a: https://agoradental.com.ar/crm/check-routes.php
 */

// Habilitar mostrar errores
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Rutas Registradas en Laravel</h2>";
echo "<hr>";

try {
    // Cargar Laravel
    require __DIR__ . '/vendor/autoload.php';
    echo "✅ Autoloader cargado<br>";
    
    $app = require_once __DIR__ . '/bootstrap/app.php';
    echo "✅ Aplicación bootstrapeada<br>";
    
    $router = $app->make('router');
    echo "✅ Router obtenido<br>";
    
    echo "<hr>";
    echo "<h3>Rutas relacionadas con 'admin/login':</h3>";
    
    $routes = $router->getRoutes();
    $adminLoginRoutes = [];
    
    foreach ($routes as $route) {
        $uri = $route->uri();
        if (strpos($uri, 'admin') !== false || strpos($uri, 'login') !== false) {
            $methods = $route->methods();
            $adminLoginRoutes[] = [
                'uri' => $uri,
                'methods' => $methods,
                'name' => $route->getName(),
            ];
        }
    }
    
    if (empty($adminLoginRoutes)) {
        echo "<p style='color: red;'>❌ No se encontraron rutas relacionadas con 'admin' o 'login'</p>";
    } else {
        echo "<table border='1' cellpadding='10' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr style='background: #333; color: white;'>";
        echo "<th>URI</th><th>Métodos</th><th>Nombre</th>";
        echo "</tr>";
        
        foreach ($adminLoginRoutes as $route) {
            $methods = implode(', ', $route['methods']);
            $hasPost = in_array('POST', $route['methods']);
            $rowColor = $hasPost ? '#d4edda' : '#f8d7da';
            
            echo "<tr style='background: $rowColor;'>";
            echo "<td><strong>" . htmlspecialchars($route['uri']) . "</strong></td>";
            echo "<td>" . htmlspecialchars($methods) . "</td>";
            echo "<td>" . htmlspecialchars($route['name'] ?? 'N/A') . "</td>";
            echo "</tr>";
        }
        
        echo "</table>";
    }
    
    echo "<hr>";
    echo "<h3>Todas las rutas (primeras 50):</h3>";
    
    $allRoutes = [];
    foreach ($routes as $route) {
        $allRoutes[] = [
            'uri' => $route->uri(),
            'methods' => $route->methods(),
            'name' => $route->getName(),
        ];
    }
    
    echo "<table border='1' cellpadding='10' style='border-collapse: collapse; width: 100%; font-size: 12px;'>";
    echo "<tr style='background: #333; color: white;'>";
    echo "<th>URI</th><th>Métodos</th><th>Nombre</th>";
    echo "</tr>";
    
    $count = 0;
    foreach (array_slice($allRoutes, 0, 50) as $route) {
        $count++;
        echo "<tr>";
        echo "<td>" . htmlspecialchars($route['uri']) . "</td>";
        echo "<td>" . htmlspecialchars(implode(', ', $route['methods'])) . "</td>";
        echo "<td>" . htmlspecialchars($route['name'] ?? 'N/A') . "</td>";
        echo "</tr>";
    }
    
    echo "</table>";
    echo "<p><em>Mostrando $count de " . count($allRoutes) . " rutas totales</em></p>";
    
    echo "<hr>";
    echo "<h3>Información del Request Actual:</h3>";
    echo "<pre style='background: #f5f5f5; padding: 15px;'>";
    echo "REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'N/A') . "\n";
    echo "PATH_INFO: " . ($_SERVER['PATH_INFO'] ?? 'N/A') . "\n";
    echo "SCRIPT_NAME: " . ($_SERVER['SCRIPT_NAME'] ?? 'N/A') . "\n";
    echo "REQUEST_METHOD: " . ($_SERVER['REQUEST_METHOD'] ?? 'N/A') . "\n";
    echo "</pre>";
    
} catch (\Throwable $e) {
    echo "<div style='background: #fee; padding: 15px; border: 2px solid #f00; border-radius: 5px;'>";
    echo "<h3 style='color: #c00;'>❌ Error</h3>";
    echo "<p><strong>Tipo:</strong> " . get_class($e) . "</p>";
    echo "<p><strong>Mensaje:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p><strong>Archivo:</strong> " . htmlspecialchars($e->getFile()) . "</p>";
    echo "<p><strong>Línea:</strong> " . $e->getLine() . "</p>";
    
    echo "<h4>Stack Trace:</h4>";
    echo "<pre style='background: #fdd; padding: 10px; overflow: auto; max-height: 400px;'>";
    echo htmlspecialchars($e->getTraceAsString());
    echo "</pre>";
    echo "</div>";
}

