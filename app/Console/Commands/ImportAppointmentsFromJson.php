<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ImportAppointmentsFromJson extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'appointments:import {file=turnos_2025_import.json} {--clinic=1} {--user=1} {--dry-run}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Importa turnos desde un archivo JSON generado desde Excel';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $file = $this->argument('file');
        $clinicId = $this->option('clinic');
        $userId = $this->option('user');
        $dryRun = $this->option('dry-run');

        if (!file_exists($file)) {
            $this->error("El archivo {$file} no existe.");
            return 1;
        }

        $json = json_decode(file_get_contents($file), true);

        if (!$json) {
            $this->error("Error al leer el archivo JSON.");
            return 1;
        }

        $this->info("📋 Importando turnos desde: {$file}");
        $this->info("Total de registros: " . count($json));

        // Verificar que existan los IDs proporcionados
        $clinic = Clinic::find($clinicId);
        if (!$clinic) {
            $this->error("El consultorio con ID {$clinicId} no existe.");
            return 1;
        }

        $user = User::find($userId);
        if (!$user) {
            $this->error("El odontólogo con ID {$userId} no existe.");
            return 1;
        }

        $this->info("Consultorio: {$clinic->name}");
        $this->info("Odontólogo: {$user->name}");
        
        if ($dryRun) {
            $this->warn("⚠️  MODO DRY-RUN: No se guardarán los datos");
        }

        $this->newLine();

        $bar = $this->output->createProgressBar(count($json));
        $bar->start();

        $importados = 0;
        $pacientes_creados = 0;
        $turnos_creados = 0;
        $duplicados = 0;
        $errores = 0;
        $pacientes_cache = [];

        DB::beginTransaction();

        try {
            foreach ($json as $index => $registro) {
                try {
                    // Parsear fecha y hora
                    $fechaHora = Carbon::parse($registro['fecha_hora']);
                    
                    if (!$fechaHora->isValid()) {
                        $errores++;
                        $bar->advance();
                        continue;
                    }

                    // Buscar o crear paciente
                    $nombre = trim($registro['nombre']);
                    
                    if (empty($nombre) || strlen($nombre) < 3) {
                        $errores++;
                        $bar->advance();
                        continue;
                    }

                    // Buscar paciente en cache primero
                    $cache_key = strtolower($nombre);
                    
                    if (!isset($pacientes_cache[$cache_key])) {
                        // Buscar paciente existente por nombre (sin case sensitive)
                        $patient = Patient::whereRaw('LOWER(CONCAT(first_name, " ", last_name)) = ?', [strtolower($nombre)])
                            ->orWhereRaw('LOWER(first_name) = ?', [strtolower($nombre)])
                            ->first();

                        if (!$patient) {
                            // Crear nuevo paciente
                            $nameParts = explode(' ', $nombre, 2);
                            
                            $patient = Patient::create([
                                'first_name' => $nameParts[0],
                                'last_name' => isset($nameParts[1]) ? $nameParts[1] : '',
                                'origin' => 'importacion',
                                'notes' => 'Importado desde Excel 2025',
                            ]);
                            
                            $pacientes_creados++;
                        }
                        
                        $pacientes_cache[$cache_key] = $patient;
                    } else {
                        $patient = $pacientes_cache[$cache_key];
                    }

                    // Verificar si el turno ya existe (evitar duplicados)
                    $turno_existente = Appointment::where('patient_id', $patient->id)
                        ->where('datetime_start', $fechaHora->format('Y-m-d H:i:s'))
                        ->where('clinic_id', $clinicId)
                        ->exists();

                    if ($turno_existente) {
                        $duplicados++;
                        $bar->advance();
                        continue;
                    }

                    // Calcular hora de fin (asumir 30 minutos por defecto)
                    $fechaHoraFin = $fechaHora->copy()->addMinutes(30);

                    if (!$dryRun) {
                        // Crear turno
                        Appointment::create([
                            'patient_id' => $patient->id,
                            'clinic_id' => $clinicId,
                            'user_id' => $userId,
                            'treatment_id' => null,
                            'datetime_start' => $fechaHora,
                            'datetime_end' => $fechaHoraFin,
                            'status' => 'asistio', // Asumir que los turnos históricos fueron asistidos
                            'notes' => 'Importado desde Excel 2025',
                        ]);
                    }

                    $turnos_creados++;
                    $importados++;

                } catch (\Exception $e) {
                    $errores++;
                    if ($this->getVerbosity() >= 2) {
                        $this->newLine();
                        $this->error("Error en registro " . ($index + 1) . ": " . $e->getMessage());
                    }
                }

                $bar->advance();
            }

            if (!$dryRun) {
                DB::commit();
            } else {
                DB::rollBack();
            }

            $bar->finish();
            $this->newLine(2);

            // Mostrar resumen
            $this->info("✅ Importación completada!");
            $this->table(
                ['Concepto', 'Cantidad'],
                [
                    ['Pacientes creados', $pacientes_creados],
                    ['Turnos creados', $turnos_creados],
                    ['Turnos duplicados (omitidos)', $duplicados],
                    ['Errores', $errores],
                    ['Total procesado', $importados],
                ]
            );

            if ($dryRun) {
                $this->warn("\n⚠️  Esto fue una simulación. Para importar realmente, ejecuta sin --dry-run");
            }

            return 0;

        } catch (\Exception $e) {
            DB::rollBack();
            $bar->finish();
            $this->newLine();
            $this->error("Error durante la importación: " . $e->getMessage());
            return 1;
        }
    }
}
