"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, Plus, Pencil, Trash2, CheckCircle2, XCircle, Search } from "lucide-react";
import { TreatmentDialog } from "@/components/treatments/treatment-dialog";
import { Treatment } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";

async function fetchTreatments(): Promise<Treatment[]> {
  const response = await fetch("/api/treatments");
  if (!response.ok) throw new Error("Error fetching treatments");
  return response.json();
}

async function deleteTreatment(id: number): Promise<void> {
  const response = await fetch(`/api/treatments/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Error deleting treatment");
}

export default function TreatmentsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: treatments, isLoading } = useQuery({
    queryKey: ["treatments"],
    queryFn: fetchTreatments,
  });

  // Filtrar tratamientos por búsqueda
  const filteredTreatments = useMemo(() => {
    if (!treatments) return [];
    if (!searchQuery.trim()) return treatments;
    
    const query = searchQuery.toLowerCase().trim();
    return treatments.filter((treatment) => {
      return (
        treatment.name.toLowerCase().includes(query) ||
        (treatment.description && treatment.description.toLowerCase().includes(query)) ||
        treatment.price.toString().includes(query)
      );
    });
  }, [treatments, searchQuery]);

  const deleteMutation = useMutation({
    mutationFn: deleteTreatment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatments"] });
    },
  });

  const handleEdit = (treatment: Treatment) => {
    setEditingTreatment(treatment);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este tratamiento?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCreate = () => {
    setEditingTreatment(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tratamientos</h1>
          <p className="text-muted-foreground">
            Gestiona el catálogo de tratamientos
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Tratamiento
        </Button>
      </div>

      {/* Buscador */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, descripción o precio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">Cargando...</div>
      ) : filteredTreatments && filteredTreatments.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTreatments.map((treatment) => (
            <Card key={treatment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{treatment.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {treatment.active ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(treatment)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(treatment.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {treatment.description && (
                    <p className="text-muted-foreground">
                      {treatment.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="font-semibold text-lg">
                      {formatCurrency(Number(treatment.price))}
                    </span>
                    <span className="text-muted-foreground">
                      {treatment.durationMinutes} min
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Stethoscope className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "No se encontraron tratamientos con ese criterio"
                : "No hay tratamientos registrados"}
            </p>
            {!searchQuery && (
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Primer Tratamiento
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <TreatmentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        treatment={editingTreatment}
      />
    </div>
  );
}
