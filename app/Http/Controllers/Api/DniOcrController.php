<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DniOcrService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DniOcrController extends Controller
{
    public function __construct(
        protected DniOcrService $ocrService
    ) {}

    /**
     * Procesa las imágenes del DNI y extrae los datos
     */
    public function process(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'front_image' => 'nullable|image|mimes:jpeg,jpg,png|max:5120', // 5MB max
            'back_image' => 'nullable|image|mimes:jpeg,jpg,png|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $frontImage = $request->hasFile('front_image') ? $request->file('front_image') : null;
            $backImage = $request->hasFile('back_image') ? $request->file('back_image') : null;

            if (!$frontImage && !$backImage) {
                return response()->json([
                    'success' => false,
                    'message' => 'Debes subir al menos una imagen (frente o dorso)',
                ], 422);
            }

            $data = $this->ocrService->extractFromImages($frontImage, $backImage);

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al procesar las imágenes: ' . $e->getMessage(),
            ], 500);
        }
    }
}
