"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
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
import { AppointmentWithRelations, Clinic, Treatment, User, AppointmentStatus } from "@/types";

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: AppointmentWithRelations | null;
}

async function fetchPatients() {
  const response = await fetch("/api/patients?limit=1000");
  if (!response.ok) throw new Error("Error fetching patients");
  const result = await response.json();
  // El API ahora devuelve { data, pagination }, extraer el array
  return result.data || result;
}

async function fetchClinics() {
  const response = await fetch("/api/clinics");
  if (!response.ok) throw new Error("Error fetching clinics");
  return response.json();
}

async function fetchTreatments() {
  const response = await fetch("/api/treatments");
  if (!response.ok) throw new Error("Error fetching treatments");
  return response.json();
}

async function fetchUsers() {
  const response = await fetch("/api/users");
  if (!response.ok) throw new Error("Error fetching users");
  return response.json();
}

async function createAppointment(data: any) {
  const response = await fetch("/api/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error creating appointment");
  }
  return response.json();
}

async function updateAppointment(id: number, data: any) {
  const response = await fetch(`/api/appointments/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error updating appointment");
  }
  return response.json();
}

export function AppointmentDialog({
  open,
  onOpenChange,
  appointment,
}: AppointmentDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<{
    patientId: string;
    clinicId: string;
    treatmentId: string;
    userId: string;
    date: string;
    timeStart: string;
    timeEnd: string;
    status: AppointmentStatus;
    notes: string;
  }>({
    patientId: "",
    clinicId: "",
    treatmentId: "",
    userId: "",
    date: "",
    timeStart: "",
    timeEnd: "",
    status: "confirmado",
    notes: "",
  });
  const [error, setError] = useState("");

  const { data: patientsData } = useQuery({
    queryKey: ["patients", "all"],
    queryFn: fetchPatients,
  });
  
  // Asegurar que patients sea un array
  const patients = Array.isArray(patientsData) ? patientsData : [];

  const { data: clinics } = useQuery({
    queryKey: ["clinics"],
    queryFn: fetchClinics,
  });

  const { data: treatments } = useQuery({
    queryKey: ["treatments"],
    queryFn: fetchTreatments,
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  useEffect(() => {
    if (appointment) {
      const start = new Date(appointment.datetimeStart);
      const end = new Date(appointment.datetimeEnd);
      const dateStr = start.toISOString().slice(0, 10);
      const timeStartStr = start.toTimeString().slice(0, 5);
      const timeEndStr = end.toTimeString().slice(0, 5);
      
      setFormData({
        patientId: appointment.patientId.toString(),
        clinicId: appointment.clinicId.toString(),
        treatmentId: appointment.treatmentId?.toString() || "none",
        userId: appointment.userId?.toString() || "unassigned",
        date: dateStr,
        timeStart: timeStartStr,
        timeEnd: timeEndStr,
        status: appointment.status,
        notes: appointment.notes || "",
      });
    } else {
      const now = new Date();
      const defaultEnd = new Date(now.getTime() + 30 * 60000);
      const dateStr = now.toISOString().slice(0, 10);
      const timeStartStr = now.toTimeString().slice(0, 5);
      const timeEndStr = defaultEnd.toTimeString().slice(0, 5);
      
      setFormData({
        patientId: "",
        clinicId: "",
        treatmentId: "none",
        userId: "unassigned",
        date: dateStr,
        timeStart: timeStartStr,
        timeEnd: timeEndStr,
        status: "confirmado",
        notes: "",
      });
    }
    setError("");
  }, [appointment, open]);

  // Calcular timeEnd automáticamente cuando cambia treatmentId o timeStart
  useEffect(() => {
    if (!formData.timeStart) return;
    
    let durationMinutes = 30; // Por defecto 30 minutos
    
    if (formData.treatmentId && treatments && formData.treatmentId !== "none") {
      const treatment = treatments.find(
        (t: Treatment) => t.id.toString() === formData.treatmentId
      );
      if (treatment) {
        durationMinutes = treatment.durationMinutes;
      }
    }
    
    // Calcular hora fin
    const [startHour, startMinute] = formData.timeStart.split(":").map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = startTotalMinutes + durationMinutes;
    const endHour = Math.floor(endTotalMinutes / 60);
    const endMinute = endTotalMinutes % 60;
    
    // Asegurar que no pase de las 20:00
    if (endHour > 20 || (endHour === 20 && endMinute > 0)) {
      const timeEndStr = "20:00";
      setFormData((prev) => ({
        ...prev,
        timeEnd: timeEndStr,
      }));
    } else {
      const timeEndStr = `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;
      setFormData((prev) => ({
        ...prev,
        timeEnd: timeEndStr,
      }));
    }
  }, [formData.treatmentId, formData.timeStart, treatments]);

  const mutation = useMutation({
    mutationFn: (data: any) =>
      appointment
        ? updateAppointment(appointment.id, data)
        : createAppointment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      onOpenChange(false);
      setError("");
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Combinar fecha y horas en datetimeStart y datetimeEnd
    const datetimeStart = `${formData.date}T${formData.timeStart}:00`;
    const datetimeEnd = `${formData.date}T${formData.timeEnd}:00`;
    
    // Convertir valores especiales a strings vacíos antes de enviar
    const submitData = {
      patientId: formData.patientId,
      clinicId: formData.clinicId,
      treatmentId: formData.treatmentId === "none" ? "" : formData.treatmentId,
      userId: formData.userId === "unassigned" ? "" : formData.userId,
      datetimeStart,
      datetimeEnd,
      status: formData.status,
      notes: formData.notes,
    };
    
    mutation.mutate(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {appointment ? "Editar Turno" : "Nuevo Turno"}
          </DialogTitle>
          <DialogDescription>
            {appointment
              ? "Modifica la información del turno"
              : "Programa un nuevo turno para un paciente"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="patientId">Paciente *</Label>
              <Select
                value={formData.patientId}
                onValueChange={(value) =>
                  setFormData({ ...formData, patientId: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients?.map((patient: any) => (
                    <SelectItem
                      key={patient.id}
                      value={patient.id.toString()}
                    >
                      {patient.firstName} {patient.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="clinicId">Consultorio *</Label>
                <Select
                  value={formData.clinicId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, clinicId: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar consultorio" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinics?.map((clinic: Clinic) => (
                      <SelectItem
                        key={clinic.id}
                        value={clinic.id.toString()}
                      >
                        {clinic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="treatmentId">Tratamiento</Label>
                <Select
                  value={formData.treatmentId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, treatmentId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tratamiento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguno</SelectItem>
                    {treatments
                      ?.filter((t: Treatment) => t.active)
                      .map((treatment: Treatment) => (
                        <SelectItem
                          key={treatment.id}
                          value={treatment.id.toString()}
                        >
                          {treatment.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="userId">Odontólogo</Label>
              <Select
                value={formData.userId}
                onValueChange={(value) =>
                  setFormData({ ...formData, userId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar odontólogo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Sin asignar</SelectItem>
                  {users
                    ?.filter((user: User) => user.role === "odontologo")
                    .map((user: User) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4">
              <DatePicker
                value={formData.date}
                onChange={(value) =>
                  setFormData({ ...formData, date: value })
                }
                label="Día"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <TimePicker
                  value={formData.timeStart}
                  onChange={(value) =>
                    setFormData({ ...formData, timeStart: value })
                  }
                  label="Hora Inicio"
                  required
                />
                <TimePicker
                  value={formData.timeEnd}
                  onChange={(value) =>
                    setFormData({ ...formData, timeEnd: value })
                  }
                  label="Hora Fin"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="asistio">Asistió</SelectItem>
                  <SelectItem value="no_asistio">No Asistió</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Notas adicionales sobre el turno..."
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
              {mutation.isPending
                ? "Guardando..."
                : appointment
                ? "Actualizar"
                : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
