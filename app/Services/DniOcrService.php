<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class DniOcrService
{
    /**
     * Extrae datos del DNI desde las imágenes del frente y dorso
     */
    public function extractFromImages(?UploadedFile $frontImage, ?UploadedFile $backImage): array
    {
        $data = [
            'first_name' => null,
            'last_name' => null,
            'dni' => null,
            'birth_date' => null,
            'gender' => null,
            'address' => null,
            'document_number' => null,
            'document_type' => 'DNI',
        ];

        // Procesar imagen del frente (contiene nombre, apellido, DNI, fecha de nacimiento, etc.)
        if ($frontImage) {
            $frontData = $this->processFrontImage($frontImage);
            $data = array_merge($data, array_filter($frontData));
        }

        // Procesar imagen del dorso (contiene dirección)
        if ($backImage) {
            $backData = $this->processBackImage($backImage);
            $data = array_merge($data, array_filter($backData));
        }

        return $data;
    }

    /**
     * Procesa la imagen del frente del DNI
     */
    private function processFrontImage(UploadedFile $image): array
    {
        $text = $this->extractText($image);
        
        return [
            'first_name' => $this->extractFirstName($text),
            'last_name' => $this->extractLastName($text),
            'dni' => $this->extractDni($text),
            'birth_date' => $this->extractBirthDate($text),
            'gender' => $this->extractGender($text),
            'document_number' => $this->extractDocumentNumber($text),
        ];
    }

    /**
     * Procesa la imagen del dorso del DNI
     */
    private function processBackImage(UploadedFile $image): array
    {
        $text = $this->extractText($image);
        
        return [
            'address' => $this->extractAddress($text),
        ];
    }

    /**
     * Extrae texto de la imagen usando OCR
     */
    private function extractText(UploadedFile $image): string
    {
        // Intentar usar Google Cloud Vision API si está configurado
        if (config('services.google_vision.enabled', false)) {
            return $this->extractWithGoogleVision($image);
        }

        // Fallback: usar Tesseract OCR si está disponible
        if (config('services.tesseract.enabled', false)) {
            return $this->extractWithTesseract($image);
        }

        // Si no hay OCR configurado, retornar vacío
        Log::warning('OCR no configurado. Por favor, configura Google Vision API o Tesseract.');
        return '';
    }

    /**
     * Extrae texto usando Google Cloud Vision API
     */
    private function extractWithGoogleVision(UploadedFile $image): string
    {
        try {
            $apiKey = config('services.google_vision.api_key');
            if (!$apiKey) {
                throw new \Exception('Google Vision API key no configurada');
            }

            $imageContent = base64_encode(file_get_contents($image->getRealPath()));

            $response = Http::post("https://vision.googleapis.com/v1/images:annotate?key={$apiKey}", [
                'requests' => [
                    [
                        'image' => [
                            'content' => $imageContent,
                        ],
                        'features' => [
                            [
                                'type' => 'TEXT_DETECTION',
                                'maxResults' => 1,
                            ],
                        ],
                    ],
                ],
            ]);

            if ($response->successful()) {
                $annotations = $response->json('responses.0.textAnnotations', []);
                if (!empty($annotations)) {
                    return $annotations[0]['description'] ?? '';
                }
            }

            Log::error('Error en Google Vision API', ['response' => $response->body()]);
            return '';
        } catch (\Exception $e) {
            Log::error('Error procesando imagen con Google Vision', ['error' => $e->getMessage()]);
            return '';
        }
    }

    /**
     * Extrae texto usando Tesseract OCR
     */
    private function extractWithTesseract(UploadedFile $image): string
    {
        try {
            $tesseractPath = config('services.tesseract.path', 'tesseract');
            $tempPath = $image->getRealPath();
            
            $command = escapeshellcmd($tesseractPath) . ' ' . escapeshellarg($tempPath) . ' stdout -l spa 2>/dev/null';
            $output = shell_exec($command);
            
            return $output ? trim($output) : '';
        } catch (\Exception $e) {
            Log::error('Error procesando imagen con Tesseract', ['error' => $e->getMessage()]);
            return '';
        }
    }

    /**
     * Extrae el nombre del texto OCR
     */
    private function extractFirstName(string $text): ?string
    {
        // Patrones comunes en DNI argentino
        // El nombre generalmente aparece después de "NOMBRE" o "APELLIDO"
        if (preg_match('/NOMBRE[:\s]+([A-ZÁÉÍÓÚÑ\s]+)/i', $text, $matches)) {
            $name = trim($matches[1]);
            // Separar nombre y apellido si están juntos
            $parts = explode(' ', $name);
            return !empty($parts) ? $parts[0] : null;
        }
        
        // Buscar patrones alternativos
        if (preg_match('/^([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)/', $text, $matches)) {
            return trim($matches[1]);
        }
        
        return null;
    }

    /**
     * Extrae el apellido del texto OCR
     */
    private function extractLastName(string $text): ?string
    {
        // Buscar después de "APELLIDO"
        if (preg_match('/APELLIDO[:\s]+([A-ZÁÉÍÓÚÑ\s]+)/i', $text, $matches)) {
            return trim($matches[1]);
        }
        
        // Si encontramos nombre completo, tomar la segunda parte
        if (preg_match('/NOMBRE[:\s]+([A-ZÁÉÍÓÚÑ\s]+)\s+([A-ZÁÉÍÓÚÑ\s]+)/i', $text, $matches)) {
            return trim($matches[2]);
        }
        
        return null;
    }

    /**
     * Extrae el DNI del texto OCR
     */
    private function extractDni(string $text): ?string
    {
        // Buscar número de DNI (generalmente 7-8 dígitos)
        if (preg_match('/DNI[:\s]*(\d{7,8})/i', $text, $matches)) {
            return $matches[1];
        }
        
        // Buscar patrones alternativos
        if (preg_match('/(\d{7,8})/', $text, $matches)) {
            return $matches[1];
        }
        
        return null;
    }

    /**
     * Extrae la fecha de nacimiento del texto OCR
     */
    private function extractBirthDate(string $text): ?string
    {
        // Buscar fecha en formato DD/MM/YYYY o DD-MM-YYYY
        if (preg_match('/NACIMIENTO[:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i', $text, $matches)) {
            $date = str_replace('-', '/', $matches[1]);
            return $this->formatDate($date);
        }
        
        // Buscar patrones alternativos
        if (preg_match('/(\d{2}[\/\-]\d{2}[\/\-]\d{4})/', $text, $matches)) {
            $date = str_replace('-', '/', $matches[1]);
            return $this->formatDate($date);
        }
        
        return null;
    }

    /**
     * Extrae el género del texto OCR
     */
    private function extractGender(string $text): ?string
    {
        if (preg_match('/SEXO[:\s]+([MF])/i', $text, $matches)) {
            return strtoupper($matches[1]) === 'M' ? 'masculino' : 'femenino';
        }
        
        return null;
    }

    /**
     * Extrae la dirección del texto OCR (del dorso)
     */
    private function extractAddress(string $text): ?string
    {
        // Buscar después de "DOMICILIO" o "DIRECCIÓN"
        if (preg_match('/(?:DOMICILIO|DIRECCI[ÓO]N)[:\s]+([A-Z0-9\s,\.]+)/i', $text, $matches)) {
            return trim($matches[1]);
        }
        
        // Buscar líneas que parezcan direcciones
        $lines = explode("\n", $text);
        foreach ($lines as $line) {
            if (preg_match('/[A-Z][a-z]+\s+\d+/', $line)) {
                return trim($line);
            }
        }
        
        return null;
    }

    /**
     * Extrae el número de documento (diferente del DNI en algunos casos)
     */
    private function extractDocumentNumber(string $text): ?string
    {
        // Similar a extractDni pero puede tener formato diferente
        if (preg_match('/DOC[:\s]*N[°º\.]*[:\s]*(\d{7,9})/i', $text, $matches)) {
            return $matches[1];
        }
        
        return $this->extractDni($text);
    }

    /**
     * Formatea la fecha al formato YYYY-MM-DD
     */
    private function formatDate(string $date): ?string
    {
        try {
            $parts = explode('/', $date);
            if (count($parts) === 3) {
                $day = $parts[0];
                $month = $parts[1];
                $year = $parts[2];
                
                // Validar que sea una fecha válida
                if (checkdate((int)$month, (int)$day, (int)$year)) {
                    return sprintf('%04d-%02d-%02d', $year, $month, $day);
                }
            }
        } catch (\Exception $e) {
            Log::error('Error formateando fecha', ['date' => $date, 'error' => $e->getMessage()]);
        }
        
        return null;
    }
}
