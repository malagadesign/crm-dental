<?php
/**
 * Script temporal para limpiar el cache de Laravel
 * 
 * IMPORTANTE: Eliminá este archivo después de usarlo por seguridad
 * 
 * Accedé a: https://agoradental.com.ar/crm/clear-cache.php
 */

// Habilitar mostrar errores para debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Limpiando Cache de Laravel</h2>";
echo "<hr>";

try {
    // Cargar Laravel
    require __DIR__ . '/vendor/autoload.php';
    echo "✅ Autoloader cargado<br>";
    
    $app = require_once __DIR__ . '/bootstrap/app.php';
    echo "✅ Aplicación bootstrapeada<br>";
    
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    echo "✅ Kernel obtenido<br>";
    
    echo "<hr>";
    echo "<h3>Ejecutando comandos de limpieza...</h3>";
    
    // Limpiar cache de rutas
    try {
        $kernel->call('route:clear');
        echo "✅ Cache de rutas limpiado<br>";
    } catch (\Exception $e) {
        echo "⚠️ Error al limpiar cache de rutas: " . htmlspecialchars($e->getMessage()) . "<br>";
    }
    
    // Limpiar cache de configuración
    try {
        $kernel->call('config:clear');
        echo "✅ Cache de configuración limpiado<br>";
    } catch (\Exception $e) {
        echo "⚠️ Error al limpiar cache de configuración: " . htmlspecialchars($e->getMessage()) . "<br>";
    }
    
    // Limpiar cache general
    try {
        $kernel->call('cache:clear');
        echo "✅ Cache general limpiado<br>";
    } catch (\Exception $e) {
        echo "⚠️ Error al limpiar cache general: " . htmlspecialchars($e->getMessage()) . "<br>";
    }
    
    // Limpiar cache de vistas
    try {
        $kernel->call('view:clear');
        echo "✅ Cache de vistas limpiado<br>";
    } catch (\Exception $e) {
        echo "⚠️ Error al limpiar cache de vistas: " . htmlspecialchars($e->getMessage()) . "<br>";
    }
    
    // Limpiar cache optimizado (si existe)
    try {
        $kernel->call('optimize:clear');
        echo "✅ Cache optimizado limpiado<br>";
    } catch (\Exception $e) {
        // Este comando puede no existir en todas las versiones, no es crítico
        echo "ℹ️ Optimize:clear no disponible (no es crítico)<br>";
    }
    
    echo "<hr>";
    echo "<h3 style='color: green;'>✅ ¡Cache limpiado exitosamente!</h3>";
    echo "<p><strong>IMPORTANTE:</strong> Eliminá este archivo (clear-cache.php) por seguridad después de usarlo.</p>";
    echo "<p>Ahora podés intentar hacer login nuevamente.</p>";
    
} catch (\Throwable $e) {
    echo "<div style='background: #fee; padding: 15px; border: 2px solid #f00; border-radius: 5px;'>";
    echo "<h3 style='color: #c00;'>❌ Error al limpiar cache</h3>";
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

