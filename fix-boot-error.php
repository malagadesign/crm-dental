<?php
/**
 * Script para verificar y corregir el error de boot automáticamente
 * 
 * IMPORTANTE: Eliminá este archivo después de usarlo por seguridad
 * 
 * Accedé a: https://agoradental.com.ar/crm/fix-boot-error.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Fix: Corrección Automática del Error de Boot</h2>";
echo "<hr>";

try {
    require __DIR__ . '/vendor/autoload.php';
    echo "✅ Autoloader cargado<br>";
    
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
    
    echo "<h3>1. Verificando AppServiceProvider:</h3>";
    
    $appServiceProviderPath = __DIR__ . '/app/Providers/AppServiceProvider.php';
    $appServiceProviderContent = file_get_contents($appServiceProviderPath);
    
    // Verificar si el servicio 'files' está registrado
    if (strpos($appServiceProviderContent, "->singleton('files'") !== false || 
        strpos($appServiceProviderContent, '->singleton("files"') !== false) {
        echo "<p style='color: green;'>✅ El servicio 'files' ya está registrado en AppServiceProvider</p>";
    } else {
        echo "<p style='color: red;'>❌ El servicio 'files' NO está registrado. Corrigiendo...</p>";
        
        // Leer el archivo
        $lines = file($appServiceProviderPath);
        $newLines = [];
        $foundRegister = false;
        $foundUseFilesystem = false;
        
        foreach ($lines as $line) {
            // Agregar use statement si no existe
            if (strpos($line, 'use Illuminate\Filesystem\Filesystem;') !== false) {
                $foundUseFilesystem = true;
            }
            if (!$foundUseFilesystem && strpos($line, 'use Illuminate\Support\Facades\URL;') !== false) {
                $newLines[] = $line;
                $newLines[] = "use Illuminate\Filesystem\Filesystem;\n";
                $foundUseFilesystem = true;
                continue;
            }
            
            // Modificar el método register
            if (strpos($line, 'public function register(): void') !== false) {
                $foundRegister = true;
                $newLines[] = $line;
                continue;
            }
            
            if ($foundRegister && strpos($line, '{') !== false) {
                $newLines[] = $line;
                $newLines[] = "        // Registrar el servicio 'files' que Laravel necesita\n";
                $newLines[] = "        // Esto es necesario porque Laravel intenta acceder a él durante el boot\n";
                $newLines[] = "        // antes de que el FilesystemServiceProvider se registre\n";
                $newLines[] = "        \$this->app->singleton('files', function () {\n";
                $newLines[] = "            return new Filesystem();\n";
                $newLines[] = "        });\n";
                $foundRegister = false;
                continue;
            }
            
            $newLines[] = $line;
        }
        
        // Escribir el archivo corregido
        file_put_contents($appServiceProviderPath, implode('', $newLines));
        echo "<p style='color: green;'>✅ AppServiceProvider corregido</p>";
    }
    
    echo "<hr>";
    echo "<h3>2. Limpiando cache:</h3>";
    
    $app = require_once __DIR__ . '/bootstrap/app.php';
    echo "✅ Aplicación creada<br>";
    
    // Registrar 'files' manualmente antes del boot para evitar el error
    if (!$app->bound('files')) {
        $app->singleton('files', function () {
            return new \Illuminate\Filesystem\Filesystem();
        });
        echo "✅ Servicio 'files' registrado manualmente<br>";
    }
    
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    
    try {
        $kernel->call('route:clear');
        echo "✅ Cache de rutas limpiado<br>";
    } catch (\Exception $e) {
        echo "⚠️ Error al limpiar cache de rutas: " . htmlspecialchars($e->getMessage()) . "<br>";
    }
    
    try {
        $kernel->call('config:clear');
        echo "✅ Cache de configuración limpiado<br>";
    } catch (\Exception $e) {
        echo "⚠️ Error al limpiar cache de configuración: " . htmlspecialchars($e->getMessage()) . "<br>";
    }
    
    try {
        $kernel->call('cache:clear');
        echo "✅ Cache general limpiado<br>";
    } catch (\Exception $e) {
        echo "⚠️ Error al limpiar cache general: " . htmlspecialchars($e->getMessage()) . "<br>";
    }
    
    try {
        $kernel->call('view:clear');
        echo "✅ Cache de vistas limpiado<br>";
    } catch (\Exception $e) {
        echo "⚠️ Error al limpiar cache de vistas: " . htmlspecialchars($e->getMessage()) . "<br>";
    }
    
    echo "<hr>";
    echo "<h3>3. Verificando que el boot funcione:</h3>";
    
    try {
        $app->boot();
        echo "<p style='color: green;'>✅ Boot completado sin errores</p>";
    } catch (\Throwable $e) {
        echo "<p style='color: red;'>❌ Error durante boot:</p>";
        echo "<pre style='background: #fee; padding: 10px;'>";
        echo htmlspecialchars($e->getMessage()) . "\n";
        echo htmlspecialchars($e->getFile()) . ":" . $e->getLine();
        echo "</pre>";
    }
    
    echo "<hr>";
    echo "<h3>4. Verificando rutas registradas:</h3>";
    
    $router = $app->make('router');
    $routes = $router->getRoutes();
    $totalRoutes = count($routes);
    
    echo "<p><strong>Total de rutas:</strong> $totalRoutes</p>";
    
    if ($totalRoutes > 0) {
        echo "<p style='color: green;'>✅ ¡Rutas registradas correctamente!</p>";
        
        $adminRoutes = [];
        foreach ($routes as $route) {
            $uri = $route->uri();
            if (strpos($uri, 'admin') !== false || strpos($uri, 'login') !== false) {
                $adminRoutes[] = [
                    'uri' => $uri,
                    'methods' => $route->methods(),
                ];
            }
        }
        
        if (!empty($adminRoutes)) {
            echo "<table border='1' cellpadding='10' style='border-collapse: collapse; width: 100%; margin-top: 10px;'>";
            echo "<tr style='background: #333; color: white;'><th>URI</th><th>Métodos</th></tr>";
            foreach ($adminRoutes as $route) {
                $methods = implode(', ', $route['methods']);
                $hasPost = in_array('POST', $route['methods']);
                $rowColor = $hasPost ? '#d4edda' : '#f8d7da';
                
                echo "<tr style='background: $rowColor;'>";
                echo "<td><strong>" . htmlspecialchars($route['uri']) . "</strong></td>";
                echo "<td>" . htmlspecialchars($methods) . "</td>";
                echo "</tr>";
            }
            echo "</table>";
            
            $hasLoginPost = false;
            foreach ($adminRoutes as $route) {
                if (strpos($route['uri'], 'login') !== false && in_array('POST', $route['methods'])) {
                    $hasLoginPost = true;
                    break;
                }
            }
            
            if ($hasLoginPost) {
                echo "<p style='color: green; font-size: 18px; margin-top: 20px;'>✅ ¡El login POST está registrado! Podés intentar hacer login ahora.</p>";
            } else {
                echo "<p style='color: orange;'>⚠️ El login no tiene método POST registrado</p>";
            }
        }
    } else {
        echo "<p style='color: red;'>❌ Todavía no hay rutas registradas. El problema persiste.</p>";
    }
    
    echo "<hr>";
    echo "<h3>✅ Resumen:</h3>";
    echo "<ul>";
    echo "<li>AppServiceProvider verificado/corregido</li>";
    echo "<li>Cache limpiado</li>";
    echo "<li>Boot ejecutado</li>";
    echo "<li>Rutas verificadas: $totalRoutes rutas encontradas</li>";
    echo "</ul>";
    
    if ($totalRoutes > 0) {
        echo "<p style='color: green; font-size: 16px; font-weight: bold; margin-top: 20px;'>✅ ¡La aplicación debería estar funcionando ahora! Intentá hacer login.</p>";
    } else {
        echo "<p style='color: red; font-size: 16px; font-weight: bold; margin-top: 20px;'>❌ Aún hay problemas. Revisá los logs o contactá al desarrollador.</p>";
    }
    
} catch (\Throwable $e) {
    echo "<div style='background: #fee; padding: 15px; border: 2px solid #f00;'>";
    echo "<h3 style='color: #c00;'>❌ Error Fatal</h3>";
    echo "<p><strong>Tipo:</strong> " . get_class($e) . "</p>";
    echo "<p><strong>Mensaje:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p><strong>Archivo:</strong> " . htmlspecialchars($e->getFile()) . "</p>";
    echo "<p><strong>Línea:</strong> " . $e->getLine() . "</p>";
    echo "</div>";
}

