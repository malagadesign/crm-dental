<?php
/**
 * Script para verificar que las URLs se generen correctamente con el subdirectorio
 * Acceder desde: https://agoradental.com.ar/crm/check-urls.php
 * 
 * IMPORTANTE: Eliminar este archivo después de usarlo por seguridad
 */

// Detectar subdirectorio
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$requestPath = parse_url($requestUri, PHP_URL_PATH);
$subdirectory = '';

if (preg_match('#^/([^/]+)/#', $requestPath, $matches)) {
    $subdirectory = '/' . $matches[1];
} elseif (preg_match('#^/([^/]+)$#', $requestPath, $matches)) {
    $subdirectory = '/' . $matches[1];
}

// Configurar ASSET_URL
if ($subdirectory) {
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

// Obtener información
$config = $app->make('config');
$assetUrl = $config->get('app.asset_url');
$appUrl = $config->get('app.url');
$envAssetUrl = env('ASSET_URL');
$envAppUrl = env('APP_URL');

// Probar generación de URLs
try {
    $testUrl1 = url('admin/login');
    $testUrl2 = url('/admin/login');
    $testUrl3 = route('home');
} catch (Exception $e) {
    $testUrl1 = 'Error: ' . $e->getMessage();
    $testUrl2 = 'Error: ' . $e->getMessage();
    $testUrl3 = 'Error: ' . $e->getMessage();
}

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verificación de URLs - CRM Dental</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 900px;
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
        .section {
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 4px;
            border-left: 4px solid #007bff;
        }
        .section h2 {
            margin-top: 0;
            color: #007bff;
            font-size: 18px;
        }
        .info-item {
            margin: 10px 0;
            padding: 8px;
            background: white;
            border-radius: 4px;
        }
        .info-item strong {
            display: inline-block;
            width: 200px;
            color: #555;
        }
        .success {
            color: #28a745;
        }
        .error {
            color: #dc3545;
        }
        .warning {
            color: #ffc107;
        }
        .url-test {
            margin: 10px 0;
            padding: 10px;
            background: #1e1e1e;
            color: #d4d4d4;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            word-break: break-all;
        }
        .warning-box {
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
        <h1>🔍 Verificación de URLs y Configuración</h1>
        
        <div class="warning-box">
            <strong>⚠️ IMPORTANTE:</strong> Elimina este archivo después de usarlo por seguridad.
        </div>
        
        <div class="section">
            <h2>📋 Detección de Subdirectorio</h2>
            <div class="info-item">
                <strong>Subdirectorio detectado:</strong>
                <span class="<?php echo $subdirectory ? 'success' : 'error'; ?>">
                    <?php echo $subdirectory ?: 'No detectado'; ?>
                </span>
            </div>
            <div class="info-item">
                <strong>REQUEST_URI original:</strong>
                <span><?php echo htmlspecialchars($_SERVER['REQUEST_URI'] ?? 'N/A'); ?></span>
            </div>
        </div>
        
        <div class="section">
            <h2>⚙️ Configuración de Laravel</h2>
            <div class="info-item">
                <strong>APP_URL (config):</strong>
                <span class="<?php echo $appUrl ? 'success' : 'error'; ?>">
                    <?php echo htmlspecialchars($appUrl ?: 'No configurado'); ?>
                </span>
            </div>
            <div class="info-item">
                <strong>APP_URL (env):</strong>
                <span><?php echo htmlspecialchars($envAppUrl ?: 'No configurado en .env'); ?></span>
            </div>
            <div class="info-item">
                <strong>ASSET_URL (config):</strong>
                <span class="<?php echo $assetUrl ? 'success' : 'error'; ?>">
                    <?php echo htmlspecialchars($assetUrl ?: 'No configurado'); ?>
                </span>
            </div>
            <div class="info-item">
                <strong>ASSET_URL (env):</strong>
                <span><?php echo htmlspecialchars($envAssetUrl ?: 'No configurado en .env'); ?></span>
            </div>
        </div>
        
        <div class="section">
            <h2>🔗 Pruebas de Generación de URLs</h2>
            <div class="info-item">
                <strong>url('admin/login'):</strong>
                <div class="url-test"><?php echo htmlspecialchars($testUrl1); ?></div>
            </div>
            <div class="info-item">
                <strong>url('/admin/login'):</strong>
                <div class="url-test"><?php echo htmlspecialchars($testUrl2); ?></div>
            </div>
            <div class="info-item">
                <strong>route('home'):</strong>
                <div class="url-test"><?php echo htmlspecialchars($testUrl3); ?></div>
            </div>
        </div>
        
        <div class="section">
            <h2>✅ Verificación</h2>
            <?php
            $allGood = true;
            $issues = [];
            
            if (!$subdirectory) {
                $allGood = false;
                $issues[] = "❌ No se detectó el subdirectorio";
            }
            
            if (!$appUrl || strpos($appUrl, $subdirectory) === false) {
                $allGood = false;
                $issues[] = "❌ APP_URL no incluye el subdirectorio correctamente";
            }
            
            if (!$assetUrl || $assetUrl !== $subdirectory) {
                $allGood = false;
                $issues[] = "❌ ASSET_URL no está configurado correctamente";
            }
            
            if (strpos($testUrl1, $subdirectory) === false && $subdirectory) {
                $allGood = false;
                $issues[] = "❌ url('admin/login') no incluye el subdirectorio";
            }
            
            if ($allGood) {
                echo '<div class="success" style="padding: 15px; background: #d4edda; border-radius: 4px; border-left: 4px solid #28a745;">';
                echo '<strong>✅ Todo está configurado correctamente</strong>';
                echo '</div>';
            } else {
                echo '<div class="error" style="padding: 15px; background: #f8d7da; border-radius: 4px; border-left: 4px solid #dc3545;">';
                echo '<strong>❌ Se encontraron problemas:</strong><ul>';
                foreach ($issues as $issue) {
                    echo '<li>' . $issue . '</li>';
                }
                echo '</ul></div>';
            }
            ?>
        </div>
        
        <div class="section">
            <h2>📝 Recomendaciones</h2>
            <p>Para que todo funcione correctamente, asegúrate de tener en tu archivo <code>.env</code>:</p>
            <pre style="background: #1e1e1e; color: #d4d4d4; padding: 15px; border-radius: 4px; overflow-x: auto;">
APP_URL=https://agoradental.com.ar/crm
ASSET_URL=/crm</pre>
        </div>
    </div>
</body>
</html>
