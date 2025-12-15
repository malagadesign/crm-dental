<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use Carbon\Carbon;
use Illuminate\Console\Command;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;

class UpdateAppointmentTypesFromExcel extends Command
{
    protected $signature = 'appointments:update-types {file=2025.xlsx}';

    protected $description = 'Actualiza los tipos de turnos (Cirugía/Trabajo de Laboratorio) basándose en los colores del Excel';

    public function handle()
    {
        $file = $this->argument('file');

        if (!file_exists($file)) {
            $this->error("❌ El archivo {$file} no existe.");
            return 1;
        }

        $this->info("📋 Actualizando tipos de turnos desde: {$file}");

        try {
            $spreadsheet = IOFactory::load($file);
        } catch (\Exception $e) {
            $this->error("Error al abrir el archivo Excel: " . $e->getMessage());
            return 1;
        }

        $updated = 0;
        $notFound = 0;

        // Obtener todos los turnos importados desde Excel
        $appointments = Appointment::where('notes', 'like', '%Importado desde Excel 2025%')
            ->with('patient')
            ->get();

        $this->info("Total de turnos a revisar: " . $appointments->count());
        $this->newLine();

        $bar = $this->output->createProgressBar($appointments->count());
        $bar->start();

        foreach ($appointments as $appointment) {
            // Buscar en todas las hojas
            $found = false;
            
            for ($sheetIndex = 1; $sheetIndex <= 52; $sheetIndex++) {
                $sheetName = "Hoja{$sheetIndex}";
                
                if (!$spreadsheet->sheetNameExists($sheetName)) {
                    continue;
                }

                $sheet = $spreadsheet->getSheetByName($sheetName);
                $data = $sheet->toArray();
                
                if (empty($data) || count($data) < 2) {
                    continue;
                }

                // Buscar la fecha del turno en la hoja
                $appointmentDate = Carbon::parse($appointment->datetime_start);
                $dateRow = $data[1] ?? [];
                $targetCol = null;

                // Encontrar la columna con la fecha del turno
                foreach ($dateRow as $colIndex => $cellValue) {
                    if ($colIndex == 0) continue;
                    
                    $dateStr = $this->extractDateFromCell($cellValue, 2025);
                    if ($dateStr && Carbon::parse($dateStr)->isSameDay($appointmentDate)) {
                        $targetCol = $colIndex;
                        break;
                    }
                }

                if (!$targetCol) {
                    continue;
                }

                // Buscar la fila con el tiempo y nombre del paciente
                $appointmentTime = $appointmentDate->format('H:i');
                $patientName = strtolower(trim($appointment->patient->first_name . ' ' . $appointment->patient->last_name));
                $cleanedPatientName = strtolower($this->cleanName($patientName));
                $patientFirstName = strtolower(trim($appointment->patient->first_name));

                $lastValidTime = null;

                for ($rowIndex = 2; $rowIndex < count($data); $rowIndex++) {
                    $row = $data[$rowIndex];
                    if (empty($row)) continue;

                    // Obtener el tiempo de la fila (igual que en el import)
                    $timeCell = $row[0] ?? null;
                    if (!empty($timeCell)) {
                        $rowTime = $this->parseTime($timeCell);
                        if ($rowTime) {
                            $lastValidTime = $rowTime;
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

                    // Comparar tiempo (solo horas y minutos)
                    $rowTimeFormatted = substr($lastValidTime, 0, 5); // HH:MM
                    if ($rowTimeFormatted !== $appointmentTime) {
                        continue;
                    }

                    // Verificar el nombre en la columna
                    $cellValue = trim((string)($row[$targetCol] ?? ''));
                    if (empty($cellValue) || strtolower($cellValue) === 'nan' || strlen($cellValue) < 2) {
                        continue;
                    }

                    $cleanedCellValue = strtolower($this->cleanName($cellValue));
                    
                    // Matching más flexible de nombres
                    $nameMatches = false;
                    
                    // Coincidencia exacta después de limpiar
                    if ($cleanedCellValue === $cleanedPatientName) {
                        $nameMatches = true;
                    }
                    // El nombre limpio contiene el nombre del paciente o viceversa
                    elseif (strpos($cleanedCellValue, $cleanedPatientName) !== false || 
                            strpos($cleanedPatientName, $cleanedCellValue) !== false) {
                        $nameMatches = true;
                    }
                    // Coincidencia por primer nombre (más flexible)
                    elseif (!empty($patientFirstName) && strlen($patientFirstName) >= 3 &&
                            (strpos($cleanedCellValue, $patientFirstName) !== false)) {
                        $nameMatches = true;
                    }

                    if ($nameMatches) {
                        // Encontré la celda, verificar su color
                        $excelRow = $rowIndex + 1;
                        $excelCol = Coordinate::stringFromColumnIndex($targetCol + 1);
                        $cellCoordinate = $excelCol . $excelRow;

                            $tipoStr = $this->detectCellType($sheet, $cellCoordinate);

                            if ($tipoStr) {
                                // Convertir tipo de texto a valor del enum
                                $tipoValue = 'normal';
                                if ($tipoStr === 'Cirugía') {
                                    $tipoValue = 'cirugia';
                                } elseif ($tipoStr === 'Trabajo de Laboratorio') {
                                    $tipoValue = 'trabajo_laboratorio';
                                }
                                
                                $appointment->tipo = $tipoValue;
                                $appointment->save();
                                $updated++;
                                $found = true;
                                break 2;
                            }
                    }
                }
            }

            if (!$found) {
                $notFound++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        $this->info("✅ Actualización completada!");
        $this->table(
            ['Concepto', 'Cantidad'],
            [
                ['Turnos actualizados', $updated],
                ['Turnos no encontrados en Excel', $notFound],
                ['Total procesado', $appointments->count()],
            ]
        );

        return 0;
    }

    protected function parseTime($timeStr)
    {
        if (empty($timeStr)) {
            return null;
        }

        try {
            $formats = ['H:i:s', 'H:i', 'G:i:s', 'G:i'];
            
            foreach ($formats as $format) {
                try {
                    $time = Carbon::createFromFormat($format, $timeStr);
                    return $time->format('H:i:s');
                } catch (\Exception $e) {
                    continue;
                }
            }

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
        
        if (is_numeric($cellValue)) {
            try {
                $date = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($cellValue);
                if ($date->format('Y') == $year) {
                    return $date->format('Y-m-d');
                }
            } catch (\Exception $e) {
            }
        }

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

        if (preg_match('/^(\d{1,2})[\/-]([a-z]+)$/i', $cellStr, $matches)) {
            $day = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
            $monthName = strtolower($matches[2]);
            
            if (isset($months[$monthName])) {
                return "{$year}-{$months[$monthName]}-{$day}";
            }
        }

        try {
            $date = Carbon::parse($cellStr);
            if ($date->year == $year || $date->year == 1900) {
                if ($date->year == 1900) {
                    $date->year = $year;
                }
                return $date->format('Y-m-d');
            }
        } catch (\Exception $e) {
        }

        return null;
    }

    protected function cleanName($name)
    {
        if (empty($name) || !is_string($name)) {
            return '';
        }

        $name = trim($name);
        
        if (strpos($name, '-') !== false) {
            $parts = explode('-', $name);
            $name = trim($parts[0]);
        }
        
        $name = preg_replace('/\(?\d{2,4}\)?\s*-?\s*\d{4}\s*-?\s*\d{4}/', '', $name);
        $name = preg_replace('/\d{10,11}/', '', $name);
        $name = preg_replace('/DNI\s*:?\s*\d{7,8}/i', '', $name);
        $name = preg_replace('/\d{7,8}\s*\(?DNI\)?/i', '', $name);
        $name = preg_replace('/\b\d{7,}\b/', '', $name);
        $name = preg_replace('/^[^\w]+|[^\w]+$/', '', $name);
        
        $words = explode(' ', $name);
        $words = array_map(function($word) {
            return ucfirst(mb_strtolower(trim($word)));
        }, $words);
        $name = implode(' ', array_filter($words));
        $name = preg_replace('/\s+/', ' ', $name);
        
        return trim($name);
    }

    protected function detectCellType($sheet, $cellCoordinate)
    {
        try {
            $style = $sheet->getStyle($cellCoordinate);
            $fill = $style->getFill();
            
            if ($fill->getFillType() === \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_NONE) {
                return null;
            }
            
            $fillColor = strtoupper($fill->getStartColor()->getRGB());
            
            if ($fillColor === 'FFFFFF' || $fillColor === '000000') {
                return null;
            }
            
            // FF0000 = Rojo = Cirugía
            // 00B050 = Verde esmeralda = Trabajo de Laboratorio
            
            if ($fillColor === 'FF0000' || 
                (substr($fillColor, 0, 2) === 'FF' && 
                 hexdec(substr($fillColor, 2, 2)) < 50 && 
                 hexdec(substr($fillColor, 4, 2)) < 50)) {
                return 'Cirugía';
            }
            
            if ($fillColor === '00B050' ||
                (substr($fillColor, 0, 2) === '00' && 
                 hexdec(substr($fillColor, 2, 2)) > 100)) {
                return 'Trabajo de Laboratorio';
            }
            
            $red = hexdec(substr($fillColor, 0, 2));
            $green = hexdec(substr($fillColor, 2, 2));
            $blue = hexdec(substr($fillColor, 4, 2));
            
            if ($red > 240 && $green > 240 && $blue < 50) {
                return 'Trabajo de Laboratorio';
            }
            
            if ($red < 50 && $green > 150) {
                return 'Trabajo de Laboratorio';
            }
            
            if ($red > 200 && $green < 100 && $blue < 100) {
                return 'Cirugía';
            }
            
            return null;
        } catch (\Exception $e) {
            return null;
        }
    }
}

