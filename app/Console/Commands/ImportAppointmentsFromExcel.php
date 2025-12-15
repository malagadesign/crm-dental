<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\Patient;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;

class ImportAppointmentsFromExcel extends Command
{
    protected $signature = 'appointments:import-excel 
                            {file=2025.xlsx} 
                            {--clinic=1} 
                            {--user=1} 
                            {--dry-run}
                            {--start-sheet=1}
                            {--end-sheet=52}';

    protected $description = 'Importa turnos directamente desde el archivo Excel 2025.xlsx';

    public function handle()
    {
        $file = $this->argument('file');
        $clinicId = $this->option('clinic');
        $userId = $this->option('user');
        $dryRun = $this->option('dry-run');
        $startSheet = (int) $this->option('start-sheet');
        $endSheet = (int) $this->option('end-sheet');

        if (!file_exists($file)) {
            $this->error("❌ El archivo {$file} no existe.");
            return 1;
        }

        $this->info("📋 Importando turnos desde: {$file}");
        $this->info("Hojas a procesar: {$startSheet} a {$endSheet}");

        // Verificar que existan los IDs
        $clinic = Clinic::find($clinicId);
        if (!$clinic) {
            $this->error("❌ El consultorio con ID {$clinicId} no existe.");
            return 1;
        }

        $user = User::find($userId);
        if (!$user) {
            $this->error("❌ El odontólogo con ID {$userId} no existe.");
            return 1;
        }

        $this->info("Consultorio: {$clinic->name}");
        $this->info("Odontólogo: {$user->name}");
        
        if ($dryRun) {
            $this->warn("⚠️  MODO DRY-RUN: No se guardarán los datos");
        }

        $this->newLine();

        try {
            $spreadsheet = IOFactory::load($file);
        } catch (\Exception $e) {
            $this->error("Error al abrir el archivo Excel: " . $e->getMessage());
            return 1;
        }

        $allAppointments = [];
        $pacientes_cache = [];

        // Procesar cada hoja (semana)
        for ($sheetIndex = $startSheet; $sheetIndex <= $endSheet; $sheetIndex++) {
            $sheetName = "Hoja{$sheetIndex}";
            
            if (!$spreadsheet->sheetNameExists($sheetName)) {
                $this->line("  ⏭️  Saltando {$sheetName} (no existe)");
                continue;
            }

            $sheet = $spreadsheet->getSheetByName($sheetName);
            $this->line("  📄 Procesando {$sheetName}...");

            $data = $sheet->toArray();
            
            if (empty($data) || count($data) < 2) {
                continue;
            }

            // La segunda fila (índice 1) tiene las fechas en formato "6-Jan", "7-Jan", etc.
            $dateRow = $data[1] ?? [];
            $colDates = [];
            
            // Detectar fechas en las columnas (a partir de la columna 1, la 0 es para horas)
            foreach ($dateRow as $colIndex => $cellValue) {
                if ($colIndex == 0) continue; // Saltar columna de tiempos
                
                if (!empty($cellValue)) {
                    $dateStr = $this->extractDateFromCell($cellValue, 2025); // Año 2025
                    if ($dateStr) {
                        $colDates[$colIndex] = $dateStr;
                    }
                }
            }

            if (empty($colDates)) {
                $this->line("    ⚠️  No se encontraron fechas en {$sheetName}");
                continue;
            }

            $lastValidTime = null;
            $highestRow = $sheet->getHighestRow();

            // Procesar cada fila (empezando desde la fila 3, ya que la 1 es días y la 2 es fechas, índice 0 y 1)
            for ($rowIndex = 2; $rowIndex < count($data) && ($rowIndex + 1) <= $highestRow; $rowIndex++) {
                $row = $data[$rowIndex];
                
                if (empty($row)) continue;

                // Primera columna (índice 0) es el tiempo
                $timeCell = $row[0] ?? null;
                
                if (!empty($timeCell)) {
                    $time = $this->parseTime($timeCell);
                    if ($time) {
                        $lastValidTime = $time;
                    }
                } elseif ($lastValidTime) {
                    // Si no hay tiempo pero hay uno previo, sumar 30 minutos
                    try {
                        $lastValidTime = Carbon::createFromTimeString($lastValidTime)
                            ->addMinutes(30)
                            ->format('H:i:s');
                    } catch (\Exception $e) {
                        continue;
                    }
                } else {
                    continue;
                }

                // Procesar cada columna con fecha
                foreach ($colDates as $colIndex => $dateStr) {
                    // Leer la celda directamente para obtener el formato/color
                    $excelRow = $rowIndex + 1; // Excel usa índice base 1
                    $excelCol = Coordinate::stringFromColumnIndex($colIndex + 1); // Excel usa índice base 1
                    $cellCoordinate = $excelCol . $excelRow;
                    
                    $cell = $sheet->getCell($cellCoordinate);
                    $cellValue = trim((string)$cell->getValue());
                    
                    if (!empty($cellValue) && strtolower($cellValue) !== 'nan' && strlen($cellValue) > 2) {
                        $cleanedName = $this->cleanName($cellValue);
                        
                        if (!empty($cleanedName)) {
                            // Detectar tipo por color de celda
                            $tipo = $this->detectCellType($sheet, $cellCoordinate);
                            
                            $allAppointments[] = [
                                'nombre' => $cleanedName,
                                'nombre_original' => $cellValue,
                                'fecha' => $dateStr,
                                'hora' => $lastValidTime,
                                'tipo' => $tipo,
                            ];
                        }
                    }
                }
            }
        }

        $this->newLine();
        $this->info("✅ Total de turnos encontrados: " . count($allAppointments));

        if (empty($allAppointments)) {
            $this->warn("No se encontraron turnos para importar.");
            return 0;
        }

        // Preguntar confirmación si no es dry-run
        if (!$dryRun && !$this->confirm('¿Deseas continuar con la importación?', true)) {
            $this->info("Importación cancelada.");
            return 0;
        }

        $this->newLine();
        $bar = $this->output->createProgressBar(count($allAppointments));
        $bar->start();

        $pacientes_creados = 0;
        $turnos_creados = 0;
        $duplicados = 0;
        $errores = 0;

        DB::beginTransaction();

        try {
            foreach ($allAppointments as $index => $registro) {
                try {
                    // Parsear fecha y hora
                    $fechaHora = Carbon::parse("{$registro['fecha']} {$registro['hora']}");
                    
                    if (!$fechaHora->isValid()) {
                        $errores++;
                        $bar->advance();
                        continue;
                    }

                    // Buscar o crear paciente
                    $nombre = trim($registro['nombre']);
                    $cache_key = strtolower($nombre);
                    
                    if (!isset($pacientes_cache[$cache_key])) {
                        $patient = Patient::whereRaw('LOWER(CONCAT(first_name, " ", last_name)) = ?', [strtolower($nombre)])
                            ->orWhereRaw('LOWER(first_name) = ?', [strtolower($nombre)])
                            ->first();

                        if (!$patient) {
                            $nameParts = explode(' ', $nombre, 2);
                            
                            if (!$dryRun) {
                                $patient = Patient::create([
                                    'first_name' => $nameParts[0],
                                    'last_name' => isset($nameParts[1]) ? $nameParts[1] : '',
                                    'origin' => 'otro',
                                    'notes' => 'Importado desde Excel 2025',
                                ]);
                                $pacientes_creados++;
                            } else {
                                // En dry-run, crear objeto temporal
                                $patient = new Patient([
                                    'first_name' => $nameParts[0],
                                    'last_name' => isset($nameParts[1]) ? $nameParts[1] : '',
                                ]);
                                $pacientes_creados++;
                            }
                        }
                        
                        $pacientes_cache[$cache_key] = $patient;
                    } else {
                        $patient = $pacientes_cache[$cache_key];
                    }

                    // Verificar duplicado
                    if (!$dryRun) {
                        $turno_existente = Appointment::where('patient_id', $patient->id)
                            ->where('datetime_start', $fechaHora->format('Y-m-d H:i:s'))
                            ->where('clinic_id', $clinicId)
                            ->exists();

                        if ($turno_existente) {
                            $duplicados++;
                            $bar->advance();
                            continue;
                        }

                        // Determinar estado según la fecha
                        // Turnos hasta el 1 de diciembre = "asistio", después = "confirmado"
                        $fechaLimite = Carbon::parse('2025-12-01 23:59:59');
                        $status = $fechaHora->lte($fechaLimite) ? 'asistio' : 'confirmado';

                        // Determinar tipo del turno
                        $tipoValue = 'normal';
                        $tipo = $registro['tipo'] ?? null;
                        if ($tipo === 'Cirugía') {
                            $tipoValue = 'cirugia';
                        } elseif ($tipo === 'Trabajo de Laboratorio') {
                            $tipoValue = 'trabajo_laboratorio';
                        }

                        // Crear turno
                        Appointment::create([
                            'patient_id' => $patient->id,
                            'clinic_id' => $clinicId,
                            'user_id' => $userId,
                            'treatment_id' => null,
                            'datetime_start' => $fechaHora,
                            'datetime_end' => $fechaHora->copy()->addMinutes(30),
                            'status' => $status,
                            'tipo' => $tipoValue,
                            'notes' => 'Importado desde Excel 2025',
                        ]);
                    }

                    $turnos_creados++;

                } catch (\Exception $e) {
                    $errores++;
                    // Solo mostrar errores en modo verbose
                    if ($this->output->getVerbosity() >= \Symfony\Component\Console\Output\OutputInterface::VERBOSITY_VERBOSE) {
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
                    ['Pacientes que se crearán', $pacientes_creados],
                    ['Turnos que se crearán', $turnos_creados],
                    ['Turnos duplicados (omitidos)', $duplicados],
                    ['Errores', $errores],
                    ['Total procesado', count($allAppointments)],
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
            $this->error("❌ Error durante la importación: " . $e->getMessage());
            $this->error("Stack trace: " . $e->getTraceAsString());
            return 1;
        }
    }

    protected function parseTime($timeStr)
    {
        if (empty($timeStr)) {
            return null;
        }

        try {
            // Intentar varios formatos
            $formats = ['H:i:s', 'H:i', 'G:i:s', 'G:i'];
            
            foreach ($formats as $format) {
                try {
                    $time = Carbon::createFromFormat($format, $timeStr);
                    return $time->format('H:i:s');
                } catch (\Exception $e) {
                    continue;
                }
            }

            // Si es un número (formato Excel)
            if (is_numeric($timeStr)) {
                $timestamp = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToTimestamp($timeStr);
                return date('H:i:s', $timestamp);
            }

            return null;
        } catch (\Exception $e) {
            return null;
        }
    }

    protected function extractDateFromCell($cellValue, $year = 2025)
    {
        if (empty($cellValue)) {
            return null;
        }

        $cellStr = (string) trim($cellValue);
        
        // Si es un número (formato Excel serial date)
        if (is_numeric($cellValue)) {
            try {
                $date = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($cellValue);
                if ($date->format('Y') == $year) {
                    return $date->format('Y-m-d');
                }
            } catch (\Exception $e) {
                // No es una fecha válida
            }
        }

        // Formato común: "6-Jan", "15-Mar", etc.
        // Mapeo de meses en español e inglés
        $months = [
            'jan' => '01', 'ene' => '01', 'enero' => '01',
            'feb' => '02', 'febrero' => '02',
            'mar' => '03', 'marzo' => '03',
            'apr' => '04', 'abr' => '04', 'abril' => '04',
            'may' => '05', 'mayo' => '05',
            'jun' => '06', 'junio' => '06',
            'jul' => '07', 'julio' => '07',
            'aug' => '08', 'ago' => '08', 'agosto' => '08',
            'sep' => '09', 'sept' => '09', 'septiembre' => '09',
            'oct' => '10', 'octubre' => '10',
            'nov' => '11', 'noviembre' => '11',
            'dec' => '12', 'dic' => '12', 'diciembre' => '12',
        ];

        // Buscar patrón "día-mes" o "día/mes"
        if (preg_match('/^(\d{1,2})[\/-]([a-z]+)$/i', $cellStr, $matches)) {
            $day = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
            $monthName = strtolower($matches[2]);
            
            if (isset($months[$monthName])) {
                return "{$year}-{$months[$monthName]}-{$day}";
            }
        }

        // Buscar patrón "día-mes-año" o similar
        if (preg_match('/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/', $cellStr, $matches)) {
            $day = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
            $month = str_pad($matches[2], 2, '0', STR_PAD_LEFT);
            $foundYear = $matches[3];
            
            if ($foundYear == $year) {
                return "{$foundYear}-{$month}-{$day}";
            }
        }

        // Intentar parsear directamente con Carbon
        try {
            $date = Carbon::parse($cellStr);
            if ($date->year == $year || $date->year == 1900) {
                // Si el año es 1900, usar el año proporcionado
                if ($date->year == 1900) {
                    $date->year = $year;
                }
                return $date->format('Y-m-d');
            }
        } catch (\Exception $e) {
            // No se pudo parsear
        }

        return null;
    }

    protected function cleanName($name)
    {
        if (empty($name) || !is_string($name)) {
            return '';
        }

        // Limpiar espacios
        $name = trim($name);
        
        // Remover guiones y lo que viene después
        if (strpos($name, '-') !== false) {
            $parts = explode('-', $name);
            $name = trim($parts[0]);
        }
        
        // Remover números de teléfono argentinos
        $name = preg_replace('/\(?\d{2,4}\)?\s*-?\s*\d{4}\s*-?\s*\d{4}/', '', $name);
        $name = preg_replace('/\d{10,11}/', '', $name);
        
        // Remover DNI
        $name = preg_replace('/DNI\s*:?\s*\d{7,8}/i', '', $name);
        $name = preg_replace('/\d{7,8}\s*\(?DNI\)?/i', '', $name);
        
        // Remover números largos sueltos (probablemente DNI)
        $name = preg_replace('/\b\d{7,}\b/', '', $name);
        
        // Limpiar caracteres especiales al inicio/final
        $name = preg_replace('/^[^\w]+|[^\w]+$/', '', $name);
        
        // Capitalizar correctamente
        $words = explode(' ', $name);
        $words = array_map(function($word) {
            return ucfirst(mb_strtolower(trim($word)));
        }, $words);
        $name = implode(' ', array_filter($words));
        
        // Limpiar espacios múltiples
        $name = preg_replace('/\s+/', ' ', $name);
        
        return trim($name);
    }

    protected function detectCellType($sheet, $cellCoordinate)
    {
        try {
            $style = $sheet->getStyle($cellCoordinate);
            $fill = $style->getFill();
            
            // Si la celda no tiene relleno, no es especial
            if ($fill->getFillType() === \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_NONE) {
                return null;
            }
            
            $fillColor = strtoupper($fill->getStartColor()->getRGB());
            
            // Si el color es blanco (FFFFFF) o negro (000000), no es especial
            if ($fillColor === 'FFFFFF' || $fillColor === '000000') {
                return null;
            }
            
            // Colores específicos conocidos:
            // FF0000 = Rojo = Cirugía
            // 00B050 = Verde esmeralda = Trabajo de Laboratorio
            
            // Detectar rojo exacto o rojos muy similares
            if ($fillColor === 'FF0000' || 
                (substr($fillColor, 0, 2) === 'FF' && 
                 hexdec(substr($fillColor, 2, 2)) < 50 && 
                 hexdec(substr($fillColor, 4, 2)) < 50)) {
                return 'Cirugía';
            }
            
            // Detectar verde esmeralda (00B050) o verdes similares
            if ($fillColor === '00B050' ||
                (substr($fillColor, 0, 2) === '00' && 
                 hexdec(substr($fillColor, 2, 2)) > 100)) {
                return 'Trabajo de Laboratorio';
            }
            
            // Detectar amarillo (FFFF00 o amarillos claros) - Trabajo de Laboratorio
            // Amarillo típico tiene rojo y verde altos, azul bajo
            $red = hexdec(substr($fillColor, 0, 2));
            $green = hexdec(substr($fillColor, 2, 2));
            $blue = hexdec(substr($fillColor, 4, 2));
            
            // Amarillo: rojo alto, verde alto, azul bajo
            if ($red > 240 && $green > 240 && $blue < 50) {
                return 'Trabajo de Laboratorio';
            }
            
            // Verdes: rojo bajo, verde alto
            if ($red < 50 && $green > 150) {
                return 'Trabajo de Laboratorio';
            }
            
            // Rojos: rojo alto, verde y azul bajos
            if ($red > 200 && $green < 100 && $blue < 100) {
                return 'Cirugía';
            }
            
            return null;
        } catch (\Exception $e) {
            return null;
        }
    }
}
