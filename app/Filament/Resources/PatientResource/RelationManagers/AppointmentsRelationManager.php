<?php

namespace App\Filament\Resources\PatientResource\RelationManagers;

use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class AppointmentsRelationManager extends RelationManager
{
    protected static string $relationship = 'appointments';

    protected static ?string $title = 'Historial de Turnos';

    protected static ?string $label = 'Turno';

    protected static ?string $pluralLabel = 'Turnos';

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                // El formulario se maneja desde AppointmentResource
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('datetime_start')
            ->columns([
                Tables\Columns\TextColumn::make('datetime_start')
                    ->label('Fecha y Hora')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
                Tables\Columns\TextColumn::make('treatment.name')
                    ->label('Tratamiento')
                    ->badge()
                    ->color('info')
                    ->sortable(),
                Tables\Columns\TextColumn::make('clinic.name')
                    ->label('Consultorio')
                    ->sortable(),
                Tables\Columns\TextColumn::make('user.name')
                    ->label('Odontólogo')
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
                    ])
                    ->sortable(),
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
                    ->sortable(),
                Tables\Columns\TextColumn::make('notes')
                    ->label('Notas')
                    ->limit(30)
                    ->tooltip(fn ($record) => $record->notes)
                    ->toggleable(),
            ])
            ->filters([
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
            ->headerActions([
                Tables\Actions\CreateAction::make()
                    ->label('Nuevo Turno')
                    ->url(fn () => \App\Filament\Resources\AppointmentResource::getUrl('create', ['patient_id' => $this->ownerRecord->id])),
            ])
            ->actions([
                Tables\Actions\EditAction::make()
                    ->url(fn ($record) => \App\Filament\Resources\AppointmentResource::getUrl('edit', ['record' => $record])),
            ])
            ->defaultSort('datetime_start', 'desc')
            ->emptyStateHeading('Sin turnos registrados')
            ->emptyStateDescription('Este paciente aún no tiene turnos registrados.');
    }
}
