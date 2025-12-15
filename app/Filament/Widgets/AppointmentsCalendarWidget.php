<?php

namespace App\Filament\Widgets;

use App\Filament\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\Patient;
use App\Models\User;
use Filament\Actions;
use Filament\Forms\Components\Select;
use Illuminate\Database\Eloquent\Model;
use Saade\FilamentFullCalendar\Widgets\FullCalendarWidget;
use Filament\Notifications\Notification;

class AppointmentsCalendarWidget extends FullCalendarWidget
{
    public Model | string | null $model = Appointment::class;

    protected static ?string $heading = 'Calendario de Turnos';

    public ?string $filter = null; // Filtro por consultorio (legacy)
    public ?int $filterUser = null; // Filtro por odontólogo
    public ?int $filterPatient = null; // Filtro por paciente
    public ?string $filterTipo = null; // Filtro por tipo

    protected $listeners = ['update-calendar-filters' => 'updateFilters'];

    public function updateFilters(array $filters): void
    {
        $this->filterUser = $filters['filterUser'] ?? null;
        $this->filterPatient = $filters['filterPatient'] ?? null;
        $this->filterTipo = $filters['filterTipo'] ?? null;
        
        // Refrescar eventos del calendario
        $this->refreshRecords();
    }

    public function headerActions(): array
    {
        return [
            Actions\CreateAction::make()
                ->label('Nuevo Turno')
                ->model(Appointment::class)
                ->url(AppointmentResource::getUrl('create')),
        ];
    }

    public function fetchEvents(array $fetchInfo): array
    {
        $query = Appointment::query()
            ->with(['patient', 'clinic', 'treatment', 'user'])
            ->whereBetween('datetime_start', [$fetchInfo['start'], $fetchInfo['end']]);

        // Filtro por consultorio (legacy)
        if ($this->filter) {
            $query->where('clinic_id', $this->filter);
        }

        // Filtro por odontólogo
        if ($this->filterUser) {
            $query->where('user_id', $this->filterUser);
        }

        // Filtro por paciente
        if ($this->filterPatient) {
            $query->where('patient_id', $this->filterPatient);
        }

        // Filtro por tipo
        if ($this->filterTipo) {
            $query->where('tipo', $this->filterTipo);
        }

        $appointments = $query->get();

        // Agrupar turnos por paciente, odontólogo y día para unificar consecutivos
        $grouped = $appointments->groupBy(function ($appointment) {
            $date = \Carbon\Carbon::parse($appointment->datetime_start)->format('Y-m-d');
            return $appointment->patient_id . '|' . $appointment->user_id . '|' . $date;
        });

        $events = [];

        foreach ($grouped as $group) {
            // Ordenar por hora de inicio
            $sorted = $group->sortBy('datetime_start')->values();
            
            $mergedRanges = [];
            $currentRange = null;

            foreach ($sorted as $appointment) {
                $start = \Carbon\Carbon::parse($appointment->datetime_start);
                $end = \Carbon\Carbon::parse($appointment->datetime_end);

                if ($currentRange === null) {
                    // Iniciar un nuevo rango
                    $currentRange = [
                        'start' => $start,
                        'end' => $end,
                        'appointments' => [$appointment],
                    ];
                } else {
                    // Verificar si este turno es consecutivo al anterior
                    // Calculamos la diferencia: si start es después de currentRange['end'], el valor es positivo
                    // Si start es antes o igual a currentRange['end'], el valor es negativo o cero (solapamiento/consecutivo)
                    $gapMinutes = $start->diffInMinutes($currentRange['end'], false);
                    
                    // Unificar si el gap es <= 30 minutos (incluye consecutivos exactos, solapamientos y gaps pequeños)
                    // El segundo parámetro false hace que devuelva el valor con signo
                    if ($gapMinutes <= 30) {
                        // Es consecutivo o se solapa, extender el rango
                        if ($end->isAfter($currentRange['end'])) {
                            $currentRange['end'] = $end;
                        }
                        $currentRange['appointments'][] = $appointment;
                    } else {
                        // No es consecutivo, guardar el rango actual y empezar uno nuevo
                        $mergedRanges[] = $currentRange;
                        $currentRange = [
                            'start' => $start,
                            'end' => $end,
                            'appointments' => [$appointment],
                        ];
                    }
                }
            }

            // Agregar el último rango
            if ($currentRange !== null) {
                $mergedRanges[] = $currentRange;
            }

            // Crear eventos para cada rango unificado
            foreach ($mergedRanges as $range) {
                $firstAppointment = $range['appointments'][0];
                
                // Color de fondo según el tipo (no según estado)
                $backgroundColor = '#6b7280'; // gris por defecto
                if ($firstAppointment->tipo === 'cirugia') {
                    $backgroundColor = '#ef4444'; // rojo
                } elseif ($firstAppointment->tipo === 'trabajo_laboratorio') {
                    $backgroundColor = '#fbbf24'; // amarillo
                }

                // Formatear horas del rango unificado
                $startTime = $range['start']->format('H:i');
                $endTime = $range['end']->format('H:i');
                
                // Título solo con el nombre del paciente
                $title = $firstAppointment->patient->full_name;

                // Combinar notas de todos los turnos unificados
                $notes = collect($range['appointments'])
                    ->pluck('notes')
                    ->filter()
                    ->unique()
                    ->implode(' | ');

                $events[] = [
                    'id' => 'merged_' . $range['appointments'][0]->id,
                    'title' => '', // Título vacío para evitar que FullCalendar lo muestre automáticamente
                    'start' => $range['start']->toDateTimeString(),
                    'end' => $range['end']->toDateTimeString(),
                    'backgroundColor' => $backgroundColor,
                    'borderColor' => $backgroundColor,
                    'display' => 'block',
                    'extendedProps' => [
                        'patient' => $firstAppointment->patient->full_name,
                        'clinic' => $firstAppointment->clinic->name,
                        'treatment' => $firstAppointment->treatment?->name,
                        'user' => $firstAppointment->user->name,
                        'status' => $firstAppointment->status,
                        'tipo' => $firstAppointment->tipo,
                        'notes' => $notes ?: $firstAppointment->notes,
                        'appointment_ids' => collect($range['appointments'])->pluck('id')->toArray(),
                        'timeRange' => $startTime . ' - ' . $endTime,
                    ],
                ];
            }
        }

        return $events;
    }

