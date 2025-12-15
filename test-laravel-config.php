<?php
/**
 * Script de prueba de configuración de Laravel
 * 
 * Este archivo verifica que Laravel esté leyendo correctamente
 * el archivo .env y pueda conectarse a la base de datos.
 * 
 * IMPORTANTE: Eliminar este archivo después de verificar.
 */

// Habilitar mostrar errores para debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

require __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel de manera simple
$app = require_once __DIR__ . '/bootstrap/app.php';

// Bootstrapear solo el Console Kernel (más simple y seguro)
try {
    $consoleKernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $consoleKernel->bootstrap();
} catch (\Exception $e) {
    // Si falla el bootstrap, intentar de otra manera
    $app->make('config');
}

echo "<h2>Prueba de Configuración de Laravel</h2>";
echo "<hr>";

try {
    // Obtener configuración de base de datos
    $config = $app->make('config');
    
    echo "<h3>1. Configuración de Base de Datos desde Laravel:</h3>";
    echo "<ul>";
    echo "<li><strong>DB_CONNECTION:</strong> " . $config->get('database.default') . "</li>";
    echo "<li><strong>DB_HOST:</strong> " . $config->get('database.connections.mysql.host') . "</li>";
    echo "<li><strong>DB_PORT:</strong> " . $config->get('database.connections.mysql.port') . "</li>";
    echo "<li><strong>DB_DATABASE:</strong> " . $config->get('database.connections.mysql.database') . "</li>";
    echo "<li><strong>DB_USERNAME:</strong> " . $config->get('database.connections.mysql.username') . "</li>";
    echo "<li><strong>DB_PASSWORD:</strong> " . (empty($config->get('database.connections.mysql.password')) ? '<em>vacío</em>' : '***configurado***') . "</li>";
    echo "</ul>";
    
    echo "<hr>";
    echo "<h3>2. Prueba de Conexión desde Laravel:</h3>";
    
    // Intentar conectar usando la configuración de Laravel
    $db = $app->make('db');
    $connection = $db->connection();
    
    // Hacer una consulta simple
    $result = $connection->select('SELECT DATABASE() as db, VERSION() as version');
    
    if (!empty($result)) {
        echo "<div style='background: #efe; padding: 15px; border: 2px solid #0a0; border-radius: 5px;'>";
        echo "<p style='color: #0a0;'><strong>✅ Conexión desde Laravel exitosa</strong></p>";
        echo "<ul>";
        echo "<li><strong>Base de datos:</strong> " . $result[0]->db . "</li>";
        echo "<li><strong>Versión MySQL:</strong> " . $result[0]->version . "</li>";
        echo "</ul>";
        echo "</div>";
    }
    
    echo "<hr>";
    echo "<h3>3. Verificar Tabla de Sesiones:</h3>";
    
    // Verificar si existe la tabla sessions
    $tables = $connection->select("SHOW TABLES LIKE 'sessions'");
    
    if (empty($tables)) {
        echo "<div style='background: #ffe; padding: 15px; border: 2px solid #fa0; border-radius: 5px;'>";
        echo "<p style='color: #c60;'><strong>⚠️ La tabla 'sessions' NO existe</strong></p>";
        echo "<p>Necesitás ejecutar las migraciones:</p>";
        echo "<pre>php artisan migrate --force</pre>";
        echo "<p>O cambiar el driver de sesiones a 'file' en el .env:</p>";
        echo "<pre>SESSION_DRIVER=file</pre>";
        echo "</div>";
    } else {
        echo "<div style='background: #efe; padding: 15px; border: 2px solid #0a0; border-radius: 5px;'>";
        echo "<p style='color: #0a0;'><strong>✅ La tabla 'sessions' existe</strong></p>";
        
        // Contar registros
        $count = $connection->select("SELECT COUNT(*) as total FROM sessions");
        echo "<p>Registros en la tabla: " . $count[0]->total . "</p>";
        echo "</div>";
    }
    
    echo "<hr>";
    echo "<h3>4. Configuración de Sesiones:</h3>";
    echo "<ul>";
    echo "<li><strong>SESSION_DRIVER:</strong> " . $config->get('session.driver') . "</li>";
    echo "<li><strong>SESSION_TABLE:</strong> " . $config->get('session.table') . "</li>";
    echo "<li><strong>SESSION_LIFETIME:</strong> " . $config->get('session.lifetime') . " minutos</li>";
    echo "</ul>";
    
    echo "<hr>";
    echo "<h3>5. Otras Configuraciones:</h3>";
    echo "<ul>";
    echo "<li><strong>APP_ENV:</strong> " . $config->get('app.env') . "</li>";
    echo "<li><strong>APP_DEBUG:</strong> " . ($config->get('app.debug') ? 'true' : 'false') . "</li>";
    echo "<li><strong>APP_URL:</strong> " . $config->get('app.url') . "</li>";
    echo "</ul>";
    
} catch (\Exception $e) {
    echo "<div style='background: #fee; padding: 15px; border: 2px solid #f00; border-radius: 5px;'>";
    echo "<h3 style='color: #c00;'>❌ Error</h3>";
    echo "<p><strong>Mensaje:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p><strong>Archivo:</strong> " . htmlspecialchars($e->getFile()) . "</p>";
    echo "<p><strong>Línea:</strong> " . $e->getLine() . "</p>";
    if ($e->getPrevious()) {
        echo "<p><strong>Error anterior:</strong> " . htmlspecialchars($e->getPrevious()->getMessage()) . "</p>";
    }
    echo "<pre style='background: #fdd; padding: 10px; overflow: auto;'>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
    echo "</div>";
} catch (\Error $e) {
    echo "<div style='background: #fee; padding: 15px; border: 2px solid #f00; border-radius: 5px;'>";
    echo "<h3 style='color: #c00;'>❌ Error Fatal</h3>";
    echo "<p><strong>Mensaje:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p><strong>Archivo:</strong> " . htmlspecialchars($e->getFile()) . "</p>";
    echo "<p><strong>Línea:</strong> " . $e->getLine() . "</p>";
    echo "</div>";
}

echo "<hr>";
echo "<p style='color: #666; font-size: 12px;'>Este archivo es solo para pruebas. Eliminalo después de verificar.</p>";
?>
