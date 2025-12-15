<?php

namespace App\Filament\Resources\AppointmentResource\Pages;

use App\Filament\Resources\AppointmentResource;
use App\Filament\Widgets\AppointmentsCalendarWidget;
use App\Models\Patient;
use App\Models\User;
use Filament\Actions;
use Filament\Forms;
use Filament\Forms\Components\Select;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Resources\Pages\Page;

class CalendarAppointments extends Page implements HasForms
{
    use InteractsWithForms;

    protected static string $resource = AppointmentResource::class;

    protected static string $view = 'filament.resources.appointment-resource.pages.calendar-appointments';

    protected static ?string $title = 'Calendario de Turnos';

    protected static ?string $navigationLabel = 'Calendario';

    public ?int $filterUser = null;
    public ?int $filterPatient = null;
    public ?string $filterTipo = null;

    public function mount(): void
    {
        $this->form->fill([
            'filterUser' => $this->filterUser,
            'filterPatient' => $this->filterPatient,
            'filterTipo' => $this->filterTipo,
        ]);
    }

    protected function getFormSchema(): array
    {
        return [
            Forms\Components\Section::make('Filtros')
                ->schema([
                    Forms\Components\Grid::make(3)
                        ->schema([
                            Select::make('filterUser')
                                ->label('Odontólogo')
                                ->options(User::query()->pluck('name', 'id'))
                                ->searchable()
                                ->preload()
                                ->placeholder('Todos los odontólogos')
                                ->live()
                                ->afterStateUpdated(function ($state) {
                                    $this->filterUser = $state ? (int)$state : null;
                                    $this->dispatch('update-calendar-filters', [
                                        'filterUser' => $this->filterUser,
                                        'filterPatient' => $this->filterPatient,
                                        'filterTipo' => $this->filterTipo,
                                    ])->to(AppointmentsCalendarWidget::class);
                                }),
                            
                            Select::make('filterPatient')
                                ->label('Paciente')
                                ->options(function () {
                                    return Patient::query()
                                        ->get()
                                        ->mapWithKeys(fn ($patient) => [$patient->id => $patient->full_name])
                                        ->toArray();
                                })
                                ->searchable()
                                ->preload()
                                ->placeholder('Todos los pacientes')
                                ->live()
                                ->afterStateUpdated(function ($state) {
                                    $this->filterPatient = $state ? (int)$state : null;
                                    $this->dispatch('update-calendar-filters', [
                                        'filterUser' => $this->filterUser,
                                        'filterPatient' => $this->filterPatient,
                                        'filterTipo' => $this->filterTipo,
                                    ])->to(AppointmentsCalendarWidget::class);
                                }),
                            
                            Select::make('filterTipo')
                                ->label('Tipo')
                                ->options([
                                    'normal' => 'Normal',
                                    'cirugia' => 'Cirugía',
                                    'trabajo_laboratorio' => 'Trabajo de Laboratorio',
                                ])
                                ->placeholder('Todos los tipos')
                                ->live()
                                ->afterStateUpdated(function ($state) {
                                    $this->filterTipo = $state;
                                    $this->dispatch('update-calendar-filters', [
                                        'filterUser' => $this->filterUser,
                                        'filterPatient' => $this->filterPatient,
                                        'filterTipo' => $this->filterTipo,
                                    ])->to(AppointmentsCalendarWidget::class);
                                }),
                        ]),
                ])
                ->collapsible()
                ->collapsed(false),
        ];
    }

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make()
                ->label('Nuevo Turno'),
        ];
    }

    public function getWidgets(): array
    {
        return [
            AppointmentsCalendarWidget::class,
        ];
    }
}

