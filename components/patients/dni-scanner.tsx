"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, FileImage, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DNIScannerProps {
  onDataExtracted: (data: {
    firstName?: string;
    lastName?: string;
    dni?: string;
    birthDate?: string;
    address?: string;
  }) => void;
  onClose: () => void;
}

export function DNIScanner({ onDataExtracted, onClose }: DNIScannerProps) {
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: "front" | "back"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith("image/")) {
      setError("Por favor selecciona un archivo de imagen válido");
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no debe superar los 5MB");
      return;
    }

    setError("");
    if (side === "front") {
      setFrontImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFrontPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setBackImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (side: "front" | "back") => {
    if (side === "front") {
      setFrontImage(null);
      setFrontPreview(null);
      if (frontInputRef.current) frontInputRef.current.value = "";
    } else {
      setBackImage(null);
      setBackPreview(null);
      if (backInputRef.current) backInputRef.current.value = "";
    }
  };

  const processImages = async () => {
    if (!frontImage) {
      setError("Por favor sube la imagen del frente del DNI");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("front", frontImage);
      if (backImage) {
        formData.append("back", backImage);
      }

      const response = await fetch("/api/ocr/dni", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error procesando las imágenes");
      }

      const data = await response.json();
      onDataExtracted(data);
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al procesar las imágenes");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Escanear DNI</CardTitle>
            <CardDescription>
              Sube las imágenes del frente y dorso del DNI para extraer los datos automáticamente
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Frente del DNI */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Frente del DNI *</label>
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-4 transition-colors",
                frontPreview
                  ? "border-primary"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              )}
            >
              {frontPreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={frontPreview}
                    alt="Frente del DNI"
                    className="w-full h-auto rounded-md max-h-64 object-contain"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => removeImage("front")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <FileImage className="h-12 w-12 text-muted-foreground mb-2" />
                  <Button
                    variant="outline"
                    onClick={() => frontInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Subir Imagen
                  </Button>
                  <input
                    ref={frontInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleImageSelect(e, "front")}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Dorso del DNI */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Dorso del DNI (opcional)</label>
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-4 transition-colors",
                backPreview
                  ? "border-primary"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              )}
            >
              {backPreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={backPreview}
                    alt="Dorso del DNI"
                    className="w-full h-auto rounded-md max-h-64 object-contain"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => removeImage("back")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <FileImage className="h-12 w-12 text-muted-foreground mb-2" />
                  <Button
                    variant="outline"
                    onClick={() => backInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Subir Imagen
                  </Button>
                  <input
                    ref={backInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleImageSelect(e, "back")}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button
            onClick={processImages}
            disabled={!frontImage || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              "Extraer Datos"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
