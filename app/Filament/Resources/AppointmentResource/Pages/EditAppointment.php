<?php

namespace App\Filament\Resources\AppointmentResource\Pages;

use App\Filament\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Notifications\AppointmentConfirmedNotification;
use Carbon\Carbon;
use Filament\Actions;
use Filament\Notifications\Notification as FilamentNotification;
use Filament\Resources\Pages\EditRecord;
use Illuminate\Validation\ValidationException;

class EditAppointment extends EditRecord
{
    protected static string $resource = AppointmentResource::class;

    public function getTitle(): string
    {
        return 'Editar Turno';
    }

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make()
                ->label('Eliminar'),
        ];
    }

    protected function mutateFormDataBeforeSave(array $data): array
    {
        // Solo validar solapamiento si cambiaron las fechas, usuario o consultorio
        $datesChanged = $this->record->datetime_start->format('Y-m-d H:i:s') !== Carbon::parse($data['datetime_start'])->format('Y-m-d H:i:s') ||
                       $this->record->datetime_end->format('Y-m-d H:i:s') !== Carbon::parse($data['datetime_end'])->format('Y-m-d H:i:s');
        $userChanged = $this->record->user_id != $data['user_id'];
        
        if ($datesChanged || $userChanged) {
            // Validar que no haya solapamiento de turnos para el mismo usuario (excluyendo el turno actual)
            $hasOverlap = Appointment::where('user_id', $data['user_id'])
                ->where('id', '!=', $this->record->id)
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
            $startDate = Carbon::parse($data['datetime_start']);
            $endDate = Carbon::parse($data['datetime_end']);
            
            if ($endDate->lte($startDate)) {
                throw ValidationException::withMessages([
                    'datetime_end' => 'La fecha de fin debe ser posterior a la fecha de inicio.',
                ]);
            }
        }

        return $data;
    }

    protected function afterSave(): void
    {
        // Enviar notificación WhatsApp si el turno cambió a confirmado
        $originalStatus = $this->record->getOriginal('status');
        $isNowConfirmed = $this->record->status === 'confirmado';
        
        if ($originalStatus !== 'confirmado' && $isNowConfirmed && config('whatsapp.enabled', true)) {
            try {
                $this->record->refresh();
                \Illuminate\Support\Facades\Bus::dispatch(new AppointmentConfirmedNotification($this->record));
                FilamentNotification::make()
                    ->title('Notificación WhatsApp enviada')
                    ->success()
                    ->send();
            } catch (\Exception $e) {
                FilamentNotification::make()
                    ->title('Error al enviar WhatsApp')
                    ->body('El turno se actualizó pero no se pudo enviar la notificación: ' . $e->getMessage())
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