    public function config(): array
    {
        return [
            'firstDay' => 1, // Lunes
            'locale' => 'es',
            'initialView' => 'dayGridMonth',
            'headerToolbar' => [
                'left' => 'prev,next today',
                'center' => 'title',
                'right' => 'dayGridMonth,timeGridWeek,timeGridDay',
            ],
            'editable' => false,
            'selectable' => true,
            'selectMirror' => true,
            'dayMaxEvents' => true,
            'displayEventTime' => false,
            'displayEventEnd' => false,
            // Horario laboral: de 9:00 a 20:00
            'slotMinTime' => '09:00:00',
            'slotMaxTime' => '20:00:00',
            'slotDuration' => '00:30:00', // Duración de cada slot (30 minutos)
            'snapDuration' => '00:30:00', // Snap cada 30 minutos
            'slotLabelInterval' => '01:00:00', // Mostrar etiquetas cada hora
            'slotLabelFormat' => [
                'hour' => '2-digit',
                'minute' => '2-digit',
                'omitZeroMinute' => true,
                'meridiem' => 'short',
            ],
            'height' => 'auto',
            'contentHeight' => 'auto',
            'expandRows' => true, // Expandir filas para que los eventos ocupen más espacio vertical
            'slotMinHeight' => 60, // Altura mínima de cada slot en pixels (más espacio para mejor lectura)
            'allDaySlot' => false, // Ocultar slot "Todo el día"
        ];
    }

