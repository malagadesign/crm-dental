<?php

namespace App\Filament\Resources;

use App\Filament\Resources\LeadResource\Pages;
use App\Filament\Resources\LeadResource\RelationManagers;
use App\Models\Lead;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class LeadResource extends Resource
{
    protected static ?string $model = Lead::class;

    protected static ?string $navigationIcon = 'heroicon-o-megaphone';

    protected static ?string $navigationLabel = 'Leads';

    protected static ?string $modelLabel = 'Lead';

    protected static ?string $pluralModelLabel = 'Leads';

    /**
     * Solo los administradores pueden ver y gestionar leads
     */
    public static function canViewAny(): bool
    {
        return auth()->check() && auth()->user()->isAdmin();
    }

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Información del Lead')
                    ->schema([
                        Forms\Components\TextInput::make('first_name')
                            ->label('Nombre')
                            ->maxLength(255),
                        Forms\Components\TextInput::make('last_name')
                            ->label('Apellido')
                            ->maxLength(255),
                        Forms\Components\TextInput::make('phone')
                            ->label('Teléfono')
                            ->tel()
                            ->maxLength(255),
                        Forms\Components\TextInput::make('email')
                            ->label('Email')
                            ->email()
                            ->maxLength(255),
                        Forms\Components\Select::make('origin')
                            ->label('Origen')
                            ->options([
                                'instagram' => 'Instagram',
                                'google' => 'Google',
                                'facebook' => 'Facebook',
                                'recomendacion' => 'Recomendación',
                                'otro' => 'Otro',
                            ])
                            ->default('instagram')
                            ->required(),
                        Forms\Components\Textarea::make('message')
                            ->label('Mensaje')
                            ->rows(3),
                        Forms\Components\Select::make('status')
                            ->label('Estado')
                            ->options([
                                'nuevo' => 'Nuevo',
                                'contactado' => 'Contactado',
                                'convertido' => 'Convertido',
                                'descartado' => 'Descartado',
                            ])
                            ->default('nuevo')
                            ->required(),
                        Forms\Components\Select::make('patient_id')
                            ->label('Paciente Asociado')
                            ->relationship('patient', 'full_name')
                            ->searchable()
                            ->preload(),
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
                        'google' => 'Google',
                        'facebook' => 'Facebook',
                        'recomendacion' => 'Recomendación',
                        default => 'Otro',
                    })
                    ->colors([
                        'primary' => 'instagram',
                        'success' => 'recomendacion',
                        'warning' => 'google',
                        'info' => 'facebook',
                        'gray' => 'otro',
                    ]),
                Tables\Columns\BadgeColumn::make('status')
                    ->label('Estado')
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'nuevo' => 'Nuevo',
                        'contactado' => 'Contactado',
                        'convertido' => 'Convertido',
                        'descartado' => 'Descartado',
                    })
                    ->colors([
                        'primary' => 'nuevo',
                        'warning' => 'contactado',
                        'success' => 'convertido',
                        'danger' => 'descartado',
                    ]),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Fecha')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('origin')
                    ->label('Origen')
                    ->options([
                        'instagram' => 'Instagram',
                        'google' => 'Google',
                        'facebook' => 'Facebook',
                        'recomendacion' => 'Recomendación',
                        'otro' => 'Otro',
                    ]),
                Tables\Filters\SelectFilter::make('status')
                    ->label('Estado')
                    ->options([
                        'nuevo' => 'Nuevo',
                        'contactado' => 'Contactado',
                        'convertido' => 'Convertido',
                        'descartado' => 'Descartado',
                    ]),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
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
            'index' => Pages\ListLeads::route('/'),
            'create' => Pages\CreateLead::route('/create'),
            'edit' => Pages\EditLead::route('/{record}/edit'),
        ];
    }
}
