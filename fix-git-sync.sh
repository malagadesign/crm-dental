#!/bin/bash

# Script para resolver conflictos de sincronización Git en el servidor
# Este script elimina archivos locales que están bloqueando el pull de Git

echo "🔧 Resolviendo conflictos de sincronización Git..."
echo ""

# Archivos que están causando conflicto
CONFLICT_FILES=(
    ".htaccess"
    "index.php"
    "test-db.php"
    "test-laravel-config.php"
)

# Verificar si estamos en un repositorio Git
if [ ! -d ".git" ]; then
    echo "❌ Error: No se encontró un repositorio Git en este directorio"
    exit 1
fi

echo "📋 Archivos que están bloqueando el pull:"
for file in "${CONFLICT_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  - $file (existe localmente)"
    fi
done

echo ""
echo "🗑️  Eliminando archivos locales para permitir el pull..."
for file in "${CONFLICT_FILES[@]}"; do
    if [ -f "$file" ]; then
        rm -f "$file"
        echo "  ✅ Eliminado: $file"
    fi
done

echo ""
echo "🔄 Intentando hacer git pull..."
git pull origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ¡Sincronización exitosa!"
    echo ""
    echo "📝 Archivos restaurados desde el repositorio:"
    for file in "${CONFLICT_FILES[@]}"; do
        if [ -f "$file" ]; then
            echo "  ✅ $file"
        fi
    done
else
    echo ""
    echo "❌ Error al hacer git pull. Revisa los mensajes de error arriba."
    exit 1
fi
