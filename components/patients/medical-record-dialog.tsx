"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MedicalRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: number;
  appointmentId?: number | null;
  record?: any | null; // Record existente para edición
}

async function fetchAppointments(patientId: number) {
  const response = await fetch(`/api/appointments?patientId=${patientId}`);
  if (!response.ok) throw new Error("Error fetching appointments");
  return response.json();
}

async function createMedicalRecord(data: any) {
  const response = await fetch("/api/medical-records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error creating medical record");
  return response.json();
}

async function updateMedicalRecord(id: number, data: any) {
  const response = await fetch(`/api/medical-records/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error updating medical record");
  }
  return response.json();
}

export function MedicalRecordDialog({
  open,
  onOpenChange,
  patientId,
  appointmentId,
  record,
}: MedicalRecordDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!record;
  
  const [formData, setFormData] = useState({
    recordDate: new Date().toISOString().split("T")[0],
    notes: "",
    appointmentId: appointmentId?.toString() || "none",
  });

  const { data: appointments } = useQuery({
    queryKey: ["appointments", patientId],
    queryFn: () => fetchAppointments(patientId),
    enabled: open && !!patientId,
  });

  useEffect(() => {
    if (open) {
      if (record) {
        // Modo edición: cargar datos del record
        const recordDate = new Date(record.recordDate).toISOString().split("T")[0];
        setFormData({
          recordDate,
          notes: record.notes || "",
          appointmentId: record.appointmentId?.toString() || "none",
        });
      } else {
        // Modo creación
        setFormData({
          recordDate: new Date().toISOString().split("T")[0],
          notes: "",
          appointmentId: appointmentId?.toString() || "none",
        });
      }
    }
  }, [open, appointmentId, record]);

  const mutation = useMutation({
    mutationFn: isEditing
      ? (data: any) => updateMedicalRecord(record!.id, data)
      : createMedicalRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-records", patientId] });
      queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
      onOpenChange(false);
      setFormData({
        recordDate: new Date().toISOString().split("T")[0],
        notes: "",
        appointmentId: "none",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      appointmentId: formData.appointmentId && formData.appointmentId !== "none" ? parseInt(formData.appointmentId) : null,
      recordDate: formData.recordDate,
      notes: formData.notes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Nota Clínica" : "Nueva Nota Clínica"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica la nota clínica del paciente"
              : "Agrega una nueva nota a la historia clínica del paciente"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="recordDate">Fecha *</Label>
              <Input
                id="recordDate"
                type="date"
                value={formData.recordDate}
                onChange={(e) =>
                  setFormData({ ...formData, recordDate: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="appointmentId">Relacionar con Turno (Opcional)</Label>
              <Select
                value={formData.appointmentId}
                onValueChange={(value) =>
                  setFormData({ ...formData, appointmentId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin relacionar</SelectItem>
                  {appointments?.map((appointment: any) => (
                    <SelectItem
                      key={appointment.id}
                      value={appointment.id.toString()}
                    >
                      {new Date(appointment.datetimeStart).toLocaleString("es-AR")} -{" "}
                      {appointment.clinic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas *</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Escribe las notas de evolución del paciente..."
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
