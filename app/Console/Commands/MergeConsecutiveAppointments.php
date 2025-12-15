<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MergeConsecutiveAppointments extends Command
{
    protected $signature = 'appointments:merge-consecutive {--dry-run}';

    protected $description = 'Une turnos consecutivos del mismo paciente en un solo bloque';

    public function handle()
    {
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->warn("⚠️  MODO DRY-RUN: No se guardarán los cambios");
        }

        $this->info("🔍 Buscando turnos consecutivos para unificar...");
        $this->newLine();

        // Obtener todos los turnos ordenados por paciente y fecha
        $appointments = Appointment::query()
            ->with('patient')
            ->orderBy('patient_id')
            ->orderBy('datetime_start')
            ->get();

        $merged = 0;
        $deleted = 0;
        $groups = [];

        // Agrupar por paciente
        foreach ($appointments as $appointment) {
            $patientId = $appointment->patient_id;
            if (!isset($groups[$patientId])) {
                $groups[$patientId] = [];
            }
            $groups[$patientId][] = $appointment;
        }

        $bar = $this->output->createProgressBar(count($appointments));
        $bar->start();

        foreach ($groups as $patientId => $patientAppointments) {
            // Ordenar por fecha
            usort($patientAppointments, function($a, $b) {
                $timeA = Carbon::parse($a->datetime_start)->timestamp;
                $timeB = Carbon::parse($b->datetime_start)->timestamp;
                return $timeA <=> $timeB;
            });

            $i = 0;
            while ($i < count($patientAppointments) - 1) {
                $current = $patientAppointments[$i];
                $next = $patientAppointments[$i + 1];

                $currentEnd = Carbon::parse($current->datetime_end);
                $nextStart = Carbon::parse($next->datetime_start);
                $currentStart = Carbon::parse($current->datetime_start);

                // Verificar si son consecutivos (fin de uno = inicio del otro, mismo día)
                // También verificar si tienen los mismos datos (clinic, user, etc.)
                $isConsecutive = $currentEnd->equalTo($nextStart) &&
                                 $currentStart->isSameDay($nextStart) &&
                                 $current->clinic_id === $next->clinic_id &&
                                 $current->user_id === $next->user_id;

                if ($isConsecutive) {
                    // Unificar turnos: extender el primero y eliminar el segundo
                    $newEndTime = Carbon::parse($next->datetime_end);
                    
                    if (!$dryRun) {
                        // Combinar notas si ambas tienen contenido
                        $combinedNotes = $current->notes;
                        if (!empty($next->notes) && $next->notes !== $current->notes) {
                            if (!empty($combinedNotes)) {
                                $combinedNotes .= ' | ' . $next->notes;
                            } else {
                                $combinedNotes = $next->notes;
                            }
                        }

                        // Actualizar el turno actual con el nuevo tiempo de fin
                        $current->datetime_end = $newEndTime;
                        $current->notes = $combinedNotes;
                        $current->save();

                        // Eliminar el turno siguiente
                        $next->delete();
                    }

                    $merged++;
                    $deleted++;

                    // Remover el siguiente de la lista y seguir buscando desde el actual
                    array_splice($patientAppointments, $i + 1, 1);
                    continue; // No incrementar $i, revisar nuevamente desde aquí
                }

                $i++;
                $bar->advance();
            }

            // Avanzar la barra para los turnos restantes
            for ($j = $i; $j < count($patientAppointments); $j++) {
                $bar->advance();
            }
        }

        $bar->finish();
        $this->newLine(2);

        $this->info("✅ Proceso completado!");
        $this->table(
            ['Concepto', 'Cantidad'],
            [
                ['Grupos de turnos unificados', $merged],
                ['Turnos eliminados', $deleted],
            ]
        );

        if ($dryRun) {
            $this->warn("\n⚠️  Esto fue una simulación. Para aplicar los cambios, ejecuta sin --dry-run");
        }

        return 0;
    }
}

