<?php

namespace Database\Seeders;

use App\Models\Treatment;
use Illuminate\Database\Seeder;

class TreatmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $treatments = [
            // 1. Diagnóstico y Prevención
            ['name' => 'Consulta odontológica general', 'description' => 'Consulta odontológica general', 'duration_minutes' => 30],
            ['name' => 'Diagnóstico integral + plan de tratamiento', 'description' => 'Diagnóstico integral con plan de tratamiento', 'duration_minutes' => 45],
            ['name' => 'Control periódico', 'description' => 'Control periódico de rutina', 'duration_minutes' => 30],
            ['name' => 'Limpieza dental / profilaxis', 'description' => 'Limpieza dental y profilaxis', 'duration_minutes' => 45],
            ['name' => 'Tartrectomía (limpieza profunda)', 'description' => 'Tartrectomía - limpieza profunda', 'duration_minutes' => 60],
            ['name' => 'Fluorización', 'description' => 'Aplicación de flúor', 'duration_minutes' => 20],
            ['name' => 'Selladores de fosas y fisuras', 'description' => 'Aplicación de selladores de fosas y fisuras', 'duration_minutes' => 30],
            ['name' => 'Radiografía periapical', 'description' => 'Radiografía periapical', 'duration_minutes' => 10],
            ['name' => 'Radiografía panorámica (ortopantomografía)', 'description' => 'Radiografía panorámica u ortopantomografía', 'duration_minutes' => 15],
            ['name' => 'Fotografías clínicas', 'description' => 'Toma de fotografías clínicas', 'duration_minutes' => 15],
            ['name' => 'Evaluación odontopediátrica', 'description' => 'Evaluación odontopediátrica', 'duration_minutes' => 30],

            // 2. Operatoria / Restauradora
            ['name' => 'Obturación de resina (composite) – pieza anterior', 'description' => 'Obturación de resina composite en pieza anterior', 'duration_minutes' => 45],
            ['name' => 'Obturación de resina – pieza posterior', 'description' => 'Obturación de resina composite en pieza posterior', 'duration_minutes' => 60],
            ['name' => 'Obturación de amalgama', 'description' => 'Obturación con amalgama', 'duration_minutes' => 45],
            ['name' => 'Reconstrucción de ángulo', 'description' => 'Reconstrucción de ángulo dental', 'duration_minutes' => 60],
            ['name' => 'Restauración estética con resina', 'description' => 'Restauración estética con resina', 'duration_minutes' => 90],
            ['name' => 'Incrustación (inlay / onlay)', 'description' => 'Incrustación inlay u onlay', 'duration_minutes' => 90],
            ['name' => 'Carillas directas de resina', 'description' => 'Carillas directas de resina', 'duration_minutes' => 120],

            // 3. Endodoncia (Tratamiento de Conducto)
            ['name' => 'Endodoncia unirradicular', 'description' => 'Endodoncia en pieza unirradicular', 'duration_minutes' => 90],
            ['name' => 'Endodoncia birradicular', 'description' => 'Endodoncia en pieza birradicular', 'duration_minutes' => 120],
            ['name' => 'Endodoncia multirradicular', 'description' => 'Endodoncia en pieza multirradicular', 'duration_minutes' => 150],
            ['name' => 'Retratamiento endodóntico', 'description' => 'Retratamiento endodóntico', 'duration_minutes' => 120],
            ['name' => 'Biopulpectomía', 'description' => 'Biopulpectomía', 'duration_minutes' => 60],
            ['name' => 'Pulpotomía (odontopediatría)', 'description' => 'Pulpotomía en odontopediatría', 'duration_minutes' => 45],

            // 4. Periodoncia
            ['name' => 'Tratamiento periodontal básico', 'description' => 'Tratamiento periodontal básico', 'duration_minutes' => 60],
            ['name' => 'Raspado y alisado radicular por cuadrante', 'description' => 'Raspado y alisado radicular por cuadrante', 'duration_minutes' => 90],
            ['name' => 'Mantenimiento periodontal', 'description' => 'Mantenimiento periodontal', 'duration_minutes' => 45],
            ['name' => 'Curetaje abierto / cirugía periodontal', 'description' => 'Curetaje abierto o cirugía periodontal', 'duration_minutes' => 120],
            ['name' => 'Gingivectomía', 'description' => 'Gingivectomía', 'duration_minutes' => 60],
            ['name' => 'Injerto gingival', 'description' => 'Injerto gingival', 'duration_minutes' => 90],

            // 5. Cirugía
            ['name' => 'Extracción simple', 'description' => 'Extracción dental simple', 'duration_minutes' => 30],
            ['name' => 'Extracción compleja', 'description' => 'Extracción dental compleja', 'duration_minutes' => 60],
            ['name' => 'Extracción de cordal / muela de juicio (simple)', 'description' => 'Extracción de cordal o muela de juicio simple', 'duration_minutes' => 45],
            ['name' => 'Extracción de cordal incluida', 'description' => 'Extracción de cordal incluida', 'duration_minutes' => 90],
            ['name' => 'Regularización ósea', 'description' => 'Regularización ósea', 'duration_minutes' => 60],
            ['name' => 'Cirugía periapical', 'description' => 'Cirugía periapical', 'duration_minutes' => 90],
            ['name' => 'Frenectomía', 'description' => 'Frenectomía', 'duration_minutes' => 30],
            ['name' => 'Biopsia', 'description' => 'Biopsia', 'duration_minutes' => 30],
            ['name' => 'Implante dental (unidad)', 'description' => 'Colocación de implante dental (una unidad)', 'duration_minutes' => 120],
            ['name' => 'Colocación de pilar + corona sobre implante', 'description' => 'Colocación de pilar y corona sobre implante', 'duration_minutes' => 90],

            // 6. Prótesis Fija
            ['name' => 'Corona metal-porcelana', 'description' => 'Corona de metal-porcelana', 'duration_minutes' => 90],
            ['name' => 'Corona de zirconio', 'description' => 'Corona de zirconio', 'duration_minutes' => 90],
            ['name' => 'Corona de porcelana pura', 'description' => 'Corona de porcelana pura', 'duration_minutes' => 90],
            ['name' => 'Puente fijo 3 piezas', 'description' => 'Puente fijo de 3 piezas', 'duration_minutes' => 120],
            ['name' => 'Carilla de porcelana', 'description' => 'Carilla de porcelana', 'duration_minutes' => 90],

            // 6. Prótesis Removible
            ['name' => 'Prótesis parcial acrílica', 'description' => 'Prótesis parcial acrílica', 'duration_minutes' => 90],
            ['name' => 'Prótesis parcial metálica (esquelética)', 'description' => 'Prótesis parcial metálica esquelética', 'duration_minutes' => 120],
            ['name' => 'Prótesis completa superior', 'description' => 'Prótesis completa superior', 'duration_minutes' => 120],
            ['name' => 'Prótesis completa inferior', 'description' => 'Prótesis completa inferior', 'duration_minutes' => 120],
            ['name' => 'Reparación de prótesis', 'description' => 'Reparación de prótesis', 'duration_minutes' => 60],
            ['name' => 'Rebase de prótesis', 'description' => 'Rebase de prótesis', 'duration_minutes' => 90],

            // 7. Ortodoncia
            ['name' => 'Evaluación y diagnóstico ortodóncico', 'description' => 'Evaluación y diagnóstico ortodóncico', 'duration_minutes' => 60],
            ['name' => 'Tratamiento ortodoncia con brackets metálicos', 'description' => 'Control de ortodoncia con brackets metálicos', 'duration_minutes' => 45],
            ['name' => 'Tratamiento ortodoncia con brackets estéticos', 'description' => 'Control de ortodoncia con brackets estéticos', 'duration_minutes' => 45],
            ['name' => 'Ortodoncia lingual', 'description' => 'Control de ortodoncia lingual', 'duration_minutes' => 45],
            ['name' => 'Contención fija', 'description' => 'Colocación de contención fija', 'duration_minutes' => 30],
            ['name' => 'Contención removible', 'description' => 'Fabricación de contención removible', 'duration_minutes' => 60],
            ['name' => 'Control mensual de ortodoncia', 'description' => 'Control mensual de ortodoncia', 'duration_minutes' => 30],
            ['name' => 'Alineadores transparentes (plan)', 'description' => 'Evaluación y plan de tratamiento con alineadores transparentes', 'duration_minutes' => 60],

            // 8. Odontopediatría
            ['name' => 'Adaptación y consulta inicial (odontopediatría)', 'description' => 'Adaptación y consulta inicial en odontopediatría', 'duration_minutes' => 30],
            ['name' => 'Selladores (odontopediatría)', 'description' => 'Selladores en odontopediatría', 'duration_minutes' => 30],
            ['name' => 'Fluorización (odontopediatría)', 'description' => 'Fluorización en odontopediatría', 'duration_minutes' => 20],
            ['name' => 'Restauración en resina (odontopediatría)', 'description' => 'Restauración en resina en odontopediatría', 'duration_minutes' => 45],
            ['name' => 'Pulpotomía (odontopediatría)', 'description' => 'Pulpotomía en odontopediatría', 'duration_minutes' => 45],
            ['name' => 'Pulpectomía (odontopediatría)', 'description' => 'Pulpectomía en odontopediatría', 'duration_minutes' => 60],
            ['name' => 'Corona pediátrica metálica', 'description' => 'Colocación de corona pediátrica metálica', 'duration_minutes' => 60],
            ['name' => 'Extracción pediátrica', 'description' => 'Extracción dental en odontopediatría', 'duration_minutes' => 30],

            // 9. Estética Dental
            ['name' => 'Blanqueamiento dental en consultorio', 'description' => 'Blanqueamiento dental en consultorio', 'duration_minutes' => 90],
            ['name' => 'Blanqueamiento dental domiciliario', 'description' => 'Evaluación y plan para blanqueamiento dental domiciliario', 'duration_minutes' => 30],
            ['name' => 'Carillas de porcelana (estética)', 'description' => 'Carillas de porcelana para estética', 'duration_minutes' => 120],
            ['name' => 'Carillas de resina (estética)', 'description' => 'Carillas de resina para estética', 'duration_minutes' => 120],
            ['name' => 'Contorno estético', 'description' => 'Contorno estético dental', 'duration_minutes' => 30],
            ['name' => 'Diseño de sonrisa (evaluación + mockup)', 'description' => 'Diseño de sonrisa con evaluación y mockup', 'duration_minutes' => 90],

            // 10. Urgencias
            ['name' => 'Apertura cameral', 'description' => 'Apertura cameral de urgencia', 'duration_minutes' => 30],
            ['name' => 'Control de dolor', 'description' => 'Control de dolor de urgencia', 'duration_minutes' => 30],
            ['name' => 'Tratamiento de absceso', 'description' => 'Tratamiento de absceso dental', 'duration_minutes' => 45],
            ['name' => 'Reparación de fractura dental', 'description' => 'Reparación de fractura dental de urgencia', 'duration_minutes' => 60],
            ['name' => 'Recementado de corona o puente', 'description' => 'Recementado de corona o puente', 'duration_minutes' => 30],
            ['name' => 'Hemostasia', 'description' => 'Control hemostático', 'duration_minutes' => 20],
        ];

        foreach ($treatments as $treatment) {
            Treatment::updateOrCreate(
                ['name' => $treatment['name']],
                [
                    'description' => $treatment['description'],
                    'price' => 0, // Precio por defecto, se configurará después
                    'duration_minutes' => $treatment['duration_minutes'],
                    'active' => true,
                ]
            );
        }
    }
}
