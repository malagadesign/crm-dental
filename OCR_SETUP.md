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

3. **Crear una Cuenta de Servicio**
   - Ve a "APIs & Services" > "Credentials"
   - Haz clic en "Create Credentials" > "Service Account"
   - Completa el formulario:
     - **¿Qué API estás usando?** → Selecciona "Cloud Vision API"
     - **¿A qué datos quieres acceder?** → Selecciona **"Datos de aplicaciones"** (Application data)
   - Asigna un nombre a la cuenta de servicio (ej: "crm-dental-ocr")
   - Haz clic en "Create and Continue"
   - Opcional: Asigna roles (puedes saltar este paso)
   - Haz clic en "Done"

4. **Crear y descargar la clave JSON**
   - En la lista de cuentas de servicio, haz clic en la que acabas de crear (en tu caso "Dental")
   - Ve a la pestaña "Claves" (Keys) - deberías ver una tabla vacía que dice "No hay filas para mostrar"
   - Haz clic en el botón azul **"Agregar clave"** (Add key)
   - En el menú desplegable, selecciona **"Crear nueva clave"** (Create new key)
   - Se abrirá un diálogo, selecciona el formato **"JSON"**
   - Haz clic en "Crear" (Create)
   - **Se descargará automáticamente** un archivo JSON con las credenciales (el nombre será algo como `agoradental-xxxxx-xxxxx.json`)
   - ⚠️ **IMPORTANTE:** Guarda este archivo en un lugar seguro, no lo subas a GitHub

5. **Configurar la variable de entorno**

   **⚠️ IMPORTANTE:** Si creaste una cuenta de servicio primero, NO uses esa API Key vinculada. Necesitas crear una API Key **separada** que NO esté vinculada a ninguna cuenta de servicio.

   - **Opción A: Usar API Key simple (Recomendada)**
     - Ve a "APIs & Services" > "Credentials"
     - Haz clic en "Create Credentials" > "API Key"
     - **IMPORTANTE:** Cuando se cree la API Key, asegúrate de que NO esté vinculada a ninguna cuenta de servicio
       - Si ves "Cuenta vinculada" en la configuración de la API Key, elimínala y crea una nueva sin cuenta de servicio
     - Copia la clave generada
     - Agrega a tu archivo `.env`:
     ```env
     GOOGLE_CLOUD_VISION_API_KEY=tu-api-key-aqui
     ```
     - En Vercel, agrega la variable en "Settings" > "Environment Variables"
   
   - **Opción B: Usar credenciales JSON de cuenta de servicio (No implementado aún)**
     - Esta opción requiere configuración adicional y aún no está implementada en el código
     - Por ahora, usa la Opción A (API Key simple)

6. **Configurar restricciones (Opcional pero recomendado para API Key)**
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

### Error: "API keys are not supported by this API. Expected OAuth2 access token"

**Este es el error que estás viendo.** Indica que tu API Key está vinculada a una cuenta de servicio y no puede usarse directamente con la API REST.

**Solución:**
1. Ve a Google Cloud Console > APIs & Services > Credentials
2. Haz clic en "Create Credentials" > "API Key"
3. **IMPORTANTE:** En la nueva API Key, asegúrate de que NO aparezca ninguna "Cuenta vinculada"
   - Si ves "Cuenta vinculada: dental@agoradental.iam.gserviceaccount.com", esta API Key NO funcionará
   - Elimina esta API Key y crea una nueva
4. En "API restrictions", selecciona "Restrict key" y agrega "Cloud Vision API"
5. En "Application restrictions", puedes dejarlo en "None" o restringir por HTTP referrer agregando `*.vercel.app`
6. Copia la nueva API Key (debería comenzar con algo como `AIza...`)
7. Actualiza la variable `GOOGLE_CLOUD_VISION_API_KEY` en Vercel con la nueva clave
8. Espera unos minutos y vuelve a intentar

### Error: "Requests from referer <empty> are blocked" (403 - API_KEY_HTTP_REFERRER_BLOCKED)

