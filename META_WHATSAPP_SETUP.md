# Configuración de Meta WhatsApp Business API

Guía paso a paso para configurar WhatsApp Business API nativa de Meta.

## 📋 Requisitos Previos

1. Meta Business Manager configurado
2. WhatsApp Business Account creada
3. Número de teléfono verificado
4. Aplicación creada en Meta for Developers

## 🚀 Pasos de Configuración

### Paso 1: Crear Aplicación en Meta for Developers

1. Ir a https://developers.facebook.com
2. Hacer clic en "Mis Aplicaciones" > "Crear Aplicación"
3. Seleccionar tipo "Negocio"
4. Completar el formulario con:
   - Nombre de la aplicación
   - Email de contacto
   - Propósito de la aplicación

### Paso 2: Agregar Producto WhatsApp

1. En el dashboard de tu aplicación, buscar "WhatsApp"
2. Hacer clic en "Configurar" en el producto WhatsApp
3. Seleccionar tu WhatsApp Business Account
4. Completar la configuración inicial

### Paso 3: Obtener Credenciales

En la sección **WhatsApp > API Setup** encontrarás:

1. **Phone Number ID** (ID del Número de Teléfono)
   - Copiar este ID
   - Ejemplo: `123456789012345`

2. **Access Token** (Token de Acceso)
   - Hacer clic en "Generar token"
   - Seleccionar permisos necesarios
   - **IMPORTANTE**: Para producción, generar un token permanente
   - Copiar el token generado

3. **Business Account ID** (ID de la Cuenta de Negocio)
   - Se encuentra en la URL o en la configuración
   - Ejemplo: `123456789012345`

4. **App Secret** (Secreto de la Aplicación)
   - Ir a Configuración > Básico
   - Hacer clic en "Mostrar" en "Secreto de la aplicación"
   - Copiar el secreto

### Paso 4: Configurar Webhook

1. En **WhatsApp > Configuración**, ir a "Webhooks"
2. Hacer clic en "Configurar webhooks"
3. Ingresar:
   - **URL de devolución de llamada**: `https://tu-dominio.com/webhook/whatsapp`
   - **Token de verificación**: Crear un token personalizado (ej: `mi_token_secreto_123`)
4. Hacer clic en "Verificar y guardar"
5. Suscribirse a los siguientes campos:
   - ✅ `messages` - Para recibir mensajes
   - ✅ `message_status` - Para recibir estados de mensajes enviados

### Paso 5: Configurar Variables de Entorno

Agregar al archivo `.env`:

```env
# Proveedor de WhatsApp
WHATSAPP_PROVIDER=meta
WHATSAPP_ENABLED=true

# Credenciales de Meta WhatsApp Business API
META_WHATSAPP_API_URL=https://graph.facebook.com/v18.0
META_WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id_aqui
META_WHATSAPP_ACCESS_TOKEN=tu_access_token_aqui
META_WHATSAPP_BUSINESS_ACCOUNT_ID=tu_business_account_id_aqui
META_WHATSAPP_VERIFY_TOKEN=tu_token_personalizado_aqui
META_WHATSAPP_APP_SECRET=tu_app_secret_aqui
```

### Paso 6: Probar la Configuración

1. **Verificar Webhook:**
   - Meta enviará una solicitud GET a tu webhook
   - El sistema debería responder correctamente

2. **Enviar Mensaje de Prueba:**
   - Crear un turno con estado "Confirmado"
   - O usar el botón "Enviar WhatsApp" en la tabla de turnos
   - Verificar que el mensaje llegue al paciente

## 🔧 Desarrollo Local

Para probar en desarrollo local, necesitas exponer tu servidor local:

### Opción 1: ngrok (Recomendado)

```bash
# Instalar ngrok
brew install ngrok  # macOS
# o descargar desde https://ngrok.com

# Exponer puerto 8000
ngrok http 8000

# Usar la URL proporcionada (ej: https://abc123.ngrok.io)
# Configurar en Meta: https://abc123.ngrok.io/webhook/whatsapp
```

### Opción 2: Cloudflare Tunnel

```bash
# Instalar cloudflared
# Configurar túnel
cloudflared tunnel --url http://localhost:8000
```

## 📝 Notas Importantes

### Tokens de Acceso

- **Tokens Temporales**: Vencen después de 24 horas (solo para pruebas)
- **Tokens Permanentes**: Necesarios para producción
  - Generar desde Meta Business Manager
  - Configurar permisos necesarios
  - Guardar de forma segura

### Límites de la API

- **Ventana de 24 horas**: Solo puedes responder a mensajes dentro de las 24 horas
- **Mensajes fuera de ventana**: Requieren plantillas aprobadas
- **Límite de mensajes**: Depende de tu nivel de verificación

### Formato de Números

Los números deben estar en formato internacional sin el signo `+`:
- ✅ Correcto: `5491123456789` (Argentina)
- ❌ Incorrecto: `+54 9 11 2345-6789`
- ❌ Incorrecto: `011 2345-6789`

El sistema formatea automáticamente los números, pero verifica que el paciente tenga un número válido.

## 🐛 Solución de Problemas

### Error: "Invalid OAuth access token"

- Verificar que el token no haya expirado
- Regenerar el token si es necesario
- Verificar que el token tenga los permisos correctos

### Error: "Phone number not found"

- Verificar que el `PHONE_NUMBER_ID` sea correcto
- Verificar que el número esté verificado en Meta Business Manager

### Webhook no se verifica

- Verificar que la URL sea accesible públicamente
- Verificar que el `VERIFY_TOKEN` coincida exactamente
- Revisar los logs del servidor

### Mensajes no llegan

- Verificar que el número del paciente esté en formato correcto
- Verificar que el número esté registrado en WhatsApp
- Revisar los logs en `storage/logs/laravel.log`

## 📚 Recursos Adicionales

- [Documentación oficial de Meta WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Guía de inicio rápido](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Referencia de API](https://developers.facebook.com/docs/whatsapp/cloud-api/reference)

## ✅ Checklist de Configuración

- [ ] Aplicación creada en Meta for Developers
- [ ] Producto WhatsApp agregado
- [ ] Phone Number ID obtenido
- [ ] Access Token generado (permanente para producción)
- [ ] Business Account ID obtenido
- [ ] App Secret copiado
- [ ] Webhook configurado y verificado
- [ ] Variables de entorno configuradas en `.env`
- [ ] Webhook accesible públicamente (para producción)
- [ ] Prueba de envío exitosa
