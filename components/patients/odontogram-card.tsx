"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToothEventDialog } from "./tooth-event-dialog";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface ToothState {
  toothNumber: number;
  currentStatus: string;
  lastEventId: number | null;
  lastEvent: any | null;
  updatedAt: string | null;
}

const statusColors: Record<string, string> = {
  healthy: "bg-green-100 border-green-300 text-green-800",
  caries: "bg-red-100 border-red-300 text-red-800",
  filled: "bg-blue-100 border-blue-300 text-blue-800",
  crown: "bg-yellow-100 border-yellow-300 text-yellow-800",
  endo: "bg-purple-100 border-purple-300 text-purple-800",
  missing: "bg-gray-100 border-gray-300 text-gray-500",
  extraction: "bg-orange-100 border-orange-300 text-orange-800",
  implant: "bg-cyan-100 border-cyan-300 text-cyan-800",
  bridge: "bg-indigo-100 border-indigo-300 text-indigo-800",
  fracture: "bg-pink-100 border-pink-300 text-pink-800",
  watch: "bg-amber-100 border-amber-300 text-amber-800",
};

const statusLabels: Record<string, string> = {
  healthy: "Sano",
  caries: "Caries",
  filled: "Obturado",
  crown: "Corona",
  endo: "Endodoncia",
  missing: "Ausente",
  extraction: "Extracción",
  implant: "Implante",
  bridge: "Puente",
  fracture: "Fractura",
  watch: "Observar",
};

// Números FDI válidos
const validToothNumbers = [
  ...Array.from({ length: 8 }, (_, i) => 11 + i), // 11-18
  ...Array.from({ length: 8 }, (_, i) => 21 + i), // 21-28
  ...Array.from({ length: 8 }, (_, i) => 31 + i), // 31-38
  ...Array.from({ length: 8 }, (_, i) => 41 + i), // 41-48
];

async function fetchToothStates(patientId: number): Promise<ToothState[]> {
  const response = await fetch(`/api/patients/${patientId}/odontogram/state`);
  if (!response.ok) throw new Error("Error fetching tooth states");
  return response.json();
}

interface OdontogramCardProps {
  patientId: number;
}

export function OdontogramCard({ patientId }: OdontogramCardProps) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: toothStates, isLoading } = useQuery({
    queryKey: ["tooth-states", patientId],
    queryFn: () => fetchToothStates(patientId),
    enabled: !!patientId,
  });

  const getToothStatus = (toothNumber: number): string => {
    const state = toothStates?.find((s: ToothState) => s.toothNumber === toothNumber);
    return state?.currentStatus || "healthy";
  };

  const handleToothClick = (toothNumber: number) => {
    setSelectedTooth(toothNumber);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedTooth(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Odontograma</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Odontograma</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Leyenda */}
            <div className="flex flex-wrap gap-2 text-xs">
              {Object.entries(statusLabels).map(([key, label]) => (
                <div
                  key={key}
                  className={`px-2 py-1 rounded border ${statusColors[key] || "bg-gray-100 border-gray-300"}`}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Odontograma */}
            <div className="space-y-2">
              {/* Maxilar Superior */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-center text-muted-foreground">
                  Maxilar Superior
                </div>
                <div className="flex justify-center gap-1 flex-wrap">
                  {validToothNumbers
                    .filter((n) => n >= 11 && n <= 18)
                    .reverse()
                    .map((toothNumber) => {
                      const status = getToothStatus(toothNumber);
                      return (
                        <button
                          key={toothNumber}
                          onClick={() => handleToothClick(toothNumber)}
                          className={`w-10 h-10 rounded border-2 flex items-center justify-center text-xs font-semibold cursor-pointer hover:scale-110 transition-transform ${statusColors[status] || "bg-gray-100 border-gray-300"}`}
                          title={`Diente ${toothNumber} - ${statusLabels[status] || status}`}
                        >
                          {toothNumber}
                        </button>
                      );
                    })}
                </div>
                <div className="flex justify-center gap-1 flex-wrap">
                  {validToothNumbers
                    .filter((n) => n >= 21 && n <= 28)
                    .map((toothNumber) => {
                      const status = getToothStatus(toothNumber);
                      return (
                        <button
                          key={toothNumber}
                          onClick={() => handleToothClick(toothNumber)}
                          className={`w-10 h-10 rounded border-2 flex items-center justify-center text-xs font-semibold cursor-pointer hover:scale-110 transition-transform ${statusColors[status] || "bg-gray-100 border-gray-300"}`}
                          title={`Diente ${toothNumber} - ${statusLabels[status] || status}`}
                        >
                          {toothNumber}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Maxilar Inferior */}
              <div className="space-y-2 pt-4 border-t">
                <div className="text-sm font-medium text-center text-muted-foreground">
                  Maxilar Inferior
                </div>
                <div className="flex justify-center gap-1 flex-wrap">
                  {validToothNumbers
                    .filter((n) => n >= 31 && n <= 38)
                    .reverse()
                    .map((toothNumber) => {
                      const status = getToothStatus(toothNumber);
                      return (
                        <button
                          key={toothNumber}
                          onClick={() => handleToothClick(toothNumber)}
                          className={`w-10 h-10 rounded border-2 flex items-center justify-center text-xs font-semibold cursor-pointer hover:scale-110 transition-transform ${statusColors[status] || "bg-gray-100 border-gray-300"}`}
                          title={`Diente ${toothNumber} - ${statusLabels[status] || status}`}
                        >
                          {toothNumber}
                        </button>
                      );
                    })}
                </div>
                <div className="flex justify-center gap-1 flex-wrap">
                  {validToothNumbers
                    .filter((n) => n >= 41 && n <= 48)
                    .map((toothNumber) => {
                      const status = getToothStatus(toothNumber);
                      return (
                        <button
                          key={toothNumber}
                          onClick={() => handleToothClick(toothNumber)}
                          className={`w-10 h-10 rounded border-2 flex items-center justify-center text-xs font-semibold cursor-pointer hover:scale-110 transition-transform ${statusColors[status] || "bg-gray-100 border-gray-300"}`}
                          title={`Diente ${toothNumber} - ${statusLabels[status] || status}`}
                        >
                          {toothNumber}
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Haz clic en un diente para ver o agregar eventos
            </p>
          </div>
        </CardContent>
      </Card>

      {selectedTooth !== null && (
        <ToothEventDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          patientId={patientId}
          toothNumber={selectedTooth}
          onClose={handleDialogClose}
        />
      )}
    </>
  );
}
