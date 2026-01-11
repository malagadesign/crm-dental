"use client";

import { useState, useEffect, useMemo } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AppointmentWithRelations, Clinic, Treatment, User, AppointmentStatus } from "@/types";
import { Search, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
  
  // Leer el body solo una vez
  let responseData: any;
  try {
    const text = await response.text();
    if (!text) {
      throw new Error("Empty response from server");
    }
    responseData = JSON.parse(text);
  } catch (e) {
    // Si no se puede parsear como JSON, lanzar error
    throw new Error("Invalid response format from server");
  }
  
  if (!response.ok) {
    const errorMessage = responseData?.error || responseData?.details || "Error creating appointment";
    throw new Error(errorMessage);
  }
  
  return responseData;
}

async function updateAppointment(id: number, data: any) {
  const response = await fetch(`/api/appointments/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  // Leer el body solo una vez
  let responseData: any;
  try {
    const text = await response.text();
    if (!text) {
      throw new Error("Empty response from server");
    }
    responseData = JSON.parse(text);
  } catch (e) {
    // Si no se puede parsear como JSON, lanzar error
    throw new Error("Invalid response format from server");
  }
  
  if (!response.ok) {
    const errorMessage = responseData?.error || responseData?.details || "Error updating appointment";
    throw new Error(errorMessage);
  }
  
  return responseData;
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
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");

  const { data: patientsData } = useQuery({
    queryKey: ["patients", "all"],
    queryFn: fetchPatients,
  });
  
  // Asegurar que patients sea un array
  const patients = Array.isArray(patientsData) ? patientsData : [];

  // Filtrar pacientes según búsqueda
  const filteredPatients = useMemo(() => {
    if (!patientSearchQuery.trim()) {
      return patients.slice(0, 50); // Limitar a 50 por rendimiento
    }
    
    const query = patientSearchQuery.toLowerCase().trim();
    return patients.filter((patient: any) => {
      const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
      const dni = patient.dni?.toLowerCase() || "";
      const phone = patient.phone?.toLowerCase() || "";
      const email = patient.email?.toLowerCase() || "";
      
      return (
        fullName.includes(query) ||
        dni.includes(query) ||
        phone.includes(query) ||
        email.includes(query)
      );
    }).slice(0, 50); // Limitar resultados a 50
  }, [patients, patientSearchQuery]);

  // Obtener paciente seleccionado para mostrar
  const selectedPatient = patients.find(
    (p: any) => p.id.toString() === formData.patientId
  );

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
      
      // Normalizar hora de inicio (9-20, minutos a 0 o 30)
      const startHour = start.getHours();
      const startMinute = start.getMinutes();
      const normalizedStartHour = startHour < 9 ? 9 : startHour > 20 ? 20 : startHour;
      const normalizedStartMinute = Math.round(startMinute / 30) * 30;
      const timeStartStr = `${String(normalizedStartHour).padStart(2, "0")}:${String(normalizedStartMinute).padStart(2, "0")}`;
      
      // Normalizar hora de fin (9-20, minutos a 0 o 30)
      const endHour = end.getHours();
      const endMinute = end.getMinutes();
      const normalizedEndHour = endHour < 9 ? 9 : endHour > 20 ? 20 : endHour;
      const normalizedEndMinute = Math.round(endMinute / 30) * 30;
      const timeEndStr = `${String(normalizedEndHour).padStart(2, "0")}:${String(normalizedEndMinute).padStart(2, "0")}`;
      
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
      
      // Normalizar hora de inicio (9-20, minutos a 0 o 30)
      const startHour = now.getHours();
      const startMinute = now.getMinutes();
      const normalizedStartHour = startHour < 9 ? 9 : startHour > 20 ? 20 : startHour;
      const normalizedStartMinute = Math.round(startMinute / 30) * 30;
      const timeStartStr = `${String(normalizedStartHour).padStart(2, "0")}:${String(normalizedStartMinute).padStart(2, "0")}`;
      
      // Normalizar hora de fin (9-20, minutos a 0 o 30)
      const endHour = defaultEnd.getHours();
      const endMinute = defaultEnd.getMinutes();
      const normalizedEndHour = endHour < 9 ? 9 : endHour > 20 ? 20 : endHour;
      const normalizedEndMinute = Math.round(endMinute / 30) * 30;
      const timeEndStr = `${String(normalizedEndHour).padStart(2, "0")}:${String(normalizedEndMinute).padStart(2, "0")}`;
      
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
    setPatientSearchQuery("");
    setPatientSearchOpen(false);
  }, [appointment, open]);

  // Calcular timeEnd automáticamente cuando cambia treatmentId o timeStart
  useEffect(() => {
    if (!formData.timeStart) return;
    
    // Validar formato de hora
    if (!/^\d{2}:\d{2}$/.test(formData.timeStart)) return;
    
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
    
    // Validar valores
    if (isNaN(startHour) || isNaN(startMinute) || startMinute < 0 || startMinute >= 60) {
      return;
    }
    
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = startTotalMinutes + durationMinutes;
    const endHour = Math.floor(endTotalMinutes / 60);
    const endMinute = endTotalMinutes % 60;
    
    // Asegurar que esté en el rango válido (9-20) y normalizar minutos a 0 o 30
    const finalHour = Math.min(Math.max(endHour, 9), 20); // Limitar entre 9 y 20
    const normalizedEndMinute = Math.round(endMinute / 30) * 30; // Normalizar a 0 o 30
    const finalMinute = finalHour === 20 ? 0 : normalizedEndMinute;
    
    const timeEndStr = `${String(finalHour).padStart(2, "0")}:${String(finalMinute).padStart(2, "0")}`;
    
    setFormData((prev) => {
      // Solo actualizar si el valor cambió
      if (prev.timeEnd !== timeEndStr) {
        return { ...prev, timeEnd: timeEndStr };
      }
      return prev;
    });
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
              <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={patientSearchOpen}
                    className="w-full justify-between h-10 font-normal"
                  >
                    {selectedPatient ? (
                      <span>
                        {selectedPatient.firstName} {selectedPatient.lastName}
                        {selectedPatient.dni && (
                          <span className="text-muted-foreground ml-2">
                            (DNI: {selectedPatient.dni})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Buscar paciente...
                      </span>
                    )}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <div className="flex flex-col">
                    <div className="flex items-center border-b px-3">
                      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      <Input
                        placeholder="Buscar por nombre, DNI, teléfono o email..."
                        value={patientSearchQuery}
                        onChange={(e) => setPatientSearchQuery(e.target.value)}
                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {filteredPatients.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          {patientSearchQuery
                            ? "No se encontraron pacientes"
                            : "Escribe para buscar pacientes"}
                        </div>
                      ) : (
                        <div className="p-1">
                          {filteredPatients.map((patient: any) => (
                            <button
                              key={patient.id}
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  patientId: patient.id.toString(),
                                });
                                setPatientSearchOpen(false);
                                setPatientSearchQuery("");
                              }}
                              className={cn(
                                "w-full flex items-center justify-between px-3 py-2 text-sm rounded-sm hover:bg-accent cursor-pointer transition-colors",
                                formData.patientId === patient.id.toString() &&
                                  "bg-accent"
                              )}
                            >
                              <div className="flex flex-col items-start flex-1 min-w-0">
                                <span className="font-medium truncate w-full">
                                  {patient.firstName} {patient.lastName}
                                </span>
                                <div className="flex gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                                  {patient.dni && (
                                    <span>DNI: {patient.dni}</span>
                                  )}
                                  {patient.phone && (
                                    <span>Tel: {patient.phone}</span>
                                  )}
                                </div>
                              </div>
                              {formData.patientId === patient.id.toString() && (
                                <Check className="h-4 w-4 text-primary ml-2 shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              {!formData.patientId && (
                <p className="text-xs text-destructive mt-1">
                  Selecciona un paciente
                </p>
              )}
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
