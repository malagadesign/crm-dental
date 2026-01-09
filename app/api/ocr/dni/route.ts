import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Función para extraer datos del texto OCR del DNI argentino
function parseDNIData(frontText: string, backText: string = ""): {
  firstName?: string;
  lastName?: string;
  dni?: string;
  birthDate?: string;
  address?: string;
} {
  const data: any = {};
  const normalizedFrontText = frontText.toUpperCase();
  const normalizedBackText = backText.toUpperCase();
  const frontLines = frontText.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
  const backLines = backText.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);

  console.log("[Parser] Texto del FRENTE recibido:", frontText.substring(0, 1000));
  console.log("[Parser] Líneas del frente encontradas:", frontLines.length);
  if (backText) {
    console.log("[Parser] Texto del DORSO recibido:", backText.substring(0, 500));
    console.log("[Parser] Líneas del dorso encontradas:", backLines.length);
  }

  // 1. BUSCAR APELLIDO (SURNAME) - Solo en el FRENTE
  // Formato típico: "APELLIDO / Surname: ORDOÑEZ KRASNOWSKI" o "APELLIDO: ORDOÑEZ KRASNOWSKI"
  const surnamePatterns = [
    /(?:APELLIDO|SURNAME)(?:\s*\/\s*[A-Z]+)?[:\s]+([A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s]{2,30}?)(?:\s*\n|\s*NOMBRE|\s*NAME|\s*SEXO|\s*SEX|\s*$)/i,
    /(?:APELLIDO|SURNAME)(?:\s*\/\s*[A-Z]+)?[:\s]+([A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s]{2,30})/i,
  ];
  
  for (const pattern of surnamePatterns) {
    const match = normalizedFrontText.match(pattern);
    if (match && match[1]) {
      let surname = match[1].trim();
      // Limpiar caracteres especiales pero mantener espacios para apellidos compuestos
      surname = surname.replace(/[^\w\sÁÉÍÓÚÑÜ]/g, '').replace(/\s+/g, ' ').trim();
      if (surname.length > 2 && 
          !surname.includes("DOCUMENTO") && !surname.includes("NACIONAL") &&
          !surname.includes("MINISTERIO") && !surname.includes("INTERIOR") &&
          !surname.includes("REPUBLICA") && !surname.includes("MERCOSUR")) {
        data.lastName = surname;
        console.log("[Parser] Apellido encontrado:", surname);
        break;
      }
    }
  }

  // 2. BUSCAR NOMBRE (NAME) - Solo en el FRENTE
  // Formato típico: "NOMBRE / Name: LAURA GIMENA" o "NOMBRE: LAURA GIMENA"
  const namePatterns = [
    /(?:NOMBRE|NAME)(?:\s*\/\s*[A-Z]+)?[:\s]+([A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s]{2,30}?)(?:\s*\n|\s*SEXO|\s*SEX|\s*NACIONALIDAD|\s*FECHA|\s*DOCUMENTO|\s*NACIMIENTO|\s*$)/i,
    /(?:NOMBRE|NAME)(?:\s*\/\s*[A-Z]+)?[:\s]+([A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s]{2,30})/i,
    // También buscar en líneas que contengan "NOMBRE" seguido de texto
    /NOMBRE\s+([A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s]{2,30})/i,
  ];
  
  for (const pattern of namePatterns) {
    const match = normalizedFrontText.match(pattern);
    if (match && match[1]) {
      let name = match[1].trim();
      // Limpiar caracteres especiales pero mantener espacios para nombres compuestos
      name = name.replace(/[^\w\sÁÉÍÓÚÑÜ]/g, '').replace(/\s+/g, ' ').trim();
      // Validar que no sea el apellido (evitar duplicados)
      if (name !== data.lastName && name.length > 2 && 
          !name.includes("DOCUMENTO") && !name.includes("NACIONAL") &&
          !name.includes("MINISTERIO") && !name.includes("INTERIOR") &&
          !name.includes("REPUBLICA") && !name.includes("MERCOSUR")) {
        data.firstName = name;
        console.log("[Parser] Nombre encontrado:", name);
        break;
      }
    }
  }

  // Si no encontramos nombre/apellido con etiquetas, buscar en líneas que parezcan nombres (solo en FRENTE)
  if (!data.firstName || !data.lastName) {
    // Buscar líneas con formato "APELLIDO NOMBRE" o "APELLIDO, NOMBRE"
    // En DNI argentino típicamente: "ORDONÑEZ KRASNOWSKI LAURA GIMENA" o similar
    for (let i = 0; i < Math.min(20, frontLines.length); i++) {
      const line = frontLines[i];
      const upperLine = line.toUpperCase();
      
      // Saltar líneas que son claramente no nombres
      if (upperLine.includes("DOCUMENTO") || upperLine.includes("NACIONAL") || 
          upperLine.includes("IDENTIDAD") || upperLine.includes("REPUBLICA") ||
          upperLine.includes("MERCOSUR") || upperLine.includes("REGISTRO") ||
          upperLine.includes("MINISTERIO") || upperLine.includes("DEL INTERIOR") ||
          /^\d+$/.test(line) || upperLine.includes("ARGENTINA") || 
          upperLine.includes("TRAMITE") || upperLine.includes("SEXO") ||
          upperLine.includes("FECHA") || upperLine.includes("EMISION")) {
        continue;
      }
      
      // Buscar formato "APELLIDO, NOMBRE"
      const nameMatchComma = line.match(/^([A-ZÁÉÍÓÚÑÜ\s]+),\s*([A-ZÁÉÍÓÚÑÜ\s]+)$/i);
      if (nameMatchComma && nameMatchComma[1].trim().length > 2 && nameMatchComma[2].trim().length > 2) {
        if (!data.lastName) data.lastName = nameMatchComma[1].trim();
        if (!data.firstName) data.firstName = nameMatchComma[2].trim();
        console.log("[Parser] Nombre completo encontrado (con coma):", data.lastName, data.firstName);
        break;
      }
      
      // Buscar formato "APELLIDO NOMBRE" (múltiples palabras, todas mayúsculas)
      // En DNI argentino típicamente: "ORDONÑEZ KRASNOWSKI LAURA GIMENA" (4 palabras)
      // O "ORDONÑEZ LAURA" (2 palabras)
      const words = line.split(/\s+/).filter(w => w.length > 0 && /^[A-ZÁÉÍÓÚÑÜ]+$/i.test(w) && w.length > 1);
      if (words.length >= 2 && words.length <= 6) {
        // Si hay 2-3 palabras: típicamente "APELLIDO NOMBRE" o "APELLIDO1 APELLIDO2 NOMBRE"
        // Si hay 4+ palabras: típicamente "APELLIDO1 APELLIDO2 NOMBRE1 NOMBRE2"
        if (!data.lastName || !data.firstName) {
          if (words.length === 2) {
            if (!data.lastName) data.lastName = words[0];
            if (!data.firstName) data.firstName = words[1];
          } else if (words.length === 3) {
            // Asumir: "APELLIDO1 APELLIDO2 NOMBRE"
            if (!data.lastName) data.lastName = words.slice(0, 2).join(" ");
            if (!data.firstName) data.firstName = words[2];
          } else if (words.length === 4) {
            // Típicamente: "APELLIDO1 APELLIDO2 NOMBRE1 NOMBRE2"
            if (!data.lastName) data.lastName = words.slice(0, 2).join(" ");
            if (!data.firstName) data.firstName = words.slice(2).join(" ");
          } else {
            // 5+ palabras: primeros 2-3 son apellidos, últimos 1-2 son nombres
            if (!data.lastName) data.lastName = words.slice(0, Math.ceil(words.length / 2)).join(" ");
            if (!data.firstName) data.firstName = words.slice(Math.ceil(words.length / 2)).join(" ");
          }
          console.log("[Parser] Nombre completo encontrado (sin coma):", data.lastName, data.firstName);
          break;
        }
      }
    }
  }

  // 3. BUSCAR DNI - Solo en el FRENTE
  // Formato típico: "Documento / Document: 26.200.553" o "26.200.553"
  const dniPatterns = [
    /(?:DOCUMENTO|DOCUMENT|DNI)(?:\s*\/\s*[A-Z]+)?[:\s]+(\d{1,2}\.?\d{3}\.?\d{3})/i,
    /(?:DOCUMENTO|DOCUMENT)(?:\s*\/\s*[A-Z]+)?[:\s]+([\d\.]{7,12})/i,
    // Buscar número con puntos: 26.200.553 o 26200553
    /\b(\d{1,2}\.\d{3}\.\d{3})\b/,
    // Buscar después de la palabra "Documento" en cualquier formato
    /DOCUMENTO[^\d]*(\d{1,2}\.?\d{3}\.?\d{3})/i,
    // Buscar número de 8 dígitos que no sea parte de otra cosa
    /(?:^|\s)(\d{8})(?:\s|$)/,
  ];
  
  for (const pattern of dniPatterns) {
    const match = normalizedFrontText.match(pattern);
    if (match && match[1]) {
      let dni = match[1].replace(/\./g, ''); // Remover puntos
      // Validar que sea un número de 7-8 dígitos
      if (dni.length >= 7 && dni.length <= 8 && /^\d+$/.test(dni)) {
        // Verificar que no sea parte de una fecha, CUIL o TRAMITE
        const dniIndex = normalizedFrontText.indexOf(match[1]);
        const dniContext = normalizedFrontText.substring(Math.max(0, dniIndex - 30), 
                                                         Math.min(normalizedFrontText.length, dniIndex + 50));
        if (!dniContext.includes("CUIL") && 
            !dniContext.includes("TRAMITE") && 
            !dniContext.includes("FECHA") &&
            !dniContext.includes("NACIMIENTO") &&
            !dniContext.includes("EMISION")) {
          data.dni = dni;
          console.log("[Parser] DNI encontrado:", dni, "de:", match[1]);
          break;
        }
      }
    }
  }

  // 4. BUSCAR FECHA DE NACIMIENTO - Solo en el FRENTE
  // Formato con meses en texto (NOV 1977) o numérico
  const monthNames: { [key: string]: string } = {
    'JAN': '01', 'ENE': '01', 'JANUARY': '01', 'ENERO': '01',
    'FEB': '02', 'FEBRUARY': '02', 'FEBRERO': '02',
    'MAR': '03', 'MARCH': '03', 'MARZO': '03',
    'APR': '04', 'ABR': '04', 'APRIL': '04', 'ABRIL': '04',
    'MAY': '05', 'MAYO': '05',
    'JUN': '06', 'JUNE': '06', 'JUNIO': '06',
    'JUL': '07', 'JULY': '07', 'JULIO': '07',
    'AUG': '08', 'AGO': '08', 'AUGUST': '08', 'AGOSTO': '08',
    'SEP': '09', 'SEPT': '09', 'SEPTEMBER': '09', 'SEPTIEMBRE': '09',
    'OCT': '10', 'OCTOBER': '10', 'OCTUBRE': '10',
    'NOV': '11', 'NOVEMBER': '11', 'NOVIEMBRE': '11',
    'DEC': '12', 'DIC': '12', 'DECEMBER': '12', 'DICIEMBRE': '12',
  };

  // Buscar formato con mes en texto: "13 NOV 1977" o "13 NOV / NOV 1977"
  // También buscar después de etiquetas: "Fecha de nacimiento / Date of birth: 13 NOV 1977"
  const datePatternsText = [
    /(?:FECHA\s+DE\s+NACIMIENTO|DATE\s+OF\s+BIRTH|NACIMIENTO|BIRTH)(?:\s*\/\s*[A-Z\s]+)?[:\s]+(\d{1,2})\s+([A-Z]{3,9})(?:\s*\/\s*[A-Z]{3,9})?\s+(\d{4})/i,
    /(?:FECHA\s+DE\s+NACIMIENTO|NACIMIENTO)[:\s]+(\d{1,2})\s+([A-Z]{3,9})\s+(\d{4})/i,
    // Buscar formato libre: "13 NOV 1977" cerca de palabras clave
    /(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC|ENE|ABR|AGO|SEPT|DIC)\s+(\d{4})/i,
  ];
  
  for (const pattern of datePatternsText) {
    const dateMatch = normalizedFrontText.match(pattern);
    if (dateMatch) {
      const day = parseInt(dateMatch[1]);
      const monthStr = dateMatch[2].toUpperCase().substring(0, 3);
      const year = parseInt(dateMatch[3]);
      const month = monthNames[monthStr];
      
      if (month && day >= 1 && day <= 31 && year >= 1900 && year <= new Date().getFullYear()) {
        data.birthDate = `${year}-${month}-${String(day).padStart(2, "0")}`;
        console.log("[Parser] Fecha encontrada (formato texto):", data.birthDate, "de:", dateMatch[0]);
        break;
      }
    }
  }
  
  // Si no encontramos fecha con texto, buscar formato numérico
  if (!data.birthDate) {
    const datePatternNumeric = /(?:FECHA\s+DE\s+NACIMIENTO|DATE\s+OF\s+BIRTH|NACIMIENTO)(?:\s*\/\s*[A-Z\s]+)?[:\s]+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i;
    const dateMatch = normalizedFrontText.match(datePatternNumeric);
    
    if (dateMatch) {
      const day = parseInt(dateMatch[1]);
      const month = parseInt(dateMatch[2]);
      const year = parseInt(dateMatch[3]);
      
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= new Date().getFullYear()) {
        data.birthDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        console.log("[Parser] Fecha encontrada (formato numérico):", data.birthDate);
      }
    }
  }

  // 5. BUSCAR DIRECCIÓN (DOMICILIO) - Solo en el DORSO (o en el frente si no hay dorso)
  const searchText = backText ? normalizedBackText : normalizedFrontText;
  const searchLines = backText ? backLines : frontLines;
  
  const addressPatterns = [
    /(?:DOMICILIO|ADDRESS)[:\s]+([A-Z0-9\s\-\.,]+?)(?:\s*\n|\s*LUGAR|\s*CUIL|\s*NACIMIENTO|\s*$)/i,
    /(?:DOMICILIO|ADDRESS)[:\s]+([A-Z0-9\s\-\.,]{10,100})/i,
  ];
  
  for (const pattern of addressPatterns) {
    const match = searchText.match(pattern);
    if (match && match[1]) {
      let address = match[1].trim();
      // Limpiar caracteres extraños al inicio/final pero mantener guiones
      address = address.replace(/^[^\w\-]+|[^\w\-]+$/g, '').trim();
      if (address.length > 5 && 
          !address.includes("TRAMITE") && !address.includes("OF. IDENT") &&
          !address.includes("IDENTIFICADO")) {
        data.address = address;
        console.log("[Parser] Dirección encontrada:", address);
        break;
      }
    }
  }

  // Si no encontramos dirección con etiqueta, buscar líneas que parezcan direcciones
  if (!data.address && searchLines.length > 0) {
    const addressKeywords = ["CALLE", "AV", "AVENIDA", "BOUCHARD", "MORENO", "BUENOS AIRES", "DOMICILIO"];
    for (let i = 0; i < searchLines.length; i++) {
      const line = searchLines[i];
      const upperLine = line.toUpperCase();
      
      if (addressKeywords.some((keyword) => upperLine.includes(keyword)) || 
          (upperLine.match(/[A-Z]+\s+\d+/) && upperLine.includes("-"))) {
        // Buscar la línea completa y las siguientes si contienen números y guiones
        let address = line;
        // Si la siguiente línea también parece parte de la dirección, agregarla
        if (i + 1 < searchLines.length && 
            (searchLines[i + 1].match(/[A-Z]+\s*-\s*[A-Z]+/) || searchLines[i + 1].match(/\d+/))) {
          address += " - " + searchLines[i + 1];
        }
        // Limpiar la dirección
        address = address.replace(/TRAMITE.*/i, '').trim();
        if (address.length > 10 && !address.includes("TRAMITE")) {
          data.address = address;
          console.log("[Parser] Dirección encontrada (por keywords):", address);
          break;
        }
      }
    }
  }

  console.log("[Parser] Datos finales extraídos:", data);
  return data;
}

