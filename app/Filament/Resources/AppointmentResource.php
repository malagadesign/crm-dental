<?php

namespace App\Filament\Resources;

use App\Filament\Resources\AppointmentResource\Pages;
use App\Filament\Resources\AppointmentResource\RelationManagers;
use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\Patient;
use App\Models\Treatment;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;
use Illuminate\Validation\Rule;

class AppointmentResource extends Resource
{
    protected static ?string $model = Appointment::class;

    protected static ?string $navigationIcon = 'heroicon-o-calendar-days';

    protected static ?string $navigationLabel = 'Turnos';

    protected static ?string $modelLabel = 'Turno';

    protected static ?string $pluralModelLabel = 'Turnos';

    /**
     * Tanto admins como secretarias pueden ver y gestionar turnos
     */
    public static function canViewAny(): bool
    {
        return auth()->check();
    }

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Información del Turno')
                    ->schema([
                        Forms\Components\Select::make('patient_id')
                            ->label('Paciente')
                            ->relationship('patient', 'first_name')
                            ->getOptionLabelUsing(fn ($value): ?string => \App\Models\Patient::find($value)?->full_name)
                            ->searchable(['first_name', 'last_name', 'dni'])
                            ->preload()
                            ->required(),
                        Forms\Components\Select::make('clinic_id')
                            ->label('Consultorio')
                            ->relationship('clinic', 'name')
                            ->searchable()
                            ->preload()
                            ->required()
                            ->live(),
                        Forms\Components\Select::make('treatment_id')
                            ->label('Tratamiento')
                            ->relationship('treatment', 'name')
                            ->searchable()
                            ->preload(),
                        Forms\Components\Select::make('user_id')
                            ->label('Odontólogo')
                            ->relationship('user', 'name')
                            ->searchable()
                            ->preload()
                            ->required(),
                        Forms\Components\DateTimePicker::make('datetime_start')
                            ->label('Fecha y Hora de Inicio')
                            ->required()
                            ->native(false)
                            ->displayFormat('d/m/Y H:i')
                            ->seconds(false)
                            ->live()
                            ->afterStateUpdated(function ($state, callable $set, $get) {
                                $treatmentId = $get('treatment_id');
                                if ($treatmentId && $state) {
                                    $treatment = Treatment::find($treatmentId);
                                    if ($treatment) {
                                        $endTime = \Carbon\Carbon::parse($state)
                                            ->addMinutes($treatment->duration_minutes);
                                        $set('datetime_end', $endTime);
                                    }
                                }
                            }),
                        Forms\Components\DateTimePicker::make('datetime_end')
                            ->label('Fecha y Hora de Fin')
                            ->required()
                            ->native(false)
                            ->displayFormat('d/m/Y H:i')
                            ->seconds(false),
                        Forms\Components\Select::make('status')
                            ->label('Estado')
                            ->options([
                                'confirmado' => 'Confirmado',
                                'cancelado' => 'Cancelado',
                                'asistio' => 'Asistió',
                                'no_asistio' => 'No Asistió',
                            ])
                            ->default('confirmado')
                            ->required()
                            ->native(false),
                        Forms\Components\Select::make('tipo')
                            ->label('Tipo de Turno')
                            ->options([
                                'normal' => 'Normal',
                                'cirugia' => 'Cirugía',
                                'trabajo_laboratorio' => 'Trabajo de Laboratorio',
                            ])
                            ->default('normal')
                            ->native(false)
                            ->helperText('Selecciona el tipo de procedimiento para identificar visualmente en el calendario'),
                        Forms\Components\Textarea::make('notes')
                            ->label('Notas')
                            ->placeholder('Notas adicionales sobre el turno...')
                            ->rows(3),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('patient.full_name')
                    ->label('Paciente')
                    ->searchable(['patient.first_name', 'patient.last_name'])
                    ->sortable(),
                Tables\Columns\TextColumn::make('clinic.name')
                    ->label('Consultorio')
                    ->sortable(),
                Tables\Columns\TextColumn::make('treatment.name')
                    ->label('Tratamiento')
                    ->sortable(),
                Tables\Columns\TextColumn::make('user.name')
                    ->label('Odontólogo')
                    ->sortable(),
                Tables\Columns\TextColumn::make('datetime_start')
                    ->label('Fecha y Hora')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
                Tables\Columns\BadgeColumn::make('status')
                    ->label('Estado')
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'confirmado' => 'Confirmado',
                        'cancelado' => 'Cancelado',
                        'asistio' => 'Asistió',
                        'no_asistio' => 'No Asistió',
                    })
                    ->colors([
                        'success' => 'confirmado',
                        'warning' => 'asistio',
                        'danger' => 'cancelado',
                        'gray' => 'no_asistio',
                    ]),
                Tables\Columns\BadgeColumn::make('tipo')
                    ->label('Tipo')
                    ->formatStateUsing(fn (?string $state): string => match ($state) {
                        'cirugia' => 'Cirugía',
                        'trabajo_laboratorio' => 'Trabajo de Laboratorio',
                        default => 'Normal',
                    })
                    ->colors([
                        'danger' => 'cirugia',
                        'warning' => 'trabajo_laboratorio',
                        'gray' => 'normal',
                    ])
                    ->default('normal'),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('clinic_id')
                    ->label('Consultorio')
                    ->relationship('clinic', 'name'),
                Tables\Filters\SelectFilter::make('user_id')
                    ->label('Odontólogo')
                    ->relationship('user', 'name'),
                Tables\Filters\SelectFilter::make('status')
                    ->label('Estado')
                    ->options([
                        'confirmado' => 'Confirmado',
                        'cancelado' => 'Cancelado',
                        'asistio' => 'Asistió',
                        'no_asistio' => 'No Asistió',
                    ]),
                Tables\Filters\SelectFilter::make('tipo')
                    ->label('Tipo')
                    ->options([
                        'normal' => 'Normal',
                        'cirugia' => 'Cirugía',
                        'trabajo_laboratorio' => 'Trabajo de Laboratorio',
                    ]),
                Tables\Filters\Filter::make('datetime_start')
                    ->form([
                        Forms\Components\DatePicker::make('from')
                            ->label('Desde'),
                        Forms\Components\DatePicker::make('until')
                            ->label('Hasta'),
                    ])
                    ->query(function (Builder $query, array $data): Builder {
                        return $query
                            ->when(
                                $data['from'],
                                fn (Builder $query, $date): Builder => $query->whereDate('datetime_start', '>=', $date),
                            )
                            ->when(
                                $data['until'],
                                fn (Builder $query, $date): Builder => $query->whereDate('datetime_start', '<=', $date),
                            );
                    }),
            ])
            ->actions([
                Tables\Actions\Action::make('send_whatsapp')
                    ->label('Enviar WhatsApp')
                    ->icon('heroicon-o-chat-bubble-left-right')
                    ->color('success')
                    ->visible(fn (Appointment $record) => $record->patient->phone && config('whatsapp.enabled', true))
                    ->requiresConfirmation()
                    ->modalHeading('Enviar confirmación por WhatsApp')
                    ->modalDescription(fn (Appointment $record) => "¿Enviar confirmación de turno a {$record->patient->full_name}?")
                    ->action(function (Appointment $record) {
                        try {
                            \Illuminate\Support\Facades\Bus::dispatch(new \App\Notifications\AppointmentConfirmedNotification($record));
                            \Filament\Notifications\Notification::make()
                                ->title('WhatsApp enviado exitosamente')
                                ->success()
                                ->send();
                        } catch (\Exception $e) {
                            \Filament\Notifications\Notification::make()
                                ->title('Error al enviar WhatsApp')
                                ->body($e->getMessage())
                                ->danger()
                                ->send();
                        }
                    }),
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('datetime_start', 'desc');
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListAppointments::route('/'),
            'calendar' => Pages\CalendarAppointments::route('/calendar'),
            'create' => Pages\CreateAppointment::route('/create'),
            'edit' => Pages\EditAppointment::route('/{record}/edit'),
        ];
    }
}
