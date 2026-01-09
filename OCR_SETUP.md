# Configuración de OCR para Escaneo de DNI

Este documento explica cómo configurar el reconocimiento óptico de caracteres (OCR) para escanear DNI argentinos y extraer automáticamente los datos de los pacientes.

## Opciones Disponibles

### Opción 1: Google Cloud Vision API (Recomendado)

Google Cloud Vision API ofrece alta precisión en el reconocimiento de texto y es especialmente bueno para documentos estructurados como DNI.

#### Pasos para Configurar:

1. **Crear un proyecto en Google Cloud Console**
   - Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - Crea un nuevo proyecto o selecciona uno existente

2. **Habilitar Cloud Vision API**
   - En el menú, ve a "APIs & Services" > "Library"
   - Busca "Cloud Vision API"
   - Haz clic en "Enable"

3. **Crear una API Key**
   - Ve a "APIs & Services" > "Credentials"
   - Haz clic en "Create Credentials" > "API Key"
   - Copia la clave generada

4. **Configurar la variable de entorno**
   - Agrega la siguiente variable a tu archivo `.env`:
   ```env
   GOOGLE_CLOUD_VISION_API_KEY=tu-api-key-aqui
   ```
   - En Vercel, agrega esta variable en "Settings" > "Environment Variables"

5. **Configurar restricciones (Opcional pero recomendado)**
   - En Google Cloud Console, edita tu API Key
   - En "API restrictions", selecciona "Restrict key" y elige "Cloud Vision API"
   - En "Application restrictions", puedes restringir por dominio (para producción)

#### Costos:
- Los primeros 1,000 requests por mes son gratuitos
- Después: $1.50 por cada 1,000 requests adicionales
- Más información: [Google Cloud Vision Pricing](https://cloud.google.com/vision/pricing)

### Opción 2: Tesseract.js (Alternativa gratuita)

Tesseract.js es una alternativa gratuita que funciona completamente en el cliente o servidor, pero requiere más configuración.

#### Instalación:

```bash
pnpm add tesseract.js
```

#### Configuración:

Necesitarías modificar `/app/api/ocr/dni/route.ts` para usar Tesseract.js en lugar de Google Cloud Vision.

**Nota:** Tesseract.js es menos preciso que Google Cloud Vision, especialmente para documentos estructurados como DNI.

## Uso

Una vez configurado, los usuarios pueden:

1. Hacer clic en "Escanear DNI" en el formulario de nuevo paciente
2. Subir la imagen del frente del DNI (requerido)
3. Opcionalmente subir la imagen del dorso del DNI
4. Hacer clic en "Extraer Datos"
5. El sistema pre-llenará automáticamente:
   - Nombre
   - Apellido
   - DNI
   - Fecha de nacimiento
   - Dirección (si está disponible)

## Mejoras Futuras

- Soporte para otros tipos de documentos (pasaportes, licencias de conducir)
- Validación mejorada de datos extraídos
- Almacenamiento de imágenes del DNI en Supabase Storage
- Mejora del parser para diferentes formatos de DNI

## Solución de Problemas

### Error: "OCR no configurado"
- Verifica que `GOOGLE_CLOUD_VISION_API_KEY` esté configurada en las variables de entorno
- Asegúrate de que la API Key tenga permisos para Cloud Vision API

### Datos extraídos incorrectamente
- El OCR puede tener errores, especialmente con imágenes de baja calidad
- Siempre revisa y corrige los datos extraídos antes de guardar
- Asegúrate de que las imágenes sean claras y estén bien iluminadas

### Límites de cuota
- Google Cloud Vision tiene límites de cuota por defecto
- Puedes aumentar los límites en Google Cloud Console si es necesario
