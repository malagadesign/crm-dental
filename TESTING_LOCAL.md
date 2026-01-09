# Guía para Probar OCR Localmente

## Pasos para configurar y probar el OCR localmente

### 1. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con:

```env
# Database (de Supabase)
DATABASE_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

# NextAuth
NEXTAUTH_SECRET="tu-secret-key-aqui-genera-uno-con-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Google Cloud Vision API (para OCR de DNI)
GOOGLE_CLOUD_VISION_API_KEY="tu-api-key-de-google-cloud-vision"
```

**⚠️ IMPORTANTE:** La API Key debe ser una clave simple SIN vincular a cuenta de servicio.

### 2. Verificar que las variables estén configuradas

Ejecuta:
```bash
cat .env.local | grep GOOGLE_CLOUD_VISION_API_KEY
```

Deberías ver algo como:
```
GOOGLE_CLOUD_VISION_API_KEY=AIzaSy...
```

### 3. Iniciar el servidor de desarrollo

```bash
pnpm dev
```

### 4. Verificar los logs

Cuando intentes usar el OCR, deberías ver logs detallados en la terminal como:

```
[OCR DNI] Iniciando procesamiento de DNI...
[OCR DNI] Verificando sesión...
[OCR DNI] Sesión válida. Usuario: usuario@ejemplo.com
[OCR DNI] Imágenes recibidas: { frontName: 'dni-frente.jpg', ... }
[OCR DNI] Convirtiendo imágenes a base64...
[OCR DNI] API Key encontrada. Longitud: 39 Prefijo: AIzaSy...
[OCR DNI] Enviando solicitud a Google Vision API...
[OCR DNI] Respuesta de Google Vision API: { status: 200, ... }
```

### 5. Errores comunes

#### Error: "OCR no configurado"
- Verifica que `GOOGLE_CLOUD_VISION_API_KEY` esté en `.env.local`
- Reinicia el servidor después de agregar la variable

#### Error: "API keys are not supported by this API"
- Tu API Key está vinculada a una cuenta de servicio
- Crea una nueva API Key SIN cuenta de servicio en Google Cloud Console

#### Error: "Unauthorized. Por favor inicia sesión."
- Inicia sesión en la aplicación primero
- Verifica que NextAuth esté funcionando correctamente

### 6. Verificar respuesta de Google Vision API

Si ves errores, los logs mostrarán:
- Estado de la respuesta HTTP
- Mensaje de error completo de Google
- Detalles de la solicitud enviada

### 7. Probar con una imagen de prueba

1. Ve a `/dashboard/patients`
2. Haz clic en "Nuevo Paciente"
3. Haz clic en "Escanear DNI"
4. Sube una imagen del frente del DNI (requerido)
5. Opcionalmente sube la imagen del dorso
6. Haz clic en "Extraer Datos"
7. Revisa los logs en la terminal

## Troubleshooting

### Los logs no aparecen
- Verifica que estés ejecutando `pnpm dev` en la terminal
- Asegúrate de estar mirando la consola del servidor, no la del navegador

### La API Key parece correcta pero sigue fallando
- Verifica que Cloud Vision API esté habilitada en Google Cloud Console
- Espera 5-10 minutos después de habilitar la API para que se propague
- Verifica que la API Key no tenga restricciones que bloqueen localhost
