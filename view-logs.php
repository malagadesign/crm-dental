<?php
/**
 * Script para ver los logs de Laravel
 * 
 * IMPORTANTE: Eliminá este archivo después de usarlo por seguridad
 * 
 * Accedé a: https://agoradental.com.ar/crm/view-logs.php
 */

// Habilitar mostrar errores
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Logs de Laravel</h2>";
echo "<hr>";

$logFile = __DIR__ . '/storage/logs/laravel.log';

if (!file_exists($logFile)) {
    echo "<p style='color: orange;'>⚠️ El archivo de log no existe: $logFile</p>";
    echo "<p>Esto puede significar que no ha habido errores aún, o que los logs están en otro lugar.</p>";
    exit;
}

$logContent = file_get_contents($logFile);
$logSize = filesize($logFile);

echo "<p><strong>Tamaño del archivo:</strong> " . number_format($logSize / 1024, 2) . " KB</p>";

// Mostrar las últimas 100 líneas
$lines = explode("\n", $logContent);
$recentLines = array_slice($lines, -100);
$recentContent = implode("\n", $recentLines);

echo "<hr>";
echo "<h3>Últimas 100 líneas del log:</h3>";
echo "<pre style='background: #1e1e1e; color: #d4d4d4; padding: 15px; overflow: auto; max-height: 600px; font-size: 12px;'>";
echo htmlspecialchars($recentContent);
echo "</pre>";

echo "<hr>";
echo "<p><strong>Nota:</strong> Si el log es muy grande, podés descargarlo completo vía FTP desde: <code>storage/logs/laravel.log</code></p>";

