<?php
// Test file to verify .htaccess is working
if (isset($_GET['rewrite']) && $_GET['rewrite'] === 'working') {
    echo "✅ .htaccess está funcionando correctamente!";
} else {
    echo "❌ .htaccess NO está funcionando";
    echo "<br><br>Si ves este mensaje, significa que el .htaccess no está siendo leído por Apache.";
    echo "<br><br>Verifica que en MAMP:";
    echo "<ul>";
    echo "<li>AllowOverride esté configurado como 'All'</li>";
    echo "<li>Apache esté reiniciado después del cambio</li>";
    echo "<li>mod_rewrite esté habilitado</li>";
    echo "</ul>";
}

