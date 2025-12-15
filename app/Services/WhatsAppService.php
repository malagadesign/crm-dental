<?php

namespace App\Services;

use App\Models\Appointment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected string $apiUrl;
    protected string $apiKey;
    protected string $from;
    protected string $provider;

    public function __construct()
    {
        $this->provider = config('whatsapp.provider', 'meta');
        $this->apiUrl = config("whatsapp.providers.{$this->provider}.api_url");
        $this->apiKey = config("whatsapp.providers.{$this->provider}.api_key") ?? config("whatsapp.providers.{$this->provider}.access_token");
        $this->from = config("whatsapp.providers.{$this->provider}.from") ?? config("whatsapp.providers.{$this->provider}.phone_number_id");
    }

    /**
     * Enviar mensaje de confirmación de turno
     */
    public function sendAppointmentConfirmation(Appointment $appointment): bool
    {
        if (!$appointment->patient->phone) {
            Log::warning("No se puede enviar WhatsApp: paciente sin teléfono", [
                'appointment_id' => $appointment->id,
                'patient_id' => $appointment->patient->id,
            ]);
            return false;
        }

        $phone = $this->formatPhoneNumber($appointment->patient->phone);
        
        // Formatear fecha y hora
        $date = \Carbon\Carbon::parse($appointment->datetime_start);
        $dateFormatted = $date->format('d/m/Y');
        $timeFormatted = $date->format('H:i');
        
        $message = $this->buildConfirmationMessage(
            $appointment->patient->full_name,
            $dateFormatted,
            $timeFormatted,
            $appointment->clinic->name,
            $appointment->user->name,
            $appointment->treatment?->name
        );

        return $this->sendMessage($phone, $message);
    }

    /**
     * Enviar mensaje genérico
     */
    public function sendMessage(string $to, string $message): bool
    {
        $phone = $this->formatPhoneNumber($to);

        try {
            return match ($this->provider) {
                'meta' => $this->sendViaMeta($phone, $message),
                'twilio' => $this->sendViaTwilio($phone, $message),
                'wati' => $this->sendViaWati($phone, $message),
                '360dialog' => $this->sendVia360Dialog($phone, $message),
                'greenapi' => $this->sendViaGreenAPI($phone, $message),
                default => $this->sendViaMeta($phone, $message),
            };
        } catch (\Exception $e) {
            Log::error("Error enviando WhatsApp", [
                'provider' => $this->provider,
                'to' => $phone,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Enviar via Meta WhatsApp Business API
     */
    protected function sendViaMeta(string $to, string $message): bool
    {
        $phoneNumberId = config("whatsapp.providers.meta.phone_number_id");
        $accessToken = config("whatsapp.providers.meta.access_token");
        
        if (!$phoneNumberId || !$accessToken) {
            Log::error("Configuración incompleta para Meta WhatsApp", [
                'phone_number_id' => $phoneNumberId ? 'configurado' : 'faltante',
                'access_token' => $accessToken ? 'configurado' : 'faltante',
            ]);
            return false;
        }

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$accessToken}",
            'Content-Type' => 'application/json',
        ])
            ->post("{$this->apiUrl}/{$phoneNumberId}/messages", [
                'messaging_product' => 'whatsapp',
                'recipient_type' => 'individual',
                'to' => $to,
                'type' => 'text',
                'text' => [
                    'preview_url' => false, // Cambiar a true si quieres que detecte URLs automáticamente
                    'body' => $message,
                ],
            ]);

        if ($response->successful()) {
            Log::info("WhatsApp enviado via Meta", [
                'to' => $to,
                'message_id' => $response->json('messages')[0]['id'] ?? null,
            ]);
            return true;
        }

        Log::error("Error Meta WhatsApp", [
            'response' => $response->json(),
            'status' => $response->status(),
            'to' => $to,
        ]);

        return false;
    }

    /**
     * Enviar via Twilio
     */
    protected function sendViaTwilio(string $to, string $message): bool
    {
        $accountSid = config("whatsapp.providers.twilio.account_sid");
        $authToken = config("whatsapp.providers.twilio.auth_token");
        
        $response = Http::withBasicAuth($accountSid, $authToken)
            ->asForm()
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$accountSid}/Messages.json", [
                'From' => "whatsapp:{$this->from}",
                'To' => "whatsapp:{$to}",
                'Body' => $message,
            ]);

        if ($response->successful()) {
            Log::info("WhatsApp enviado via Twilio", ['to' => $to]);
            return true;
        }

        Log::error("Error Twilio WhatsApp", [
            'response' => $response->json(),
            'status' => $response->status(),
        ]);

        return false;
    }

    /**
     * Enviar via Wati.io
     */
    protected function sendViaWati(string $to, string $message): bool
    {
        $response = Http::withHeaders([
            'Authorization' => "Bearer {$this->apiKey}",
        ])
            ->post("{$this->apiUrl}/api/v1/sendSessionMessage/{$to}", [
                'messageText' => $message,
            ]);

        if ($response->successful()) {
            Log::info("WhatsApp enviado via Wati", ['to' => $to]);
            return true;
        }

        Log::error("Error Wati WhatsApp", [
            'response' => $response->json(),
            'status' => $response->status(),
        ]);

        return false;
    }

    /**
     * Enviar via 360dialog
     */
    protected function sendVia360Dialog(string $to, string $message): bool
    {
        $response = Http::withHeaders([
            'D360-API-KEY' => $this->apiKey,
            'Content-Type' => 'application/json',
        ])
            ->post("{$this->apiUrl}/v1/messages", [
                'recipient_type' => 'individual',
                'to' => $to,
                'type' => 'text',
                'text' => [
                    'body' => $message,
                ],
            ]);

        if ($response->successful()) {
            Log::info("WhatsApp enviado via 360dialog", ['to' => $to]);
            return true;
        }

        Log::error("Error 360dialog WhatsApp", [
            'response' => $response->json(),
            'status' => $response->status(),
        ]);

        return false;
    }

    /**
     * Enviar via Green API (para desarrollo)
     */
    protected function sendViaGreenAPI(string $to, string $message): bool
    {
        $instanceId = config("whatsapp.providers.greenapi.instance_id");
        
        $response = Http::post("https://api.green-api.com/waInstance{$instanceId}/sendMessage/{$this->apiKey}", [
            'chatId' => "{$to}@c.us",
            'message' => $message,
        ]);

        if ($response->successful()) {
            Log::info("WhatsApp enviado via Green API", ['to' => $to]);
            return true;
        }

        Log::error("Error Green API WhatsApp", [
            'response' => $response->json(),
            'status' => $response->status(),
        ]);

        return false;
    }

    /**
     * Formatear número de teléfono
     */
    protected function formatPhoneNumber(string $phone): string
    {
        // Remover caracteres no numéricos
        $phone = preg_replace('/[^0-9]/', '', $phone);
        
        // Si empieza con 0, removerlo
        if (strpos($phone, '0') === 0) {
            $phone = substr($phone, 1);
        }
        
        // Si no tiene código de país, agregar +54 (Argentina)
        if (!str_starts_with($phone, '54')) {
            $phone = '54' . $phone;
        }
        
        return $phone;
    }

    /**
     * Construir mensaje de confirmación
     */
    protected function buildConfirmationMessage(
        string $patientName,
        string $date,
        string $time,
        string $clinicName,
        string $dentistName,
        ?string $treatment = null
    ): string {
        $message = "🦷 *Confirmación de Turno*\n\n";
        $message .= "Hola {$patientName},\n\n";
        $message .= "Tu turno ha sido confirmado:\n\n";
        $message .= "📅 *Fecha:* {$date}\n";
        $message .= "🕐 *Hora:* {$time}\n";
        $message .= "👨‍⚕️ *Odontólogo:* {$dentistName}\n";
        $message .= "🏥 *Consultorio:* {$clinicName}\n";
        
        if ($treatment) {
            $message .= "🦷 *Tratamiento:* {$treatment}\n";
        }
        
        $message .= "\n";
        $message .= "Te esperamos!\n\n";
        $message .= "Si necesitas cambiar o cancelar tu turno, contáctanos con anticipación.";
        
        return $message;
    }
}
