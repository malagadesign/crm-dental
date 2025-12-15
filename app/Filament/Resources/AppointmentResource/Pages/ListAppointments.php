<?php

namespace App\Filament\Resources\AppointmentResource\Pages;

use App\Filament\Resources\AppointmentResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListAppointments extends ListRecords
{
    protected static string $resource = AppointmentResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\Action::make('calendar')
                ->label('Ver Calendario')
                ->icon('heroicon-o-calendar-days')
                ->url(static::getResource()::getUrl('calendar')),
            Actions\CreateAction::make()
                ->label('Nuevo Turno'),
        ];
    }
}
