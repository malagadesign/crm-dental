<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class WhatsAppWebhookController extends Controller
{
    /**
     * Verificar el webhook de WhatsApp (GET request)
     */
    public function verify(Request $request)
    {
        $mode = $request->query('hub_mode');
        $token = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        $verifyToken = config('whatsapp.providers.meta.verify_token');

        if ($mode === 'subscribe' && $token === $verifyToken) {
            Log::info('Webhook de WhatsApp verificado exitosamente');
            return response($challenge, 200);
        }

        Log::warning('Intento de verificación de webhook fallido', [
            'mode' => $mode,
            'token' => $token,
        ]);

        return response('Forbidden', 403);
    }

    /**
     * Recibir mensajes del webhook de WhatsApp (POST request)
     */
    public function webhook(Request $request)
    {
        $data = $request->all();

        // Verificar firma del webhook (opcional pero recomendado)
        if (config('whatsapp.providers.meta.app_secret')) {
            if (!$this->verifySignature($request)) {
                Log::warning('Firma del webhook no válida');
                return response('Unauthorized', 401);
            }
        }

        Log::info('Webhook de WhatsApp recibido', ['data' => $data]);

        // Procesar el webhook
        if (isset($data['object']) && $data['object'] === 'whatsapp_business_account') {
            foreach ($data['entry'] ?? [] as $entry) {
                foreach ($entry['changes'] ?? [] as $change) {
                    $value = $change['value'] ?? [];

                    // Procesar mensajes recibidos
                    if (isset($value['messages'])) {
                        $this->processMessages($value['messages']);
                    }

                    // Procesar estados de mensajes enviados
                    if (isset($value['statuses'])) {
                        $this->processStatuses($value['statuses']);
                    }
                }
            }
        }

        return response('OK', 200);
    }

    /**
     * Procesar mensajes recibidos
     */
    protected function processMessages(array $messages): void
    {
        foreach ($messages as $message) {
            $from = $message['from'] ?? null;
            $text = $message['text']['body'] ?? null;
            $messageId = $message['id'] ?? null;

            Log::info('Mensaje recibido de WhatsApp', [
                'from' => $from,
                'text' => $text,
                'message_id' => $messageId,
            ]);

            // Aquí puedes agregar lógica para responder automáticamente
            // o guardar los mensajes en la base de datos
        }
    }

    /**
     * Procesar estados de mensajes enviados
     */
    protected function processStatuses(array $statuses): void
    {
        foreach ($statuses as $status) {
            $messageId = $status['id'] ?? null;
            $statusType = $status['status'] ?? null; // sent, delivered, read, failed
            $recipientId = $status['recipient_id'] ?? null;

            Log::info('Estado de mensaje WhatsApp', [
                'message_id' => $messageId,
                'status' => $statusType,
                'recipient_id' => $recipientId,
            ]);

            // Aquí puedes actualizar el estado de los mensajes en tu base de datos
            // Por ejemplo, marcar como entregado o leído
        }
    }

    /**
     * Verificar la firma del webhook
     */
    protected function verifySignature(Request $request): bool
    {
        $signature = $request->header('X-Hub-Signature-256');
        $appSecret = config('whatsapp.providers.meta.app_secret');

        if (!$signature || !$appSecret) {
            return false;
        }

        $expectedSignature = 'sha256=' . hash_hmac('sha256', $request->getContent(), $appSecret);

        return hash_equals($expectedSignature, $signature);
    }
}
