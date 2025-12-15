# Configuración de WhatsApp para Notificaciones

Este documento explica cómo configurar las notificaciones de WhatsApp para confirmaciones de turnos.

## Opciones de Proveedores

### 1. Meta WhatsApp Business API (Nativa) ⭐ RECOMENDADO

**Ventajas:**
- API oficial de Meta/Facebook
- Sin intermediarios
- Control total
- Gratis hasta cierto límite
- Integración directa con Business Manager

**Requisitos:**
- Meta Business Manager configurado
- WhatsApp Business Account
- Aplicación creada en Meta for Developers
- Número de teléfono verificado

**Pasos de Configuración:**

1. **Crear Aplicación en Meta for Developers:**
   - Ir a https://developers.facebook.com
   - Crear una nueva aplicación
   - Agregar producto "WhatsApp"
   - Configurar permisos necesarios

2. **Obtener Credenciales:**
   - **Phone Number ID**: Se encuentra en WhatsApp > API Setup
   - **Access Token**: Token de acceso permanente (generar desde API Setup)
   - **Business Account ID**: ID de la cuenta de negocio (opcional)
   - **App Secret**: Se encuentra en Configuración > Básico
   - **Verify Token**: Crear un token personalizado para verificar el webhook

3. **Configurar Webhook:**
   - URL del webhook: `https://tu-dominio.com/webhook/whatsapp`
   - Verify Token: El mismo que configuraste en `.env`
   - Suscribirse a eventos: `messages`, `message_status`

4. **Variables de entorno (.env):**
```env
WHATSAPP_PROVIDER=meta
WHATSAPP_ENABLED=true
META_WHATSAPP_API_URL=https://graph.facebook.com/v18.0
META_WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
META_WHATSAPP_ACCESS_TOKEN=tu_access_token
META_WHATSAPP_BUSINESS_ACCOUNT_ID=tu_business_account_id
META_WHATSAPP_VERIFY_TOKEN=tu_verify_token_personalizado
META_WHATSAPP_APP_SECRET=tu_app_secret
```

**Nota:** El webhook debe ser accesible públicamente. Para desarrollo local, puedes usar ngrok o similar.

### 2. Twilio (Recomendado para Producción) ✅

**Ventajas:**
- WhatsApp Business API oficial
- Muy confiable y estable
- Excelente documentación
- Soporte profesional

**Pasos:**
1. Crear cuenta en [Twilio](https://www.twilio.com)
2. Solicitar acceso a WhatsApp Sandbox (gratis) o WhatsApp Business API (requiere aprobación)
3. Obtener `Account SID` y `Auth Token`
4. Configurar número de WhatsApp

**Variables de entorno (.env):**
```env
WHATSAPP_PROVIDER=twilio
WHATSAPP_ENABLED=true
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_WHATSAPP_FROM=+14155238886
```

### 2. Wati.io

**Ventajas:**
- Específico para WhatsApp Business
- Interfaz simple
- Fácil de configurar

**Pasos:**
1. Crear cuenta en [Wati.io](https://www.wati.io)
2. Obtener API Key y URL
3. Configurar número

**Variables de entorno (.env):**
```env
WHATSAPP_PROVIDER=wati
WHATSAPP_ENABLED=true
WATI_API_URL=https://api.wati.io
WATI_API_KEY=tu_api_key
WATI_PHONE_NUMBER=tu_numero
```

### 3. 360dialog

**Ventajas:**
- Proveedor oficial de WhatsApp Business API
- Precios competitivos
- Buena documentación

**Pasos:**
1. Crear cuenta en [360dialog](https://www.360dialog.com)
2. Obtener API Key
3. Configurar número

**Variables de entorno (.env):**
```env
WHATSAPP_PROVIDER=360dialog
WHATSAPP_ENABLED=true
360DIALOG_API_URL=https://waba.360dialog.io
360DIALOG_API_KEY=tu_api_key
360DIALOG_PHONE_NUMBER=tu_numero
```

### 4. Green API (Para Pruebas/Desarrollo) 🧪

**Ventajas:**
- Fácil de configurar
- Útil para desarrollo
- No requiere aprobación oficial

**Desventajas:**
- No oficial (puede ser bloqueado)
- No recomendado para producción

**Pasos:**
1. Crear cuenta en [Green API](https://green-api.com)
2. Crear instancia
3. Obtener Instance ID y Token

**Variables de entorno (.env):**
```env
WHATSAPP_PROVIDER=greenapi
WHATSAPP_ENABLED=true
GREEN_API_INSTANCE_ID=tu_instance_id
GREEN_API_TOKEN=tu_token
GREEN_API_PHONE_NUMBER=tu_numero
```

## Configuración General

### Variables de Entorno Requeridas

Agregar al archivo `.env`:

```env
# Proveedor a usar: twilio, wati, 360dialog, greenapi
WHATSAPP_PROVIDER=twilio

# Habilitar/deshabilitar WhatsApp
WHATSAPP_ENABLED=true

# Configuración específica del proveedor (ver arriba)
```

### Deshabilitar WhatsApp

Para deshabilitar temporalmente las notificaciones:

```env
WHATSAPP_ENABLED=false
```

## Funcionalidades

### Envío Automático

- **Al crear un turno** con estado "Confirmado": Se envía automáticamente
- **Al cambiar estado a "Confirmado"**: Se envía automáticamente

### Envío Manual

- Botón "Enviar WhatsApp" en la tabla de turnos
- Disponible solo si el paciente tiene teléfono configurado

## Formato del Mensaje

El mensaje enviado incluye:
- Nombre del paciente
- Fecha y hora del turno
- Odontólogo asignado
- Consultorio
- Tratamiento (si está configurado)

## Solución de Problemas

### Error: "No se puede enviar WhatsApp: paciente sin teléfono"
- Verificar que el paciente tenga un número de teléfono configurado

### Error: "Error al enviar WhatsApp"
- Verificar las credenciales del proveedor en `.env`
- Verificar que `WHATSAPP_ENABLED=true`
- Revisar los logs en `storage/logs/laravel.log`

### El mensaje no llega
- Verificar que el número esté en formato internacional (ej: 5491123456789)
- Verificar que el número esté registrado en el proveedor
- Para Twilio Sandbox, el número debe estar verificado primero

## Notas

- Los mensajes se envían de forma asíncrona (usando colas)
- Asegúrate de tener las colas configuradas correctamente
- Para producción, se recomienda usar Twilio o 360dialog
