import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Función para extraer datos del texto OCR del DNI argentino
function parseDNIData(text: string): {
  firstName?: string;
  lastName?: string;
  dni?: string;
  birthDate?: string;
  address?: string;
} {
  const data: any = {};
  const normalizedText = text.toUpperCase();
  const lines = text.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);

  // Buscar DNI (número de documento) - formato típico: DNI: 12345678 o solo el número
  // Buscar números de 7 u 8 dígitos que no sean fechas
  const dniPatterns = [
    /DNI[:\s]*(\d{7,8})/i,
    /DOC[:\s]*(\d{7,8})/i,
    /\b(\d{7,8})\b/,
  ];
  
  for (const pattern of dniPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      const dni = match[1];
      // Verificar que no sea parte de una fecha
      if (!normalizedText.includes(`/${dni}/`) && !normalizedText.includes(`-${dni}-`)) {
        data.dni = dni;
        break;
      }
    }
  }

  // Buscar nombres (generalmente en las primeras líneas)
  // Formato típico del DNI argentino: APELLIDO, NOMBRE o APELLIDO NOMBRE
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i];
    const upperLine = line.toUpperCase();
    
    // Saltar líneas que son claramente no nombres
    if (upperLine.includes("DNI") || upperLine.includes("DOCUMENTO") || 
        upperLine.includes("NACIONAL") || upperLine.includes("IDENTIDAD") ||
        /^\d+$/.test(line) || upperLine.includes("ARGENTINA")) {
      continue;
    }
    
    // Buscar formato "APELLIDO, NOMBRE"
    const nameMatchComma = line.match(/^([A-ZÁÉÍÓÚÑÜ\s]+),\s*([A-ZÁÉÍÓÚÑÜ\s]+)$/i);
    if (nameMatchComma && nameMatchComma[1].length > 2 && nameMatchComma[2].length > 2) {
      data.lastName = nameMatchComma[1].trim();
      data.firstName = nameMatchComma[2].trim();
      break;
    }
    
    // Buscar formato "APELLIDO NOMBRE" (sin coma)
    // Generalmente el apellido son las primeras palabras y el nombre la última
    const words = line.split(/\s+/).filter(w => w.length > 0);
    if (words.length >= 2 && words.every((w) => /^[A-ZÁÉÍÓÚÑÜ]+$/i.test(w))) {
      // Si hay 2 palabras, primera es apellido, segunda es nombre
      // Si hay más, las últimas 1-2 son nombre, el resto apellido
      if (words.length === 2) {
        data.lastName = words[0];
        data.firstName = words[1];
        break;
      } else if (words.length >= 3) {
        // Última palabra es nombre, el resto apellido
        data.lastName = words.slice(0, -1).join(" ");
        data.firstName = words[words.length - 1];
        break;
      }
    }
  }

  // Buscar fecha de nacimiento (formato DD/MM/YYYY o DD-MM-YYYY)
  // Buscar patrones de fecha que no sean parte de otros números
  const datePatterns = [
    /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/,
    /\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b/,
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]);
      const year = parseInt(match[3]);
      
      // Validar que sea una fecha razonable
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= new Date().getFullYear()) {
        data.birthDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        break;
      }
    }
  }

  // Buscar dirección (generalmente contiene palabras clave)
  const addressKeywords = ["CALLE", "AV", "AVENIDA", "NRO", "N°", "NUMERO", "DEPTO", "PISO", "CP", "CODIGO POSTAL"];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upperLine = line.toUpperCase();
    
    // Buscar líneas que contengan palabras clave de dirección
    if (addressKeywords.some((keyword) => upperLine.includes(keyword))) {
      // Tomar la línea completa y posiblemente la siguiente
      let address = line;
      if (i + 1 < lines.length && lines[i + 1].length > 5) {
        address += ", " + lines[i + 1];
      }
      data.address = address;
      break;
    }
  }

  return data;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const frontFile = formData.get("front") as File;
    const backFile = formData.get("back") as File | null;

    if (!frontFile) {
      return NextResponse.json(
        { error: "Front image is required" },
        { status: 400 }
      );
    }

    // Convertir imágenes a base64 para enviar a OCR
    const frontBuffer = await frontFile.arrayBuffer();
    const frontBase64 = Buffer.from(frontBuffer).toString("base64");
    
    let backBase64: string | null = null;
    if (backFile) {
      const backBuffer = await backFile.arrayBuffer();
      backBase64 = Buffer.from(backBuffer).toString("base64");
    }

    // Por ahora, retornamos un mensaje indicando que se necesita configurar OCR
    // El usuario puede usar Google Cloud Vision API o Tesseract.js
    // Por simplicidad, vamos a usar una solución híbrida:
    // 1. Si hay GOOGLE_CLOUD_VISION_API_KEY, usar Google Cloud Vision
    // 2. Si no, usar Tesseract.js (requiere instalación)

    // Opción 1: Google Cloud Vision API
    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    
    if (!apiKey) {
      console.error("GOOGLE_CLOUD_VISION_API_KEY no está configurada");
      return NextResponse.json(
        {
          error:
            "OCR no configurado. Por favor configura GOOGLE_CLOUD_VISION_API_KEY en las variables de entorno de Vercel.",
        },
        { status: 501 }
      );
    }

    try {
      const visionResponse = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requests: [
              {
                image: { content: frontBase64 },
                features: [{ type: "TEXT_DETECTION" }],
              },
              ...(backBase64
                ? [
                    {
                      image: { content: backBase64 },
                      features: [{ type: "TEXT_DETECTION" }],
                    },
                  ]
                : []),
            ],
          }),
        }
      );

      if (!visionResponse.ok) {
        let errorText = "";
        let errorJson: any = null;
        
        try {
          errorText = await visionResponse.text();
          errorJson = JSON.parse(errorText);
        } catch {
          // Si no es JSON, usar el texto tal cual
        }
        
        const errorMessage = errorJson?.error?.message || errorText || visionResponse.statusText;
        
        console.error("Google Vision API error:", {
          status: visionResponse.status,
          statusText: visionResponse.statusText,
          error: errorMessage,
          fullError: errorJson || errorText,
        });
        
        // Si es un error de autenticación, dar un mensaje más específico
        if (visionResponse.status === 401 || visionResponse.status === 403) {
          const detailedError = errorJson?.error?.message || errorMessage;
          
          // Detectar el error específico de API Key vinculada a cuenta de servicio
          if (detailedError?.includes("API keys are not supported") || 
              detailedError?.includes("Expected OAuth2 access token")) {
            return NextResponse.json(
              {
                error: `Tu API Key está vinculada a una cuenta de servicio y no puede usarse directamente con la API REST.

**Solución rápida (Recomendada):**
1. Ve a Google Cloud Console > APIs & Services > Credentials
2. Haz clic en "Create Credentials" > "API Key"
3. En la nueva API Key, asegúrate de que NO esté vinculada a ninguna cuenta de servicio
4. En "API restrictions", selecciona "Restrict key" y agrega "Cloud Vision API"
5. Actualiza la variable GOOGLE_CLOUD_VISION_API_KEY en Vercel con la nueva clave

**Solución alternativa (Con credenciales JSON):**
Si prefieres usar las credenciales de tu cuenta de servicio, configura GOOGLE_APPLICATION_CREDENTIALS_JSON con el contenido JSON completo de tu archivo de credenciales.`,
                details: detailedError,
              },
              { status: 401 }
            );
          }
          
          return NextResponse.json(
            {
              error: `API Key inválida o sin permisos: ${detailedError}. Verifica que:
1. La API Key esté correctamente copiada en Vercel (sin espacios al inicio/final)
2. Cloud Vision API esté habilitada en tu proyecto de Google Cloud
3. La API Key tenga permisos para Cloud Vision API
4. No haya restricciones de IP/HTTP referrer bloqueando Vercel`,
              details: detailedError,
            },
            { status: 401 }
          );
        }
        
        throw new Error(`Google Vision API error: ${visionResponse.status} ${errorMessage}`);
      }

      const visionData = await visionResponse.json();
      
      // Verificar si hay errores en la respuesta
      if (visionData.responses && visionData.responses[0]?.error) {
        console.error("Google Vision API response error:", visionData.responses[0].error);
        return NextResponse.json(
          {
            error: `Error de Google Vision API: ${visionData.responses[0].error.message || "Error desconocido"}`,
          },
          { status: 400 }
        );
      }
      
      let fullText = "";

      if (visionData.responses) {
        visionData.responses.forEach((response: any) => {
          if (response.fullTextAnnotation?.text) {
            fullText += response.fullTextAnnotation.text + "\n";
          }
        });
      }

      if (!fullText.trim()) {
        return NextResponse.json(
          {
            error: "No se pudo extraer texto de las imágenes. Por favor verifica que las imágenes sean claras y legibles.",
          },
          { status: 400 }
        );
      }

      const extractedData = parseDNIData(fullText);
      return NextResponse.json(extractedData);
    } catch (error: any) {
      console.error("Error procesando con Google Vision API:", error);
      return NextResponse.json(
        {
          error: `Error al procesar las imágenes: ${error.message || "Error desconocido"}`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing DNI:", error);
    return NextResponse.json(
      { error: "Error processing DNI images" },
      { status: 500 }
    );
  }
}