**Este es el error que estás viendo.** Indica que tu API Key tiene restricciones de HTTP referrer configuradas, pero las llamadas desde el servidor (API routes de Next.js) no envían un referrer HTTP.

**Problema:** Las restricciones de HTTP referrer funcionan para llamadas desde el navegador (client-side), pero NO para llamadas desde el servidor (server-side). Como estamos haciendo la llamada desde una API route de Next.js, no hay referrer HTTP y Google bloquea la solicitud.

**Solución:**
1. Ve a Google Cloud Console > APIs & Services > Credentials
2. Haz clic en tu API Key para editarla
3. En la sección **"Application restrictions"** (Restricciones de aplicaciones):
   - Cambia de **"Sitios web" (Websites)** a **"Ninguno" (None)**
   - Esto permitirá que la API Key funcione desde el servidor
4. En **"API restrictions"** (Restricciones de API):
   - Mantén **"Restringir clave" (Restrict key)**
   - Asegúrate de que **"Cloud Vision API"** esté en la lista de APIs permitidas
5. Haz clic en **"Guardar" (Save)**
6. Espera 2-5 minutos para que los cambios se propaguen
7. Vuelve a intentar

**Nota de seguridad:** 
- Si necesitas mantener seguridad, puedes usar restricciones de IP en lugar de HTTP referrer
- Para desarrollo local y producción en Vercel, "Ninguno" es la opción más simple y funcional
- Las restricciones de API (solo Cloud Vision API) ya proporcionan un nivel de seguridad adecuado

### Error: "API Key inválida o sin permisos" (401/403)

Este error indica que la API Key está configurada pero no es válida o no tiene permisos. Sigue estos pasos:

1. **Verifica que la API Key esté correctamente copiada:**
   - Ve a Google Cloud Console > APIs & Services > Credentials
   - Copia la API Key completa (sin espacios al inicio o final)
   - En Vercel, verifica que la variable `GOOGLE_CLOUD_VISION_API_KEY` tenga exactamente el mismo valor

2. **Habilita Cloud Vision API:**
   - Ve a Google Cloud Console > APIs & Services > Library
   - Busca "Cloud Vision API"
   - Si no está habilitada, haz clic en "Enable"
   - Espera unos minutos para que se propague el cambio

3. **Verifica las restricciones de la API Key:**
   - Ve a Google Cloud Console > APIs & Services > Credentials
   - Haz clic en tu API Key para editarla
   - En "API restrictions":
     - Si está restringida, asegúrate de que "Cloud Vision API" esté en la lista
     - O cambia a "Don't restrict key" temporalmente para probar
   - En "Application restrictions":
     - Si está restringida por HTTP referrer, agrega `*.vercel.app` y tu dominio
     - O cambia a "None" temporalmente para probar

4. **Verifica la facturación:**
   - Aunque los primeros 1,000 requests son gratuitos, necesitas tener una cuenta de facturación activa
   - Ve a Google Cloud Console > Billing
   - Asegúrate de tener una cuenta de facturación vinculada

5. **Revisa los logs de Vercel:**
   - Los logs mostrarán el error exacto de Google Cloud
   - Busca mensajes como "API key not valid" o "Permission denied"

6. **Crea una nueva API Key (si nada funciona):**
   - Ve a Google Cloud Console > APIs & Services > Credentials
   - Crea una nueva API Key
   - Asegúrate de habilitar Cloud Vision API antes
   - Actualiza la variable en Vercel con la nueva clave

### Error: "No se pudo extraer texto de las imágenes"
- Las imágenes pueden ser de baja calidad o estar borrosas
- Asegúrate de que las imágenes sean claras y estén bien iluminadas
- Intenta con imágenes de mayor resolución

### Datos extraídos incorrectamente
- El OCR puede tener errores, especialmente con imágenes de baja calidad
- Siempre revisa y corrige los datos extraídos antes de guardar
- Asegúrate de que las imágenes sean claras y estén bien iluminadas

### Límites de cuota
- Google Cloud Vision tiene límites de cuota por defecto
- Puedes aumentar los límites en Google Cloud Console si es necesario
- Los primeros 1,000 requests por mes son gratuitos