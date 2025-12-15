<?php

namespace App\Filament\Resources\PatientResource\RelationManagers;

use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class MedicalRecordsRelationManager extends RelationManager
{
    protected static string $relationship = 'medicalRecords';

    protected static ?string $title = 'Historia Clínica';

    protected static ?string $label = 'Registro Médico';

    protected static ?string $pluralLabel = 'Registros Médicos';

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\DatePicker::make('record_date')
                    ->label('Fecha del Tratamiento')
                    ->default(now())
                    ->required(),
                Forms\Components\Select::make('treatment_id')
                    ->label('Tratamiento Realizado')
                    ->relationship('treatment', 'name')
                    ->searchable()
                    ->preload()
                    ->placeholder('Seleccionar tratamiento (opcional)')
                    ->helperText('Selecciona el tratamiento realizado en esta fecha'),
                Forms\Components\RichEditor::make('notes')
                    ->label('Notas de Evolución')
                    ->required()
                    ->columnSpanFull()
                    ->helperText('Registra las observaciones, diagnóstico, procedimiento realizado, etc.'),
                Forms\Components\FileUpload::make('attachments')
                    ->label('Archivos Adjuntos')
                    ->multiple()
                    ->directory('medical-records')
                    ->acceptedFileTypes(['image/*', 'application/pdf'])
                    ->maxFiles(5)
                    ->preserveFilenames()
                    ->columnSpanFull(),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('record_date')
            ->columns([
                Tables\Columns\TextColumn::make('record_date')
                    ->label('Fecha')
                    ->date('d/m/Y')
                    ->sortable(),
                Tables\Columns\TextColumn::make('treatment.name')
                    ->label('Tratamiento')
                    ->badge()
                    ->color('success')
                    ->default('—')
                    ->sortable(),
                Tables\Columns\TextColumn::make('notes')
                    ->label('Notas')
                    ->limit(50)
                    ->html()
                    ->wrap(),
                Tables\Columns\TextColumn::make('user.name')
                    ->label('Registrado por')
                    ->default('N/A'),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Creado')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\Filter::make('record_date')
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
                                fn (Builder $query, $date): Builder => $query->whereDate('record_date', '>=', $date),
                            )
                            ->when(
                                $data['until'],
                                fn (Builder $query, $date): Builder => $query->whereDate('record_date', '<=', $date),
                            );
                    }),
            ])
            ->headerActions([
                Tables\Actions\CreateAction::make()
                    ->mutateFormDataUsing(function (array $data): array {
                        $data['user_id'] = auth()->id();
                        return $data;
                    }),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('record_date', 'desc');
    }
}
