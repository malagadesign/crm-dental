# Alternativas de Instalación

Si `npm install` no funciona, aquí tienes alternativas:

## 🟡 Opción 1: Usar Yarn

Yarn es más robusto con problemas de red:

```bash
# Instalar Yarn (si no lo tienes)
npm install -g yarn

# Instalar dependencias
yarn install

# Ejecutar en desarrollo
yarn dev
```

## 🟢 Opción 2: Usar pnpm (Recomendado)

pnpm es más rápido y eficiente:

```bash
# Instalar pnpm (si no lo tienes)
npm install -g pnpm

# Instalar dependencias
pnpm install

# Ejecutar en desarrollo
pnpm dev
```

## 🔵 Opción 3: Instalación Manual por Etapas

Si todo falla, instala los paquetes críticos primero:

```bash
# 1. Limpiar todo
rm -rf node_modules package-lock.json

# 2. Instalar Next.js y React primero
npm install next@^14.2.35 react@^18.3.1 react-dom@^18.3.1 --save

# 3. Instalar TypeScript y herramientas de desarrollo
npm install typescript @types/node @types/react @types/react-dom --save-dev

# 4. Instalar Prisma
npm install @prisma/client prisma --save-dev

# 5. Instalar Tailwind
npm install tailwindcss postcss autoprefixer --save-dev

# 6. Instalar el resto
npm install
```

## 📦 Scripts de Instalación Rápida

### Con Yarn:
```bash
yarn install && yarn dev
```

### Con pnpm:
```bash
pnpm install && pnpm dev
```

## ⚡ Ventajas de cada herramienta:

- **npm**: Estándar, viene con Node.js
- **yarn**: Más rápido, mejor manejo de cache, lock file más confiable
- **pnpm**: Más rápido aún, usa menos espacio en disco, mejor para monorepos

## 🎯 Recomendación Final

Para este proyecto, usa **pnpm**:
```bash
npm install -g pnpm
pnpm install
pnpm dev
```
