<?php

namespace App\Console\Commands;

use App\Models\Patient;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class UnifyDuplicatePatients extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'patients:unify-duplicates 
                            {--dry-run : Solo mostrar duplicados sin unificar}
                            {--auto : Unificar automáticamente sin confirmación}
                            {--similarity=80 : Porcentaje de similitud mínimo (0-100)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Detecta y unifica pacientes duplicados en la base de datos';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $auto = $this->option('auto');
        $similarityThreshold = (int) $this->option('similarity');

        $this->info('🔍 Buscando pacientes duplicados...');
        $this->newLine();

        $duplicates = $this->findDuplicates($similarityThreshold);

        if (empty($duplicates)) {
            $this->info('✅ No se encontraron pacientes duplicados.');
            return Command::SUCCESS;
        }

        $this->info("📋 Se encontraron " . count($duplicates) . " grupos de pacientes duplicados:");
        $this->newLine();

        // Mostrar duplicados encontrados
        foreach ($duplicates as $index => $group) {
            $this->displayDuplicateGroup($index + 1, $group);
        }

        if ($dryRun) {
            $this->warn('⚠️  Modo DRY-RUN: No se realizarán cambios.');
            return Command::SUCCESS;
        }

        if (!$auto) {
            if (!$this->confirm('¿Deseas proceder con la unificación de estos pacientes?', true)) {
                $this->info('Operación cancelada.');
                return Command::SUCCESS;
            }
        }

        $this->newLine();
        $this->info('🔄 Iniciando unificación...');
        $this->newLine();

        $unified = 0;
        $failed = 0;
        
        foreach ($duplicates as $index => $group) {
            $this->line("Procesando grupo " . ($index + 1) . " de " . count($duplicates) . "...");
            
            if ($this->unifyGroup($group)) {
                $unified++;
            } else {
                $failed++;
            }
        }

        $this->newLine();
        
        if ($failed > 0) {
            $this->warn("⚠️  Proceso completado con advertencias.");
            $this->info("✅ Grupos unificados exitosamente: {$unified}");
            $this->error("❌ Grupos con errores: {$failed}");
        } else {
            $this->info("✅ Proceso completado exitosamente. Se unificaron {$unified} grupos de pacientes duplicados.");
        }

        return Command::SUCCESS;
    }

    /**
     * Encuentra pacientes duplicados usando diferentes criterios
     */
    private function findDuplicates(int $similarityThreshold): array
    {
        $patients = Patient::all();
        $duplicates = [];
        $processed = [];

        foreach ($patients as $patient) {
            if (in_array($patient->id, $processed)) {
                continue;
            }

            $group = [$patient];
            $processed[] = $patient->id;

            foreach ($patients as $other) {
                if ($patient->id === $other->id || in_array($other->id, $processed)) {
                    continue;
                }

                if ($this->areDuplicates($patient, $other, $similarityThreshold)) {
                    $group[] = $other;
                    $processed[] = $other->id;
                }
            }

            if (count($group) > 1) {
                $duplicates[] = $group;
            }
        }

        return $duplicates;
    }

    /**
     * Verifica si dos pacientes son duplicados
     */
    private function areDuplicates(Patient $p1, Patient $p2, int $similarityThreshold): bool
    {
        // Criterio 1: Mismo DNI (si ambos tienen DNI)
        if (!empty($p1->dni) && !empty($p2->dni) && $p1->dni === $p2->dni) {
            return true;
        }

        // Criterio 2: Mismo teléfono (si ambos tienen teléfono)
        if (!empty($p1->phone) && !empty($p2->phone) && $p1->phone === $p2->phone) {
            return true;
        }

        // Criterio 3: Mismo email (si ambos tienen email)
        if (!empty($p1->email) && !empty($p2->email) && $p1->email === $p2->email) {
            return true;
        }

        // Criterio 4: Nombres similares
        $fullName1 = strtolower(trim($p1->first_name . ' ' . $p1->last_name));
        $fullName2 = strtolower(trim($p2->first_name . ' ' . $p2->last_name));

        // Si los nombres son idénticos
        if ($fullName1 === $fullName2) {
            return true;
        }

        // Calcular similitud usando similar_text
        similar_text($fullName1, $fullName2, $similarity);
        
        if ($similarity >= $similarityThreshold) {
            // Verificar también similitud por partes
            $firstNameSimilarity = 0;
            $lastNameSimilarity = 0;
            
            similar_text(strtolower($p1->first_name), strtolower($p2->first_name), $firstNameSimilarity);
            similar_text(strtolower($p1->last_name), strtolower($p2->last_name), $lastNameSimilarity);
            
            // Si el apellido es muy similar (>= 85%) y el nombre también (>= 70%)
            if ($lastNameSimilarity >= 85 && $firstNameSimilarity >= 70) {
                return true;
            }
        }

        return false;
    }

    /**
     * Muestra un grupo de duplicados
     */
    private function displayDuplicateGroup(int $index, array $group): void
    {
        $this->line("Grupo {$index}:");
        
        foreach ($group as $patient) {
            $info = [
                "ID: {$patient->id}",
                "Nombre: {$patient->full_name}",
            ];
            
            if ($patient->dni) {
                $info[] = "DNI: {$patient->dni}";
            }
            if ($patient->phone) {
                $info[] = "Tel: {$patient->phone}";
            }
            if ($patient->email) {
                $info[] = "Email: {$patient->email}";
            }
            
            $appointmentsCount = $patient->appointments()->count();
            $recordsCount = $patient->medicalRecords()->count();
            
            $info[] = "Turnos: {$appointmentsCount}";
            $info[] = "Registros: {$recordsCount}";
            
            $this->line("  • " . implode(' | ', $info));
        }
        
        $this->newLine();
    }

    /**
     * Unifica un grupo de pacientes duplicados
     */
    private function unifyGroup(array $group): bool
    {
        if (count($group) < 2) {
            return false;
        }

        // Seleccionar el paciente principal (el más completo)
        $main = $this->selectMainPatient($group);
        $duplicates = array_filter($group, fn($p) => $p->id !== $main->id);

        DB::beginTransaction();
        
        try {
            foreach ($duplicates as $duplicate) {
                $this->mergePatient($main, $duplicate);
            }

            DB::commit();
            
            $this->info("✅ Unificados: " . $main->full_name . " (ID: {$main->id})");
            return true;
            
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("❌ Error al unificar: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Selecciona el paciente principal (el más completo)
     */
    private function selectMainPatient(array $group): Patient
    {
        return collect($group)->sortByDesc(function ($patient) {
            $score = 0;
            
            // Priorizar pacientes con más datos
            if (!empty($patient->dni)) $score += 10;
            if (!empty($patient->phone)) $score += 5;
            if (!empty($patient->email)) $score += 5;
            if (!empty($patient->address)) $score += 3;
            if (!empty($patient->birth_date)) $score += 2;
            
            // Priorizar pacientes con más turnos
            $score += $patient->appointments()->count() * 2;
            
            // Priorizar pacientes con más registros médicos
            $score += $patient->medicalRecords()->count();
            
            // Priorizar el más reciente
            $score += $patient->created_at->timestamp / 1000000;
            
            return $score;
        })->first();
    }

    /**
     * Fusiona un paciente duplicado con el principal
     */
    private function mergePatient(Patient $main, Patient $duplicate): void
    {
        // Actualizar campos vacíos del principal con datos del duplicado
        $updates = [];
        
        if (empty($main->dni) && !empty($duplicate->dni)) {
            $updates['dni'] = $duplicate->dni;
        }
        
        if (empty($main->phone) && !empty($duplicate->phone)) {
            $updates['phone'] = $duplicate->phone;
        }
        
        if (empty($main->email) && !empty($duplicate->email)) {
            $updates['email'] = $duplicate->email;
        }
        
        if (empty($main->address) && !empty($duplicate->address)) {
            $updates['address'] = $duplicate->address;
        }
        
        if (empty($main->birth_date) && !empty($duplicate->birth_date)) {
            $updates['birth_date'] = $duplicate->birth_date;
        }
        
        // Combinar notas
        if (!empty($duplicate->notes)) {
            $mainNotes = $main->notes ?? '';
            $duplicateNotes = $duplicate->notes ?? '';
            
            if (!empty($mainNotes) && !empty($duplicateNotes)) {
                $updates['notes'] = $mainNotes . "\n\n--- Notas del registro duplicado (ID: {$duplicate->id}) ---\n" . $duplicateNotes;
            } elseif (empty($mainNotes)) {
                $updates['notes'] = $duplicateNotes;
            }
        }
        
        if (!empty($updates)) {
            $main->update($updates);
        }

        // Mover relaciones
        $duplicate->appointments()->update(['patient_id' => $main->id]);
        $duplicate->medicalRecords()->update(['patient_id' => $main->id]);
        $duplicate->leads()->update(['patient_id' => $main->id]);

        // Eliminar el duplicado
        $duplicate->delete();
    }
}