    public function eventContent(): string
    {
        return <<<JS
            function(arg) {
                const event = arg.event;
                const view = arg.view;
                const status = event.extendedProps.status;
                const patientName = event.extendedProps.patient || '';
                const timeRange = event.extendedProps.timeRange || '';
                
                // Iconos SVG de Heroicons según el estado - Con estilos inline para mejor control
                let iconSvg = '';
                const iconStyle = 'width: 18px; height: 18px; flex-shrink: 0; display: block;';
                
                if (status === 'confirmado') {
                    iconSvg = '<svg style="' + iconStyle + '" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
                } else if (status === 'asistio') {
                    iconSvg = '<svg style="' + iconStyle + '" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>';
                } else if (status === 'cancelado') {
                    iconSvg = '<svg style="' + iconStyle + '" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
                } else if (status === 'no_asistio') {
                    iconSvg = '<svg style="' + iconStyle + '" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>';
                } else {
                    iconSvg = '<svg style="' + iconStyle + '" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
                }
                
                // Detectar tipo de vista
                const isDayView = view.type === 'timeGridDay';
                const isWeekView = view.type === 'timeGridWeek';
                const isMonthView = view.type === 'dayGridMonth';
                
                // Formatear horario de forma más compacta (sin espacios para ahorrar espacio)
                const compactTime = timeRange.replace(/\s+/g, '');
                
                // Rediseño completo UX/UI profesional: Vista día con diseño limpio y claro
                if (isDayView) {
                    // VISTA DÍA: Layout horizontal optimizado - Nombre y horario siempre visibles
                    // Diseño profesional: Icono (fijo) + Nombre (flexible) + Horario (fijo, destacado)
                    return {
                        html: '<div style="display: flex; flex-direction: row; align-items: center; width: 100%; height: 100%; padding: 9px 12px; box-sizing: border-box; cursor: pointer; gap: 10px; overflow: hidden;">' +
                              '<div style="display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 20px; height: 20px; min-width: 20px; overflow: visible;">' + iconSvg + '</div>' +
                              '<div style="display: flex; align-items: center; flex: 1; min-width: 0; overflow: hidden; gap: 12px;">' +
                              '<span style="font-size: 14px; font-weight: 600; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0; line-height: 1.5;">' + patientName + '</span>' +
                              '<span style="font-size: 11px; font-weight: 600; color: rgba(255, 255, 255, 0.9); white-space: nowrap; flex-shrink: 0; padding: 4px 10px; background: rgba(0, 0, 0, 0.8); border-radius: 10px; letter-spacing: 0.5px; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif;">' + timeRange + '</span>' +
                              '</div>' +
                              '</div>'
                    };
                } else if (isWeekView) {
                    // VISTA SEMANA: Nombre más visible, horario compacto al lado
                    return {
                        html: '<div style="display: flex; align-items: center; justify-content: space-between; width: 100%; height: 100%; padding: 4px 5px; box-sizing: border-box; cursor: pointer; gap: 6px;">' +
                              '<div style="display: flex; align-items: center; font-size: 12px; font-weight: 600; line-height: 1.3; flex: 1; min-width: 0; overflow: hidden;">' + 
                              iconSvg + '<span style="margin-left: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0;">' + patientName + '</span>' +
                              '</div>' +
                              '<div style="display: flex; align-items: center; flex-shrink: 0; font-size: 9px; font-weight: 500; color: rgba(255, 255, 255, 0.7); white-space: nowrap; letter-spacing: 0.2px;">' + compactTime + '</div>' +
                              '</div>'
                    };
                } else {
                    // VISTA MES: Nombre prioritario (más espacio), horario muy compacto
                    return {
                        html: '<div style="display: flex; align-items: center; justify-content: space-between; width: 100%; height: 100%; padding: 3px 4px; box-sizing: border-box; cursor: pointer; gap: 4px;">' +
                              '<div style="display: flex; align-items: center; font-size: 11px; font-weight: 600; line-height: 1.2; flex: 1; min-width: 0; overflow: hidden;">' + 
                              iconSvg + '<span style="margin-left: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0;">' + patientName + '</span>' +
                              '</div>' +
                              '<div style="display: flex; align-items: center; flex-shrink: 0; font-size: 8px; font-weight: 500; color: rgba(255, 255, 255, 0.65); white-space: nowrap; letter-spacing: 0.2px; opacity: 0.9;">' + compactTime + '</div>' +
                              '</div>'
                    };
                }
            }
        JS;
    }

