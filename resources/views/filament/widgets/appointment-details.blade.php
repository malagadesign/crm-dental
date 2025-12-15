<div class="space-y-6" style="min-width: 600px;">
    <style>
        .status-badge {
            display: inline-flex;
            align-items: center;
            padding: 0.125rem 0.625rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
        }
        .status-confirmado { background-color: rgb(220, 252, 231); color: rgb(22, 101, 52); }
        .status-asistio { background-color: rgb(219, 234, 254); color: rgb(30, 64, 175); }
        .status-cancelado { background-color: rgb(254, 226, 226); color: rgb(153, 27, 27); }
        .status-no-asistio { background-color: rgb(254, 249, 195); color: rgb(133, 77, 14); }
        .tipo-cirugia { background-color: rgb(254, 226, 226); color: rgb(153, 27, 27); }
        .tipo-laboratorio { background-color: rgb(254, 249, 195); color: rgb(133, 77, 14); }
        
        [data-theme="dark"] .status-confirmado,
        .dark .status-confirmado {
            background-color: rgb(20, 83, 45) !important;
            color: rgb(187, 247, 208) !important;
        }
        [data-theme="dark"] .status-asistio,
        .dark .status-asistio {
            background-color: rgb(30, 58, 138) !important;
            color: rgb(191, 219, 254) !important;
        }
        [data-theme="dark"] .status-cancelado,
        .dark .status-cancelado {
            background-color: rgb(127, 29, 29) !important;
            color: rgb(254, 202, 202) !important;
        }
        [data-theme="dark"] .status-no-asistio,
        .dark .status-no-asistio {
            background-color: rgb(113, 63, 18) !important;
            color: rgb(254, 240, 138) !important;
        }
        [data-theme="dark"] .tipo-cirugia,
        .dark .tipo-cirugia {
            background-color: rgb(127, 29, 29) !important;
            color: rgb(254, 202, 202) !important;
        }
        [data-theme="dark"] .tipo-laboratorio,
        .dark .tipo-laboratorio {
            background-color: rgb(113, 63, 18) !important;
            color: rgb(254, 240, 138) !important;
        }
    </style>
    <!-- Información del Paciente -->
    <div>
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">Información del Paciente</h3>
        <div class="grid" style="grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem;">
            <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Paciente</p>
                <p class="text-base font-semibold text-gray-900 dark:text-white">{{ $appointment->patient->full_name }}</p>
            </div>
            
            @if($appointment->patient->dni)
            <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">DNI</p>
                <p class="text-base font-semibold text-gray-900 dark:text-white">{{ $appointment->patient->dni }}</p>
            </div>
            @endif
            
            @if($appointment->patient->phone)
            <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Teléfono</p>
                <p class="text-base font-semibold text-gray-900 dark:text-white">
                    <a href="tel:{{ $appointment->patient->phone }}" class="text-blue-600 dark:text-blue-400 hover:underline">
                        {{ $appointment->patient->phone }}
                    </a>
                </p>
            </div>
            @endif
            
            @if($appointment->patient->email)
            <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                <p class="text-base font-semibold text-gray-900 dark:text-white">
                    <a href="mailto:{{ $appointment->patient->email }}" class="text-blue-600 dark:text-blue-400 hover:underline">
                        {{ $appointment->patient->email }}
                    </a>
                </p>
            </div>
            @endif
        </div>
    </div>
    
    <!-- Información del Turno -->
    <div>
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">Información del Turno</h3>
        <div class="grid" style="grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem;">
            <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Odontólogo</p>
                <p class="text-base font-semibold text-gray-900 dark:text-white">{{ $appointment->user->name }}</p>
            </div>
            
            <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Consultorio</p>
                <p class="text-base font-semibold text-gray-900 dark:text-white">{{ $appointment->clinic->name }}</p>
            </div>
            
            <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha y Hora</p>
                <p class="text-base font-semibold text-gray-900 dark:text-white">
                    {{ \Carbon\Carbon::parse($appointment->datetime_start)->format('d/m/Y H:i') }} - 
                    {{ \Carbon\Carbon::parse($appointment->datetime_end)->format('H:i') }}
                </p>
            </div>
            
            <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Estado</p>
                <div class="text-base font-semibold">
                    @if($appointment->status === 'confirmado')
                        <span class="status-badge status-confirmado">
                            Confirmado
                        </span>
                    @elseif($appointment->status === 'asistio')
                        <span class="status-badge status-asistio">
                            Asistió
                        </span>
                    @elseif($appointment->status === 'cancelado')
                        <span class="status-badge status-cancelado">
                            Cancelado
                        </span>
                    @elseif($appointment->status === 'no_asistio')
                        <span class="status-badge status-no-asistio">
                            No Asistió
                        </span>
                    @endif
                </div>
            </div>
            
            @if($appointment->treatment)
            <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Tratamiento</p>
                <p class="text-base font-semibold text-gray-900 dark:text-white">{{ $appointment->treatment->name }}</p>
            </div>
            @endif
            
            @if($appointment->tipo && $appointment->tipo !== 'normal')
            <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Tipo</p>
                <div class="text-base font-semibold">
                    @if($appointment->tipo === 'cirugia')
                        <span class="status-badge tipo-cirugia">
                            🔴 Cirugía
                        </span>
                    @elseif($appointment->tipo === 'trabajo_laboratorio')
                        <span class="status-badge tipo-laboratorio">
                            🟡 Trabajo de Laboratorio
                        </span>
                    @endif
                </div>
            </div>
            @endif
        </div>
    </div>
    
    @if($appointment->notes)
    <div>
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">Notas</h3>
        <p class="text-sm text-gray-900 dark:text-white">{{ $appointment->notes }}</p>
    </div>
    @endif
</div>

