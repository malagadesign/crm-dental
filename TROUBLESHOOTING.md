# Solución de Problemas - npm install

## 🔴 Error: ETIMEDOUT (Problema de Red)

Si ves errores como `npm error network read ETIMEDOUT`, prueba estas soluciones:

### Solución 1: Cambiar Registry de npm

```bash
# Usar registry oficial
npm config set registry https://registry.npmjs.org/

# O usar registry de China (si estás en China o tienes problemas de conexión)
npm config set registry https://registry.npmmirror.com/
```

### Solución 2: Aumentar Timeout

```bash
npm config set fetch-timeout 600000
npm config set fetch-retries 5
npm config set fetch-retry-mintimeout 10000
```

### Solución 3: Limpiar Cache de npm

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Solución 4: Usar Yarn (Alternativa)

Yarn suele ser más robusto con problemas de red:

```bash
# Instalar Yarn globalmente
npm install -g yarn

# Instalar dependencias con Yarn
yarn install
```

### Solución 5: Usar pnpm (Alternativa)

pnpm es más rápido y eficiente:

```bash
# Instalar pnpm
npm install -g pnpm

# Instalar dependencias
pnpm install
```

### Solución 6: Instalar con Proxy (Si estás detrás de un proxy)

```bash
npm config set proxy http://proxy-server:port
npm config set https-proxy http://proxy-server:port
```

### Solución 7: Instalar Paquetes Individualmente

Si el problema persiste, puedes instalar los paquetes críticos primero:

```bash
# Instalar Next.js y React primero
npm install next@latest react@latest react-dom@latest

# Luego el resto
npm install
```

## ⚠️ Advertencias de Paquetes Deprecados

Las advertencias sobre paquetes deprecados son normales y no impiden la instalación. Se resolverán cuando las dependencias se actualicen.

## 🔒 Vulnerabilidades de Seguridad

Si ves advertencias de seguridad en Next.js:

```bash
# Actualizar Next.js a la versión más reciente
npm install next@latest react@latest react-dom@latest eslint-config-next@latest
```

## 📋 Checklist de Solución

1. ✅ Verificar conexión a internet
2. ✅ Limpiar cache de npm
3. ✅ Cambiar registry si es necesario
4. ✅ Aumentar timeout
5. ✅ Probar con Yarn o pnpm
6. ✅ Verificar que Node.js esté actualizado (v18.17+)

## 🆘 Si Nada Funciona

1. **Verificar versión de Node.js:**
   ```bash
   node --version
   # Debe ser v18.17.0 o superior
   ```

2. **Actualizar Node.js:**
   - Descargar desde: https://nodejs.org/
   - O usar nvm: `nvm install 18 && nvm use 18`

3. **Verificar configuración de npm:**
   ```bash
   npm config list
   ```

4. **Contactar soporte** con el log completo:
   ```bash
   cat ~/.npm/_logs/[archivo-de-log].log
   ```

## 💡 Recomendación

Para este proyecto, recomiendo usar **pnpm** o **yarn** en lugar de npm, ya que son más rápidos y manejan mejor los problemas de red.
