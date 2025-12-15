<?php

return [
    /*
    |--------------------------------------------------------------------------
    | WhatsApp Provider
    |--------------------------------------------------------------------------
    |
    | El proveedor de WhatsApp a usar: 'twilio', 'wati', '360dialog', 'greenapi'
    |
    */

    'provider' => env('WHATSAPP_PROVIDER', 'meta'),

    /*
    |--------------------------------------------------------------------------
    | WhatsApp Providers Configuration
    |--------------------------------------------------------------------------
    |
    | Configuración para cada proveedor de WhatsApp
    |
    */

    'providers' => [
        'meta' => [
            'api_url' => env('META_WHATSAPP_API_URL', 'https://graph.facebook.com/v18.0'),
            'phone_number_id' => env('META_WHATSAPP_PHONE_NUMBER_ID'), // ID del número de teléfono de WhatsApp Business
            'access_token' => env('META_WHATSAPP_ACCESS_TOKEN'), // Token de acceso permanente
            'business_account_id' => env('META_WHATSAPP_BUSINESS_ACCOUNT_ID'), // ID de la cuenta de negocio (opcional)
            'verify_token' => env('META_WHATSAPP_VERIFY_TOKEN', 'your_verify_token'), // Token para verificar webhook
            'app_secret' => env('META_WHATSAPP_APP_SECRET'), // App Secret (opcional, para validación)
        ],

        'twilio' => [
            'api_url' => 'https://api.twilio.com',
            'account_sid' => env('TWILIO_ACCOUNT_SID'),
            'auth_token' => env('TWILIO_AUTH_TOKEN'),
            'from' => env('TWILIO_WHATSAPP_FROM'), // Formato: +14155238886 (número de Twilio)
        ],

        'wati' => [
            'api_url' => env('WATI_API_URL', 'https://api.wati.io'),
            'api_key' => env('WATI_API_KEY'),
            'from' => env('WATI_PHONE_NUMBER'),
        ],

        '360dialog' => [
            'api_url' => env('360DIALOG_API_URL', 'https://waba.360dialog.io'),
            'api_key' => env('360DIALOG_API_KEY'),
            'from' => env('360DIALOG_PHONE_NUMBER'),
        ],

        'greenapi' => [
            'api_url' => env('GREEN_API_URL', 'https://api.green-api.com'),
            'api_key' => env('GREEN_API_TOKEN'), // Token de la instancia
            'instance_id' => env('GREEN_API_INSTANCE_ID'), // ID de la instancia
            'from' => env('GREEN_API_PHONE_NUMBER'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Enabled
    |--------------------------------------------------------------------------
    |
    | Habilitar o deshabilitar el envío de WhatsApp
    |
    */

    'enabled' => env('WHATSAPP_ENABLED', true),
];
