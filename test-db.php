<?php
/**
 * Script de prueba de conexión a MySQL
 * 
 * Este archivo verifica que las credenciales de la base de datos
 * estén correctamente configuradas.
 * 
 * IMPORTANTE: Eliminar este archivo después de verificar la conexión.
 */

// Credenciales del hosting
$dbhost = 'localhost';
$dbuser = 'c2670660_crm';
$dbpass = 'KInu38zimi';
$dbname = 'c2670660_crm';

echo "<h2>Prueba de Conexión a MySQL</h2>";
echo "<hr>";

// Intentar conexión
echo "<p><strong>Intentando conectar...</strong></p>";
echo "<p>Host: <code>$dbhost</code></p>";
echo "<p>Usuario: <code>$dbuser</code></p>";
echo "<p>Base de datos: <code>$dbname</code></p>";
echo "<br>";

$conn = @mysqli_connect($dbhost, $dbuser, $dbpass, $dbname);

if (!$conn) {
    echo "<div style='background: #fee; padding: 15px; border: 2px solid #f00; border-radius: 5px;'>";
    echo "<h3 style='color: #c00; margin-top: 0;'>❌ Error de Conexión</h3>";
    echo "<p><strong>Error:</strong> " . mysqli_connect_error() . "</p>";
    echo "<p><strong>Código de error:</strong> " . mysqli_connect_errno() . "</p>";
    echo "</div>";
    
    echo "<h3>Posibles causas:</h3>";
    echo "<ul>";
    echo "<li>La base de datos <code>$dbname</code> no existe</li>";
    echo "<li>El usuario <code>$dbuser</code> no tiene permisos</li>";
    echo "<li>La contraseña es incorrecta</li>";
    echo "<li>El host <code>$dbhost</code> no es correcto (probar con <code>127.0.0.1</code>)</li>";
    echo "</ul>";
    
    // Probar con 127.0.0.1
    echo "<hr>";
    echo "<p><strong>Probando con 127.0.0.1 en lugar de localhost...</strong></p>";
    $conn2 = @mysqli_connect('127.0.0.1', $dbuser, $dbpass, $dbname);
    
    if ($conn2) {
        echo "<div style='background: #efe; padding: 15px; border: 2px solid #0a0; border-radius: 5px;'>";
        echo "<p style='color: #0a0;'><strong>✅ ¡Funciona con 127.0.0.1!</strong></p>";
        echo "<p>Actualizá tu <code>.env</code> con: <code>DB_HOST=127.0.0.1</code></p>";
        echo "</div>";
        mysqli_close($conn2);
    } else {
        echo "<p style='color: #c00;'>❌ Tampoco funciona con 127.0.0.1</p>";
        echo "<p>Error: " . mysqli_connect_error() . "</p>";
    }
    
    exit;
}

// Si llegamos aquí, la conexión fue exitosa
echo "<div style='background: #efe; padding: 15px; border: 2px solid #0a0; border-radius: 5px;'>";
echo "<h3 style='color: #0a0; margin-top: 0;'>✅ Conexión Exitosa</h3>";
echo "<p>La conexión a MySQL está funcionando correctamente.</p>";
echo "</div>";

// Verificar que la base de datos existe y podemos usarla
echo "<hr>";
echo "<h3>Información de la Conexión:</h3>";
echo "<ul>";
echo "<li><strong>Versión de MySQL:</strong> " . mysqli_get_server_info($conn) . "</li>";
echo "<li><strong>Base de datos actual:</strong> " . mysqli_get_server_info($conn) . "</li>";
echo "</ul>";

// Intentar hacer una consulta simple
echo "<hr>";
echo "<h3>Prueba de Consulta:</h3>";
$result = mysqli_query($conn, "SELECT DATABASE() as db");
if ($result) {
    $row = mysqli_fetch_assoc($result);
    echo "<p>✅ Base de datos activa: <code>" . $row['db'] . "</code></p>";
} else {
    echo "<p>⚠️ No se pudo ejecutar consulta: " . mysqli_error($conn) . "</p>";
}

// Verificar si existen tablas
echo "<hr>";
echo "<h3>Tablas en la Base de Datos:</h3>";
$result = mysqli_query($conn, "SHOW TABLES");
if ($result) {
    $tables = [];
    while ($row = mysqli_fetch_array($result)) {
        $tables[] = $row[0];
    }
    
    if (empty($tables)) {
        echo "<p>⚠️ <strong>La base de datos está vacía.</strong> Necesitás ejecutar las migraciones:</p>";
        echo "<pre>php artisan migrate --force</pre>";
    } else {
        echo "<p>✅ Se encontraron " . count($tables) . " tabla(s):</p>";
        echo "<ul>";
        foreach ($tables as $table) {
            echo "<li><code>$table</code></li>";
        }
        echo "</ul>";
    }
} else {
    echo "<p>⚠️ No se pudieron listar las tablas: " . mysqli_error($conn) . "</p>";
}

mysqli_close($conn);

echo "<hr>";
echo "<p style='color: #666; font-size: 12px;'>Este archivo es solo para pruebas. Eliminalo después de verificar la conexión.</p>";
?>