export async function POST(request: Request) {
  console.log("[OCR DNI] Iniciando procesamiento de DNI...");
  
  try {
    console.log("[OCR DNI] Verificando sesión...");
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.error("[OCR DNI] Error: Sesión no encontrada. Usuario no autenticado.");
      return NextResponse.json(
        { error: "Unauthorized. Por favor inicia sesión." },
        { status: 401 }
      );
    }
    
    console.log("[OCR DNI] Sesión válida. Usuario:", session.user?.email);

    const formData = await request.formData();
    const frontFile = formData.get("front") as File;
    const backFile = formData.get("back") as File | null;

    if (!frontFile) {
      console.error("[OCR DNI] Error: No se proporcionó imagen del frente");
      return NextResponse.json(
        { error: "Front image is required" },
        { status: 400 }
      );
    }

    console.log("[OCR DNI] Imágenes recibidas:", {
      frontName: frontFile.name,
      frontSize: frontFile.size,
      backName: backFile?.name || "none",
      backSize: backFile?.size || 0,
    });

    // Convertir imágenes a base64 para enviar a OCR
    console.log("[OCR DNI] Convirtiendo imágenes a base64...");
    const frontBuffer = await frontFile.arrayBuffer();
    const frontBase64 = Buffer.from(frontBuffer).toString("base64");
    
    let backBase64: string | null = null;
    if (backFile) {
      const backBuffer = await backFile.arrayBuffer();
      backBase64 = Buffer.from(backBuffer).toString("base64");
    }
    
    console.log("[OCR DNI] Imágenes convertidas. Tamaños base64:", {
      front: frontBase64.length,
      back: backBase64?.length || 0,
    });

    // Opción 1: Google Cloud Vision API
    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    
    if (!apiKey) {
      console.error("[OCR DNI] Error: GOOGLE_CLOUD_VISION_API_KEY no está configurada");
      console.error("[OCR DNI] Variables de entorno disponibles:", {
        hasKey: !!process.env.GOOGLE_CLOUD_VISION_API_KEY,
        keyLength: process.env.GOOGLE_CLOUD_VISION_API_KEY?.length || 0,
        keyPrefix: process.env.GOOGLE_CLOUD_VISION_API_KEY?.substring(0, 10) || "none",
      });
      return NextResponse.json(
        {
          error:
            "OCR no configurado. Por favor configura GOOGLE_CLOUD_VISION_API_KEY en las variables de entorno (.env.local para desarrollo o Vercel para producción).",
        },
        { status: 501 }
      );
    }
    
    console.log("[OCR DNI] API Key encontrada. Longitud:", apiKey.length, "Prefijo:", apiKey.substring(0, 10));

    try {
      const requestBody = {
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
      };
      
      console.log("[OCR DNI] Enviando solicitud a Google Vision API...", {
        url: "https://vision.googleapis.com/v1/images:annotate",
        requestsCount: requestBody.requests.length,
        requestSize: JSON.stringify(requestBody).length,
      });
      
      const visionResponse = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      console.log("[OCR DNI] Respuesta de Google Vision API:", {
        status: visionResponse.status,
        statusText: visionResponse.statusText,
        ok: visionResponse.ok,
      });

      if (!visionResponse.ok) {
        let errorText = "";
        let errorJson: any = null;
        
        try {
          errorText = await visionResponse.text();
          console.log("[OCR DNI] Error text raw:", errorText.substring(0, 500));
          errorJson = JSON.parse(errorText);
        } catch (parseError) {
          console.error("[OCR DNI] Error parseando respuesta de error:", parseError);
          // Si no es JSON, usar el texto tal cual
        }
        
        const errorMessage = errorJson?.error?.message || errorText || visionResponse.statusText;
        
        console.error("[OCR DNI] Google Vision API error completo:", {
          status: visionResponse.status,
          statusText: visionResponse.statusText,
          error: errorMessage,
          fullError: errorJson || errorText,
          errorCode: errorJson?.error?.code,
          errorStatus: errorJson?.error?.status,
        });
        
        // Si es un error de autenticación, dar un mensaje más específico
        if (visionResponse.status === 401 || visionResponse.status === 403) {
          const detailedError = errorJson?.error?.message || errorMessage;
          const errorReason = errorJson?.error?.details?.[0]?.reason;
          
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
          
          // Detectar el error de restricciones de HTTP referrer
          if (errorReason === "API_KEY_HTTP_REFERRER_BLOCKED" || 
              detailedError?.includes("referer") || 
              detailedError?.includes("referrer")) {
            return NextResponse.json(
              {
                error: `Tu API Key tiene restricciones de HTTP referrer que bloquean las llamadas desde el servidor.

**Problema:** Las llamadas desde el servidor (API routes de Next.js) no envían un referrer HTTP, por lo que Google bloquea la solicitud.

**Solución:**
1. Ve a Google Cloud Console > APIs & Services > Credentials
2. Haz clic en tu API Key para editarla
3. En "Application restrictions", cambia de "Sitios web" (Websites) a **"Ninguno" (None)**
   - Esto permitirá que la API Key funcione desde el servidor
4. En "API restrictions", mantén "Restringir clave" y asegúrate de que "Cloud Vision API" esté en la lista
5. Guarda los cambios y espera 2-5 minutos para que se propaguen
6. Vuelve a intentar

**Nota:** Si necesitas mantener seguridad, puedes usar restricciones de IP en lugar de HTTP referrer, pero para desarrollo y producción en Vercel, "Ninguno" es la opción más simple.`,
                details: detailedError,
                reason: errorReason,
              },
              { status: 403 }
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
              reason: errorReason,
            },
            { status: 401 }
          );
        }
        
        throw new Error(`Google Vision API error: ${visionResponse.status} ${errorMessage}`);
      }

      const visionData = await visionResponse.json();
      
      console.log("[OCR DNI] Respuesta de Google Vision API parseada:", {
        hasResponses: !!visionData.responses,
        responsesCount: visionData.responses?.length || 0,
        firstResponseHasError: !!visionData.responses?.[0]?.error,
      });
      
      // Verificar si hay errores en la respuesta
      if (visionData.responses && visionData.responses[0]?.error) {
        console.error("[OCR DNI] Error en respuesta de Google Vision API:", visionData.responses[0].error);
        return NextResponse.json(
          {
            error: `Error de Google Vision API: ${visionData.responses[0].error.message || "Error desconocido"}`,
            details: visionData.responses[0].error,
          },
          { status: 400 }
        );
      }
      
      // Separar texto del frente y dorso
      let frontText = "";
      let backText = "";
      
      if (visionData.responses) {
        visionData.responses.forEach((response: any, index: number) => {
          if (response.fullTextAnnotation?.text) {
            const text = response.fullTextAnnotation.text;
            if (index === 0) {
              frontText = text;
              console.log(`[OCR DNI] Texto del FRENTE (respuesta ${index + 1}):`, text.substring(0, 500) + "...");
            } else {
              backText = text;
              console.log(`[OCR DNI] Texto del DORSO (respuesta ${index + 1}):`, text.substring(0, 500) + "...");
            }
          } else {
            console.warn(`[OCR DNI] Respuesta ${index + 1} no contiene texto.`, {
              hasError: !!response.error,
              error: response.error,
              hasText: !!response.fullTextAnnotation?.text,
            });
          }
        });
      }

      if (!frontText.trim()) {
        console.warn("[OCR DNI] No se pudo extraer texto del frente del DNI");
        return NextResponse.json(
          {
            error: "No se pudo extraer texto del frente del DNI. Por favor verifica que la imagen sea clara y legible.",
          },
          { status: 400 }
        );
      }

      console.log("[OCR DNI] Parseando datos del DNI (frente y dorso separados)...");
      const extractedData = parseDNIData(frontText, backText);
      console.log("[OCR DNI] Datos extraídos:", extractedData);
      
      return NextResponse.json(extractedData);
    } catch (error: any) {
      console.error("[OCR DNI] Error procesando con Google Vision API:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      return NextResponse.json(
        {
          error: `Error al procesar las imágenes: ${error.message || "Error desconocido"}`,
          details: process.env.NODE_ENV === "development" ? error.stack : undefined,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[OCR DNI] Error general procesando DNI:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      { 
        error: "Error processing DNI images",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
