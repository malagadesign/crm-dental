<?php

namespace App\Filament\Pages;

use App\Filament\Widgets\AppointmentsCalendarWidget;
use Filament\Pages\Dashboard as BaseDashboard;

class Dashboard extends BaseDashboard
{
    protected static ?string $navigationLabel = 'Escritorio';

    protected static ?string $title = 'Escritorio';

    public function getWidgets(): array
    {
        return [
            AppointmentsCalendarWidget::class,
        ];
    }
}

