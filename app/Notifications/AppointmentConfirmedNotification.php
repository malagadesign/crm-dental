<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Services\WhatsAppService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class AppointmentConfirmedNotification implements ShouldQueue
{
    use Queueable;

    protected Appointment $appointment;

    /**
     * Create a new notification instance.
     */
    public function __construct(Appointment $appointment)
    {
        $this->appointment = $appointment;
    }

    /**
     * Handle the notification
     */
    public function handle(): void
    {
        if (!config('whatsapp.enabled', true)) {
            return;
        }

        try {
            $whatsappService = app(WhatsAppService::class);
            $whatsappService->sendAppointmentConfirmation($this->appointment);
        } catch (\Exception $e) {
            Log::error('Error enviando notificación WhatsApp', [
                'appointment_id' => $this->appointment->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
