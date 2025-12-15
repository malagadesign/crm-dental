<?php

namespace App\Filament\Resources\AppointmentResource\Pages;

use App\Filament\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Notifications\AppointmentConfirmedNotification;
use Filament\Actions;
use Filament\Notifications\Notification as FilamentNotification;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Validation\ValidationException;

class CreateAppointment extends CreateRecord
{
    protected static string $resource = AppointmentResource::class;

    public function getTitle(): string
    {
        return 'Crear Turno';
    }

    public function mount(): void
    {
        parent::mount();
        
        // Pre-llenar paciente si viene desde el RelationManager
        if (request()->has('patient_id')) {
            $this->form->fill([
                'patient_id' => request()->get('patient_id'),
            ]);
        }
    }

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        // Validar que no haya solapamiento de turnos para el mismo usuario
        $hasOverlap = Appointment::where('user_id', $data['user_id'])
            ->where(function ($query) use ($data) {
                $query->whereBetween('datetime_start', [$data['datetime_start'], $data['datetime_end']])
                    ->orWhereBetween('datetime_end', [$data['datetime_start'], $data['datetime_end']])
                    ->orWhere(function ($q) use ($data) {
                        $q->where('datetime_start', '<=', $data['datetime_start'])
                            ->where('datetime_end', '>=', $data['datetime_end']);
                    });
            })
            ->where('status', '!=', 'cancelado')
            ->exists();

        if ($hasOverlap) {
            throw ValidationException::withMessages([
                'datetime_start' => 'El odontólogo ya tiene un turno asignado en este horario.',
            ]);
        }

        // Validar que datetime_end sea mayor que datetime_start
        if (strtotime($data['datetime_end']) <= strtotime($data['datetime_start'])) {
            throw ValidationException::withMessages([
                'datetime_end' => 'La fecha de fin debe ser posterior a la fecha de inicio.',
            ]);
        }

        return $data;
    }

    protected function afterCreate(): void
    {
        // Enviar notificación WhatsApp si el turno está confirmado
        if ($this->record->status === 'confirmado' && config('whatsapp.enabled', true)) {
            try {
                \Illuminate\Support\Facades\Bus::dispatch(new AppointmentConfirmedNotification($this->record));
                FilamentNotification::make()
                    ->title('Notificación WhatsApp enviada')
                    ->success()
                    ->send();
            } catch (\Exception $e) {
                FilamentNotification::make()
                    ->title('Error al enviar WhatsApp')
                    ->body('El turno se creó pero no se pudo enviar la notificación: ' . $e->getMessage())
                    ->warning()
                    ->send();
            }
        }
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
