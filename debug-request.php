<?php
/**
 * Script de debug avanzado para ver qué está recibiendo Laravel
 * 
 * IMPORTANTE: Eliminá este archivo después de usarlo por seguridad
 * 
 * Accedé a: https://agoradental.com.ar/crm/debug-request.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Debug de Request - Información Completa</h2>";
echo "<hr>";

echo "<h3>1. Variables $_SERVER antes de cualquier ajuste:</h3>";
echo "<pre style='background: #f5f5f5; padding: 15px; overflow: auto;'>";
$serverVars = [
    'REQUEST_URI' => $_SERVER['REQUEST_URI'] ?? 'N/A',
    'PATH_INFO' => $_SERVER['PATH_INFO'] ?? 'N/A',
    'SCRIPT_NAME' => $_SERVER['SCRIPT_NAME'] ?? 'N/A',
    'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD'] ?? 'N/A',
    'QUERY_STRING' => $_SERVER['QUERY_STRING'] ?? 'N/A',
];
print_r($serverVars);
echo "</pre>";

echo "<hr>";
echo "<h3>2. Simulando el ajuste que hace index.php:</h3>";

$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$requestPath = parse_url($requestUri, PHP_URL_PATH);
$subdirectory = '';

if (preg_match('#^/([^/]+)/#', $requestPath, $matches)) {
    $subdirectory = '/' . $matches[1];
    echo "<p>✅ Subdirectorio detectado: <strong>$subdirectory</strong></p>";
    
    // Simular ajuste de REQUEST_URI
    if (strpos($requestPath, $subdirectory) === 0) {
        $pathWithoutSubdir = substr($requestPath, strlen($subdirectory));
        if ($pathWithoutSubdir === '') {
            $pathWithoutSubdir = '/';
        }
        $adjustedUri = $pathWithoutSubdir . 
            (isset($_SERVER['QUERY_STRING']) && $_SERVER['QUERY_STRING'] ? '?' . $_SERVER['QUERY_STRING'] : '');
        
        echo "<p>URI original: <code>$requestPath</code></p>";
        echo "<p>URI ajustada: <code>$adjustedUri</code></p>";
    }
} else {
    echo "<p>⚠️ No se detectó subdirectorio</p>";
}

echo "<hr>";
echo "<h3>3. Cargando Laravel y verificando Request::capture():</h3>";

try {
    require __DIR__ . '/vendor/autoload.php';
    echo "✅ Autoloader cargado<br>";
    
    // Aplicar los mismos ajustes que index.php
    if ($subdirectory) {
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
    echo "✅ Aplicación bootstrapeada<br>";
    
    $request = \Illuminate\Http\Request::capture();
    echo "✅ Request capturado<br>";
    
    echo "<hr>";
    echo "<h3>4. Información del Request capturado:</h3>";
    echo "<pre style='background: #f5f5f5; padding: 15px; overflow: auto;'>";
    echo "getRequestUri(): " . $request->getRequestUri() . "\n";
    echo "getPathInfo(): " . $request->getPathInfo() . "\n";
    echo "getMethod(): " . $request->getMethod() . "\n";
    echo "getBaseUrl(): " . $request->getBaseUrl() . "\n";
    echo "getBasePath(): " . $request->getBasePath() . "\n";
    echo "url(): " . $request->url() . "\n";
    echo "fullUrl(): " . $request->fullUrl() . "\n";
    echo "</pre>";
    
    echo "<hr>";
    echo "<h3>5. Verificando rutas registradas:</h3>";
    
    $router = $app->make('router');
    $routes = $router->getRoutes();
    
    echo "<p><strong>Total de rutas:</strong> " . count($routes) . "</p>";
    
    $adminRoutes = [];
    foreach ($routes as $route) {
        $uri = $route->uri();
        if (strpos($uri, 'admin') !== false || strpos($uri, 'login') !== false) {
            $adminRoutes[] = [
                'uri' => $uri,
                'methods' => $route->methods(),
                'name' => $route->getName(),
            ];
        }
    }
    
    if (empty($adminRoutes)) {
        echo "<p style='color: red;'>❌ No se encontraron rutas de admin/login</p>";
    } else {
        echo "<table border='1' cellpadding='10' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr style='background: #333; color: white;'>";
        echo "<th>URI</th><th>Métodos</th><th>Nombre</th>";
        echo "</tr>";
        
        foreach ($adminRoutes as $route) {
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
    echo "<h3>6. Probando match de ruta:</h3>";
    
    $matchedRoute = $router->getRoutes()->match($request);
    echo "<p><strong>Ruta encontrada:</strong> " . ($matchedRoute ? $matchedRoute->uri() : 'NINGUNA') . "</p>";
    if ($matchedRoute) {
        echo "<p><strong>Métodos permitidos:</strong> " . implode(', ', $matchedRoute->methods()) . "</p>";
        echo "<p><strong>Método del request:</strong> " . $request->getMethod() . "</p>";
        $methodAllowed = in_array($request->getMethod(), $matchedRoute->methods());
        echo "<p><strong>¿Método permitido?</strong> " . ($methodAllowed ? '✅ SÍ' : '❌ NO') . "</p>";
    }
    
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

