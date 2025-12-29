# Instalación de Dark Mode

Para activar el modo oscuro/claro, necesitas instalar la dependencia `next-themes`.

## Instalación

```bash
cd nextjs-crm
pnpm install
```

O si prefieres usar npm:

```bash
cd nextjs-crm
npm install
```

Esto instalará `next-themes` que ya está agregado al `package.json`.

## Uso

Una vez instalado, el toggle de modo oscuro/claro aparecerá automáticamente en el header (icono de sol/luna).

El tema se guarda en el localStorage del navegador y se respeta entre sesiones.

## Características

- ✅ Toggle dark/light mode en el header
- ✅ Persistencia del tema elegido
- ✅ Soporte para "system" (detecta preferencia del sistema)
- ✅ Transiciones suaves
- ✅ Sin flash de contenido incorrecto (FOUC)
