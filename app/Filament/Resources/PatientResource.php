<?php

namespace App\Filament\Resources;

use App\Filament\Resources\PatientResource\Pages;
use App\Filament\Resources\PatientResource\RelationManagers;
use App\Models\Patient;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class PatientResource extends Resource
{
    protected static ?string $model = Patient::class;

    protected static ?string $navigationIcon = 'heroicon-o-user-group';

    protected static ?string $navigationLabel = 'Pacientes';

    protected static ?string $modelLabel = 'Paciente';

    protected static ?string $pluralModelLabel = 'Pacientes';

    /**
     * Verificar si el recurso puede ser visto en el menú de navegación
     */
    public static function canViewAny(): bool
    {
        return auth()->check(); // Tanto admins como secretarias pueden ver pacientes
    }

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Escaneo de DNI (Opcional)')
                    ->description('Toma o sube fotos del frente y dorso del DNI para llenar automáticamente los datos')
                    ->schema([
                        Forms\Components\FileUpload::make('dni_front')
                            ->label('Foto del Frente del DNI')
                            ->image()
                            ->imageEditor()
                            ->directory('dni-scans')
                            ->visibility('private')
                            ->acceptedFileTypes(['image/jpeg', 'image/jpg', 'image/png'])
                            ->maxSize(5120) // 5MB
                            ->helperText('Toma o sube una foto clara del frente del DNI')
                            ->dehydrated(false) // No guardar en la base de datos
                            ->columnSpan(1),
                        Forms\Components\FileUpload::make('dni_back')
                            ->label('Foto del Dorso del DNI')
                            ->image()
                            ->imageEditor()
                            ->directory('dni-scans')
                            ->visibility('private')
                            ->acceptedFileTypes(['image/jpeg', 'image/jpg', 'image/png'])
                            ->maxSize(5120) // 5MB
                            ->helperText('Toma o sube una foto clara del dorso del DNI')
                            ->dehydrated(false) // No guardar en la base de datos
                            ->columnSpan(1),
                        Forms\Components\Actions::make([
                            Forms\Components\Actions\Action::make('process_dni')
                                ->label('Procesar DNI con OCR')
                                ->icon('heroicon-o-sparkles')
                                ->color('primary')
                                ->requiresConfirmation()
                                ->modalHeading('Procesar DNI')
                                ->modalDescription('¿Deseas procesar las imágenes del DNI para extraer los datos automáticamente?')
                                ->action(function ($livewire, $get) {
                                    $frontImage = $get('dni_front');
                                    $backImage = $get('dni_back');
                                    
                                    if (!$frontImage && !$backImage) {
                                        \Filament\Notifications\Notification::make()
                                            ->title('Error')
                                            ->body('Debes subir al menos una imagen del DNI (frente o dorso)')
                                            ->danger()
                                            ->send();
                                        return;
                                    }
                                    
                                    // Procesar con OCR
                                    try {
                                        $ocrService = app(\App\Services\DniOcrService::class);
                                        
                                        $frontFile = null;
                                        $backFile = null;
                                        
                                        if ($frontImage) {
                                            $frontPath = \Illuminate\Support\Facades\Storage::disk('public')->path($frontImage);
                                            $frontFile = new \Illuminate\Http\UploadedFile(
                                                $frontPath,
                                                basename($frontPath),
                                                mime_content_type($frontPath),
                                                null,
                                                true
                                            );
                                        }
                                        
                                        if ($backImage) {
                                            $backPath = \Illuminate\Support\Facades\Storage::disk('public')->path($backImage);
                                            $backFile = new \Illuminate\Http\UploadedFile(
                                                $backPath,
                                                basename($backPath),
                                                mime_content_type($backPath),
                                                null,
                                                true
                                            );
                                        }
                                        
                                        $data = $ocrService->extractFromImages($frontFile, $backFile);
                                        
                                        // Rellenar campos del formulario
                                        $filled = [];
                                        if (!empty($data['first_name'])) {
                                            $livewire->data['first_name'] = $data['first_name'];
                                            $filled[] = 'nombre';
                                        }
                                        if (!empty($data['last_name'])) {
                                            $livewire->data['last_name'] = $data['last_name'];
                                            $filled[] = 'apellido';
                                        }
                                        if (!empty($data['dni'])) {
                                            $livewire->data['dni'] = $data['dni'];
                                            $filled[] = 'DNI';
                                        }
                                        if (!empty($data['birth_date'])) {
                                            $livewire->data['birth_date'] = $data['birth_date'];
                                            $filled[] = 'fecha de nacimiento';
                                        }
                                        if (!empty($data['address'])) {
                                            $livewire->data['address'] = $data['address'];
                                            $filled[] = 'dirección';
                                        }
                                        
                                        if (!empty($filled)) {
                                            \Filament\Notifications\Notification::make()
                                                ->title('Datos extraídos')
                                                ->body('Se extrajeron: ' . implode(', ', $filled) . '. Revisa y completa los campos faltantes.')
                                                ->success()
                                                ->send();
                                        } else {
                                            \Filament\Notifications\Notification::make()
                                                ->title('Sin datos extraídos')
                                                ->body('No se pudieron extraer datos de las imágenes. Verifica que las fotos sean claras y estén bien enfocadas.')
                                                ->warning()
                                                ->send();
                                        }
                                    } catch (\Exception $e) {
                                        \Filament\Notifications\Notification::make()
                                            ->title('Error')
                                            ->body('Error al procesar el DNI: ' . $e->getMessage())
                                            ->danger()
                                            ->send();
                                    }
                                }),
                        ])
                        ->columnSpanFull(),
                    ])
                    ->columns(2)
                    ->collapsible()
                    ->collapsed(),
                Forms\Components\Section::make('Datos Personales')
                    ->schema([
                        Forms\Components\TextInput::make('first_name')
                            ->label('Nombre')
                            ->required()
                            ->maxLength(255),
                        Forms\Components\TextInput::make('last_name')
                            ->label('Apellido')
                            ->required()
                            ->maxLength(255),
                        Forms\Components\TextInput::make('dni')
                            ->label('DNI')
                            ->unique(ignoreRecord: true)
                            ->maxLength(255),
                        Forms\Components\DatePicker::make('birth_date')
                            ->label('Fecha de Nacimiento'),
                    ])
                    ->columns(2),
                Forms\Components\Section::make('Contacto')
                    ->schema([
                        Forms\Components\TextInput::make('phone')
                            ->label('Teléfono')
                            ->tel()
                            ->maxLength(255),
                        Forms\Components\TextInput::make('email')
                            ->label('Email')
                            ->email()
                            ->maxLength(255),
                        Forms\Components\Textarea::make('address')
                            ->label('Dirección')
                            ->rows(2),
                    ])
                    ->columns(2),
                Forms\Components\Section::make('Información Adicional')
                    ->schema([
                        Forms\Components\Select::make('origin')
                            ->label('Origen')
                            ->options([
                                'instagram' => 'Instagram',
                                'recomendacion' => 'Recomendación',
                                'google' => 'Google',
                                'otro' => 'Otro',
                            ])
                            ->default('otro')
                            ->required(),
                        Forms\Components\Textarea::make('notes')
                            ->label('Notas')
                            ->rows(3),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('full_name')
                    ->label('Nombre Completo')
                    ->searchable(['first_name', 'last_name'])
                    ->sortable(query: function (Builder $query, string $direction): Builder {
                        return $query->orderBy('last_name', $direction)
                                     ->orderBy('first_name', $direction);
                    }),
                Tables\Columns\TextColumn::make('dni')
                    ->label('DNI')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('phone')
                    ->label('Teléfono')
                    ->searchable(),
                Tables\Columns\TextColumn::make('email')
                    ->label('Email')
                    ->searchable(),
                Tables\Columns\BadgeColumn::make('origin')
                    ->label('Origen')
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'instagram' => 'Instagram',
                        'recomendacion' => 'Recomendación',
                        'google' => 'Google',
                        default => 'Otro',
                    })
                    ->colors([
                        'primary' => 'instagram',
                        'success' => 'recomendacion',
                        'warning' => 'google',
                        'gray' => 'otro',
                    ]),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Fecha de Registro')
                    ->dateTime('d/m/Y')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('origin')
                    ->label('Origen')
                    ->options([
                        'instagram' => 'Instagram',
                        'recomendacion' => 'Recomendación',
                        'google' => 'Google',
                        'otro' => 'Otro',
                    ]),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                    Tables\Actions\BulkAction::make('unify')
                        ->label('Unificar Pacientes Seleccionados')
                        ->icon('heroicon-o-arrow-path')
                        ->color('warning')
                        ->requiresConfirmation()
                        ->modalHeading('Unificar Pacientes Duplicados')
                        ->modalDescription('Los pacientes seleccionados se unificarán en uno solo. Se conservará el registro más completo y se moverán todos los turnos y registros médicos al paciente principal.')
                        ->modalSubmitActionLabel('Unificar')
                        ->action(function ($records) {
                            $patients = $records->toArray();
                            
                            if (count($patients) < 2) {
                                \Filament\Notifications\Notification::make()
                                    ->title('Error')
                                    ->body('Debes seleccionar al menos 2 pacientes para unificar.')
                                    ->danger()
                                    ->send();
                                return;
                            }
                            
                            // Seleccionar el paciente principal (más completo)
                            $main = collect($patients)->sortByDesc(function ($patient) {
                                $score = 0;
                                if (!empty($patient['dni'])) $score += 10;
                                if (!empty($patient['phone'])) $score += 5;
                                if (!empty($patient['email'])) $score += 5;
                                if (!empty($patient['address'])) $score += 3;
                                if (!empty($patient['birth_date'])) $score += 2;
                                return $score;
                            })->first();
                            
                            $mainPatient = Patient::find($main['id']);
                            $duplicates = collect($patients)->filter(fn($p) => $p['id'] !== $main['id']);
                            
                            \Illuminate\Support\Facades\DB::beginTransaction();
                            
                            try {
                                foreach ($duplicates as $dup) {
                                    $duplicatePatient = Patient::find($dup['id']);
                                    
                                    // Actualizar campos vacíos
                                    if (empty($mainPatient->dni) && !empty($duplicatePatient->dni)) {
                                        $mainPatient->dni = $duplicatePatient->dni;
                                    }
                                    if (empty($mainPatient->phone) && !empty($duplicatePatient->phone)) {
                                        $mainPatient->phone = $duplicatePatient->phone;
                                    }
                                    if (empty($mainPatient->email) && !empty($duplicatePatient->email)) {
                                        $mainPatient->email = $duplicatePatient->email;
                                    }
                                    if (empty($mainPatient->address) && !empty($duplicatePatient->address)) {
                                        $mainPatient->address = $duplicatePatient->address;
                                    }
                                    
                                    // Mover relaciones
                                    $duplicatePatient->appointments()->update(['patient_id' => $mainPatient->id]);
                                    $duplicatePatient->medicalRecords()->update(['patient_id' => $mainPatient->id]);
                                    $duplicatePatient->leads()->update(['patient_id' => $mainPatient->id]);
                                    
                                    // Eliminar duplicado
                                    $duplicatePatient->delete();
                                }
                                
                                $mainPatient->save();
                                
                                \Illuminate\Support\Facades\DB::commit();
                                
                                \Filament\Notifications\Notification::make()
                                    ->title('Pacientes Unificados')
                                    ->body('Los pacientes seleccionados se han unificado exitosamente.')
                                    ->success()
                                    ->send();
                                    
                            } catch (\Exception $e) {
                                \Illuminate\Support\Facades\DB::rollBack();
                                
                                \Filament\Notifications\Notification::make()
                                    ->title('Error')
                                    ->body('Error al unificar pacientes: ' . $e->getMessage())
                                    ->danger()
                                    ->send();
                            }
                        }),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            RelationManagers\AppointmentsRelationManager::class,
            RelationManagers\MedicalRecordsRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListPatients::route('/'),
            'create' => Pages\CreatePatient::route('/create'),
            'view' => Pages\ViewPatient::route('/{record}'),
            'edit' => Pages\EditPatient::route('/{record}/edit'),
        ];
    }
}
