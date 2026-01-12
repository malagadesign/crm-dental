"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Upload, X, CheckCircle2, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface ImportError {
  row: number;
  column: string;
  message: string;
}

interface ImportResult {
  success?: boolean;
  createdMaterials?: number;
  updatedMaterials?: number;
  createdMovements?: number;
  errors?: ImportError[];
  error?: string;
  details?: string;
}

export function MaterialsImportExport() {
  const { data: session } = useSession();
  const userRole = session?.user?.role || "";
  const canImportExport = userRole === "admin" || userRole === "odontologo";

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const queryClient = useQueryClient();

  if (!canImportExport) {
    return null;
  }

  const handleExport = () => {
    window.location.href = "/api/materials/export";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setImportResult({
        error: "Por favor selecciona un archivo",
        errors: [],
      });
      return;
    }

    setIsUploading(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/materials/import", {
        method: "POST",
        body: formData,
      });

      const result: ImportResult = await response.json();

      setImportResult(result);
      
      if (response.ok && result.success) {
        // Invalidar query para refrescar la lista
        queryClient.invalidateQueries({ queryKey: ["materials"] });
        // Limpiar archivo después de éxito
        setFile(null);
      }
    } catch (error: any) {
      setImportResult({
        error: "Error al importar el archivo",
        details: error.message,
        errors: [],
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseImportDialog = () => {
    setIsImportDialogOpen(false);
    setFile(null);
    setImportResult(null);
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleExport}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Exportar Excel
        </Button>
        <Button
          variant="outline"
          onClick={() => setIsImportDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Importar Excel
        </Button>
      </div>

      <Dialog open={isImportDialogOpen} onOpenChange={handleCloseImportDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Materiales desde Excel</DialogTitle>
            <DialogDescription>
              Sube un archivo Excel (.xlsx) con los materiales a importar. El
              archivo debe seguir el formato del template exportado (hoja &quot;Materiales&quot;).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label
                htmlFor="file-upload"
                className="block text-sm font-medium mb-2"
              >
                Archivo Excel (.xlsx)
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                disabled={isUploading}
              />
              {file && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Archivo seleccionado: <strong>{file.name}</strong>
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                El archivo debe tener una hoja llamada &quot;Materiales&quot; con las columnas en español.
              </p>
            </div>

            {importResult && (
              <div className="space-y-3">
                {importResult.success ? (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex items-center gap-2 text-green-800 mb-2">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-semibold">Importación exitosa</span>
                    </div>
                    <div className="text-sm text-green-700 space-y-1">
                      <p>
                        <strong>Materiales creados:</strong> {importResult.createdMaterials || 0}
                      </p>
                      <p>
                        <strong>Materiales actualizados:</strong>{" "}
                        {importResult.updatedMaterials || 0}
                      </p>
                      <p>
                        <strong>Movimientos de stock creados:</strong> {importResult.createdMovements || 0}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex items-center gap-2 text-red-800 mb-2">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-semibold">
                        {importResult.error || "Error en la importación"}
                      </span>
                    </div>
                    {importResult.details && (
                      <p className="text-sm text-red-700 mb-2">
                        {importResult.details}
                      </p>
                    )}
                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-red-800 mb-2">
                          Errores encontrados ({importResult.errors.length}):
                        </p>
                        <div className="max-h-60 overflow-y-auto">
                          <table className="w-full text-sm text-red-700 border-collapse">
                            <thead>
                              <tr className="border-b border-red-300">
                                <th className="text-left p-2 font-semibold">Fila</th>
                                <th className="text-left p-2 font-semibold">Columna</th>
                                <th className="text-left p-2 font-semibold">Mensaje</th>
                              </tr>
                            </thead>
                            <tbody>
                              {importResult.errors.map((error, index) => (
                                <tr key={index} className="border-b border-red-200">
                                  <td className="p-2">{error.row}</td>
                                  <td className="p-2">{error.column}</td>
                                  <td className="p-2">{error.message}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleCloseImportDialog}
                disabled={isUploading}
              >
                {importResult?.success ? "Cerrar" : "Cancelar"}
              </Button>
              {!importResult?.success && (
                <Button
                  onClick={handleImport}
                  disabled={!file || isUploading}
                >
                  {isUploading ? "Importando..." : "Importar"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}