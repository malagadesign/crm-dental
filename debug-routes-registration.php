<?php
/**
 * Script para verificar por qué no se registran las rutas
 * 
 * IMPORTANTE: Eliminá este archivo después de usarlo por seguridad
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Debug: Registro de Rutas</h2>";
echo "<hr>";

try {
    require __DIR__ . '/vendor/autoload.php';
    echo "✅ Autoloader cargado<br>";
    
    // Aplicar ajustes de subdirectorio como en index.php
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
    
    echo "<h3>1. Verificando Providers:</h3>";
    $providersFile = __DIR__ . '/bootstrap/providers.php';
    if (file_exists($providersFile)) {
        $providers = require $providersFile;
        echo "<p>✅ Archivo providers.php existe</p>";
        echo "<pre style='background: #f5f5f5; padding: 15px;'>";
        print_r($providers);
        echo "</pre>";
        
        foreach ($providers as $provider) {
            if (class_exists($provider)) {
                echo "<p>✅ Clase $provider existe</p>";
            } else {
                echo "<p style='color: red;'>❌ Clase $provider NO existe</p>";
            }
        }
    } else {
        echo "<p style='color: red;'>❌ Archivo providers.php NO existe</p>";
    }
    
    echo "<hr>";
    echo "<h3>2. Bootstrap de Laravel:</h3>";
    
    $app = require_once __DIR__ . '/bootstrap/app.php';
    echo "✅ Aplicación creada<br>";
    
    echo "<h3>3. Verificando si Filament está registrado:</h3>";
    
    // Verificar si Filament está en los service providers
    $registeredProviders = $app->getLoadedProviders();
    $filamentProviders = array_filter($registeredProviders, function($key) {
        return strpos($key, 'Filament') !== false;
    }, ARRAY_FILTER_USE_KEY);
    
    if (empty($filamentProviders)) {
        echo "<p style='color: orange;'>⚠️ No se encontraron providers de Filament cargados</p>";
    } else {
        echo "<p>✅ Providers de Filament encontrados:</p>";
        echo "<pre style='background: #f5f5f5; padding: 15px;'>";
        print_r(array_keys($filamentProviders));
        echo "</pre>";
    }
    
    echo "<hr>";
    echo "<h3>4. Verificando rutas ANTES de boot:</h3>";
    
    $router = $app->make('router');
    $routesBeforeBoot = count($router->getRoutes());
    echo "<p>Rutas antes de boot: <strong>$routesBeforeBoot</strong></p>";
    
    echo "<hr>";
    echo "<h3>5. Ejecutando boot de providers:</h3>";
    
    try {
        $app->boot();
        echo "✅ Boot completado<br>";
    } catch (\Throwable $e) {
        echo "<p style='color: red;'>❌ Error durante boot:</p>";
        echo "<pre style='background: #fee; padding: 15px;'>";
        echo htmlspecialchars($e->getMessage()) . "\n";
        echo htmlspecialchars($e->getFile()) . ":" . $e->getLine() . "\n";
        echo "</pre>";
    }
    
    echo "<hr>";
    echo "<h3>6. Verificando rutas DESPUÉS de boot:</h3>";
    
    $routesAfterBoot = count($router->getRoutes());
    echo "<p>Rutas después de boot: <strong>$routesAfterBoot</strong></p>";
    
    if ($routesAfterBoot > 0) {
        echo "<p style='color: green;'>✅ ¡Rutas registradas correctamente!</p>";
        
        $adminRoutes = [];
        foreach ($router->getRoutes() as $route) {
            $uri = $route->uri();
            if (strpos($uri, 'admin') !== false || strpos($uri, 'login') !== false) {
                $adminRoutes[] = [
                    'uri' => $uri,
                    'methods' => $route->methods(),
                ];
            }
        }
        
        if (!empty($adminRoutes)) {
            echo "<table border='1' cellpadding='10' style='border-collapse: collapse; width: 100%;'>";
            echo "<tr style='background: #333; color: white;'><th>URI</th><th>Métodos</th></tr>";
            foreach ($adminRoutes as $route) {
                echo "<tr>";
                echo "<td>" . htmlspecialchars($route['uri']) . "</td>";
                echo "<td>" . htmlspecialchars(implode(', ', $route['methods'])) . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        }
    } else {
        echo "<p style='color: red;'>❌ Todavía no hay rutas registradas</p>";
        echo "<p>Esto indica que hay un problema durante el boot que impide el registro de rutas.</p>";
    }
    
} catch (\Throwable $e) {
    echo "<div style='background: #fee; padding: 15px; border: 2px solid #f00;'>";
    echo "<h3 style='color: #c00;'>❌ Error Fatal</h3>";
    echo "<p><strong>Tipo:</strong> " . get_class($e) . "</p>";
    echo "<p><strong>Mensaje:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p><strong>Archivo:</strong> " . htmlspecialchars($e->getFile()) . "</p>";
    echo "<p><strong>Línea:</strong> " . $e->getLine() . "</p>";
    echo "<pre style='background: #fdd; padding: 10px; overflow: auto; max-height: 400px;'>";
    echo htmlspecialchars($e->getTraceAsString());
    echo "</pre>";
    echo "</div>";
}