    public function eventDidMount(): string
    {
        return <<<JS
            function({ event, el, view }) {
                // Optimización UX/UI: Asegurar diseño profesional y contenido siempre visible
                
                if (view.type === 'timeGridDay') {
                    // Vista día: Asegurar que todo esté contenido y se vea profesional
                    el.style.overflow = 'hidden';
                    el.style.borderRadius = '6px';
                    
                    // Sombras sutiles para profundidad
                    el.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)';
                    
                    // Asegurar que el contenedor principal mantenga todo dentro
                    const mainContainer = el.querySelector('div[style*="flex-direction: row"]');
                    if (mainContainer) {
                        mainContainer.style.overflow = 'hidden';
                        mainContainer.style.width = '100%';
                        mainContainer.style.height = '100%';
                    }
                    
                    // Asegurar que el icono no se corte
                    const iconContainer = el.querySelector('div[style*="min-width: 20px"]');
                    if (iconContainer) {
                        iconContainer.style.overflow = 'visible';
                    }
                    
                    // Asegurar que el nombre tenga ellipsis si es necesario
                    const nameSpan = el.querySelector('span[style*="text-overflow: ellipsis"]');
                    if (nameSpan) {
                        nameSpan.style.overflow = 'hidden';
                        nameSpan.style.textOverflow = 'ellipsis';
                    }
                    
                    // Asegurar que el horario siempre sea visible y no se corte
                    const timeSpan = el.querySelector('span[style*="background: rgba(255, 255, 255, 0.15)"]');
                    if (timeSpan) {
                        timeSpan.style.whiteSpace = 'nowrap';
                        timeSpan.style.flexShrink = '0';
                        timeSpan.style.overflow = 'visible';
                    }
                } else {
                    // Otras vistas: Mantener overflow controlado
                    el.style.overflow = 'hidden';
                    el.style.borderRadius = '4px';
                }
            }
        JS;
    }

    public ?int $selectedAppointmentId = null;

    public function viewAppointment($appointmentId): void
    {
        // Manejar IDs unificados (merged_X) o IDs normales
        if (is_string($appointmentId) && str_starts_with($appointmentId, 'merged_')) {
            // Extraer el ID real del primer appointment
            $appointmentId = (int) str_replace('merged_', '', $appointmentId);
        }
        
        $this->selectedAppointmentId = (int) $appointmentId;
        $this->mountAction('viewAppointmentDetails');
    }

    public function viewAppointmentDetailsAction(): Actions\Action
    {
        return Actions\Action::make('viewAppointmentDetails')
            ->label('Detalles del Turno')
            ->modalHeading(fn () => 'Detalles del Turno')
            ->modalWidth('3xl')
            ->modalContent(function () {
                $appointment = Appointment::with(['patient', 'clinic', 'treatment', 'user'])
                    ->find($this->selectedAppointmentId);
                
                if (!$appointment) {
                    return view('filament.widgets.appointment-not-found');
                }

                return view('filament.widgets.appointment-details', [
                    'appointment' => $appointment,
                ]);
            })
            ->modalSubmitAction(false)
            ->modalCancelActionLabel('Cerrar')
            ->extraModalFooterActions([
                Actions\Action::make('edit')
                    ->label('Editar')
                    ->url(fn () => AppointmentResource::getUrl('edit', ['record' => $this->selectedAppointmentId]))
                    ->button(),
            ]);
    }

    protected function getActions(): array
    {
        return [
            $this->viewAppointmentDetailsAction(),
        ];
    }

    public function onEventClick(array $event): void
    {
        $eventId = $event['id'] ?? null;
        
        if ($eventId) {
            $this->viewAppointment($eventId);
        }
    }


}

