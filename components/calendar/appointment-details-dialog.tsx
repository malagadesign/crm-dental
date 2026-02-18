"use client";

import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, User, Building2, Stethoscope, FileText, Phone, MessageCircle, Search, Check, ChevronDown } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AppointmentWithRelations, AppointmentStatus, Treatment, User as UserType, Clinic } from "@/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Función para generar link de WhatsApp
function getWhatsAppLink(phone: string | null | undefined): string | null {
  if (!phone) return null;
  // Remover espacios, guiones y caracteres especiales, solo dejar números
  const cleanPhone = phone.replace(/\D/g, '');
  if (!cleanPhone) return null;
  // Si no empieza con código de país, agregar 54 (Argentina)
  const phoneWithCountry = cleanPhone.startsWith('54') ? cleanPhone : `54${cleanPhone}`;
  return `https://wa.me/${phoneWithCountry}`;
}

interface AppointmentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: AppointmentWithRelations | null;
}

function getStatusColor(status: string): string {
  switch (status) {
    case "confirmado":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "cancelado":
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    case "asistio":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "no_asistio":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    default:
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
  }
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    confirmado: "Confirmado",
    cancelado: "Cancelado",
    asistio: "Asistió",
    no_asistio: "No Asistió",
  };
  return labels[status] || status;
}

async function fetchPatients() {
  const response = await fetch("/api/patients?limit=1000");
  if (!response.ok) throw new Error("Error fetching patients");
  const result = await response.json();
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

async function fetchPatientAppointments(patientId: number) {
  const response = await fetch(`/api/appointments?patientId=${patientId}`);
  if (!response.ok) throw new Error("Error fetching patient appointments");
  const appointments = await response.json();
  // Asegurar que es un array
  const appointmentsArray = Array.isArray(appointments) ? appointments : (appointments.data || []);
  // Ordenar por fecha descendente y tomar los últimos 10
  return appointmentsArray
    .sort((a: any, b: any) => 
      new Date(b.datetimeStart).getTime() - new Date(a.datetimeStart).getTime()
    )
    .slice(0, 10);
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

export function AppointmentDetailsDialog({
  open,
  onOpenChange,
  appointment,
}: AppointmentDetailsDialogProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
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
    enabled: isEditing,
  });
  
  const patients = Array.isArray(patientsData) ? patientsData : [];

  // Filtrar pacientes según búsqueda
  const filteredPatients = useMemo(() => {
    if (!patientSearchQuery.trim()) {
      return patients.slice(0, 50);
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
    }).slice(0, 50);
  }, [patients, patientSearchQuery]);

  // Obtener paciente seleccionado para mostrar
  const selectedPatient = patients.find(
    (p: any) => p.id.toString() === formData.patientId
  );

  const { data: clinics } = useQuery({
    queryKey: ["clinics"],
    queryFn: fetchClinics,
    enabled: isEditing,
  });

  const { data: treatments } = useQuery({
    queryKey: ["treatments"],
    queryFn: fetchTreatments,
    enabled: isEditing,
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    enabled: isEditing,
  });

  // Cargar historial de turnos del paciente (solo en modo visualización)
  const { data: patientAppointments } = useQuery({
    queryKey: ["patient-appointments", appointment?.patient?.id],
    queryFn: () => appointment?.patient?.id ? fetchPatientAppointments(appointment.patient.id) : [],
    enabled: !isEditing && !!appointment?.patient?.id,
  });

  // Filtrar el turno actual del historial (ya viene ordenado de fetchPatientAppointments)
  const patientHistory = patientAppointments
    ?.filter((apt: any) => apt.id !== appointment?.id)
    .slice(0, 5) || [];

  // Inicializar formulario cuando se abre el modal o cambia el appointment
  useEffect(() => {
    if (appointment && open) {
      const start = new Date(appointment.datetimeStart);
      const end = new Date(appointment.datetimeEnd);
      // Usar fecha y hora local (no UTC) para el formulario
      const dateStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
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
      setIsEditing(false);
      setError("");
      setPatientSearchQuery("");
      setPatientSearchOpen(false);
    } else if (!open) {
      // Resetear cuando se cierra el modal
      setIsEditing(false);
      setError("");
      setPatientSearchQuery("");
      setPatientSearchOpen(false);
    }
  }, [appointment, open]);

  // Calcular timeEnd automáticamente solo al crear; al editar no sobrescribir hora de fin
  useEffect(() => {
    if (!isEditing || !formData.timeStart || appointment) return;
    
    // Validar formato de hora
    if (!/^\d{2}:\d{2}$/.test(formData.timeStart)) return;
    
    let durationMinutes = 30;
    
    if (formData.treatmentId && treatments && formData.treatmentId !== "none") {
      const treatment = treatments.find(
        (t: Treatment) => t.id.toString() === formData.treatmentId
      );
      if (treatment) {
        durationMinutes = treatment.durationMinutes;
      }
    }
    
    const [startHour, startMinute] = formData.timeStart.split(":").map(Number);
    
    // Validar valores
    if (isNaN(startHour) || isNaN(startMinute) || startMinute < 0 || startMinute >= 60) {
      return;
    }
    
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = startTotalMinutes + durationMinutes;
    const endHour = Math.floor(endTotalMinutes / 60);
    let endMinute = endTotalMinutes % 60;
    
    // Normalizar minutos (asegurar que estén en 0-59)
    if (endMinute >= 60) {
      const extraHours = Math.floor(endMinute / 60);
      endMinute = endMinute % 60;
      // Esto no debería pasar, pero por seguridad
    }
    
    // Asegurar que no pase de las 20:00
    const finalHour = Math.min(endHour, 20);
    const finalMinute = finalHour === 20 ? 0 : endMinute;
    
    const timeEndStr = `${String(finalHour).padStart(2, "0")}:${String(finalMinute).padStart(2, "0")}`;
    
    setFormData((prev) => {
      // Solo actualizar si el valor cambió
      if (prev.timeEnd !== timeEndStr) {
        return { ...prev, timeEnd: timeEndStr };
      }
      return prev;
    });
  }, [formData.treatmentId, formData.timeStart, treatments, isEditing]);

  const mutation = useMutation({
    mutationFn: (data: any) => appointment ? updateAppointment(appointment.id, data) : Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setIsEditing(false);
      setError("");
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment) return;
    
    setError("");
    
    // Incluir zona horaria del cliente para que el servidor guarde el instante correcto
    const offsetMin = -new Date().getTimezoneOffset();
    const offsetSign = offsetMin >= 0 ? "+" : "-";
    const offsetAbs = Math.abs(offsetMin);
    const offsetStr = offsetSign + String(Math.floor(offsetAbs / 60)).padStart(2, "0") + ":" + String(offsetAbs % 60).padStart(2, "0");
    
    const datetimeStart = `${formData.date}T${formData.timeStart}:00${offsetStr}`;
    const datetimeEnd = `${formData.date}T${formData.timeEnd}:00${offsetStr}`;
    
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

  if (!appointment) return null;

  const startDate = new Date(appointment.datetimeStart);
  const endDate = new Date(appointment.datetimeEnd);
  const duration = Math.round(
    (endDate.getTime() - startDate.getTime()) / 60000
  );

  // Si está en modo edición, mostrar formulario
  if (isEditing) {
    return (
      <Dialog 
        open={open} 
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setIsEditing(false);
            setError("");
          }
          onOpenChange(isOpen);
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Turno</DialogTitle>
            <DialogDescription>
              Modifica la información del turno
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
                      type="button"
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
                      ?.filter((user: UserType) => user.role === "odontologo")
                      .map((user: UserType) => (
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
                onClick={() => {
                  setIsEditing(false);
                  setError("");
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Guardando..." : "Actualizar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Detalles del Turno</DialogTitle>
          <DialogDescription>
            Información completa del turno programado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Paciente */}
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Paciente
              </p>
              <Link
                href={`/dashboard/patients/${appointment.patient.id}`}
                className="text-lg font-semibold hover:text-primary transition-colors block mb-3"
              >
                {appointment.patient.firstName} {appointment.patient.lastName}
              </Link>
              <div className="grid grid-cols-2 gap-4">
                {/* DNI */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    DNI
                  </p>
                  <p className="text-sm font-medium">
                    {appointment.patient.dni || (
                      <span className="text-muted-foreground italic">No disponible</span>
                    )}
                  </p>
                </div>
                {/* Teléfono con WhatsApp */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Teléfono
                  </p>
                  {appointment.patient.phone ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={getWhatsAppLink(appointment.patient.phone) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center gap-1 transition-colors"
                      >
                        <MessageCircle className="h-4 w-4" />
                        {appointment.patient.phone}
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No disponible
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Fecha y Hora */}
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Fecha y Hora
              </p>
              <p className="text-base font-medium">
                {formatDateTime(startDate)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Duración: {duration} minutos
                </p>
              </div>
            </div>
          </div>

          {/* Consultorio */}
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Consultorio
              </p>
              <p className="text-base font-medium">
                {appointment.clinic.name}
              </p>
              {appointment.clinic.address && (
                <p className="text-sm text-muted-foreground mt-1">
                  {appointment.clinic.address}
                </p>
              )}
            </div>
          </div>

          {/* Tratamiento */}
          {appointment.treatment && (
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Stethoscope className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Tratamiento
                </p>
                <p className="text-base font-medium">
                  {appointment.treatment.name}
                </p>
                {appointment.treatment.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {appointment.treatment.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Odontólogo */}
          {appointment.user && (
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Odontólogo
                </p>
                <p className="text-base font-medium">{appointment.user.name}</p>
              </div>
            </div>
          )}


          {/* Notas */}
          {appointment.notes && (
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Notas
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  {appointment.notes}
                </p>
              </div>
            </div>
          )}

          {/* Historial de Turnos del Paciente */}
          {patientHistory && patientHistory.length > 0 && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-3">
                Historial de Turnos del Paciente
              </p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {patientHistory.map((histAppointment: any) => {
                  const histDate = new Date(histAppointment.datetimeStart);
                  const histEnd = new Date(histAppointment.datetimeEnd);
                  const histDuration = Math.round(
                    (histEnd.getTime() - histDate.getTime()) / 60000
                  );
                  const isHistPast = histDate < new Date();
                  
                  return (
                    <div
                      key={histAppointment.id}
                      className={`flex items-start justify-between p-3 border rounded-lg text-sm ${
                        isHistPast ? "opacity-75 bg-muted/30" : "bg-background"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {formatDateTime(histDate)}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getStatusColor(histAppointment.status)}`}
                          >
                            {getStatusLabel(histAppointment.status)}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          {histAppointment.clinic && (
                            <div>{histAppointment.clinic.name}</div>
                          )}
                          {histAppointment.treatment && (
                            <div>{histAppointment.treatment.name}</div>
                          )}
                          {histAppointment.user && (
                            <div>Dr. {histAppointment.user.name}</div>
                          )}
                          <div>Duración: {histDuration} min</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {patientHistory.length >= 5 && (
                <Link
                  href={`/dashboard/patients/${appointment.patient.id}`}
                  className="text-xs text-primary hover:underline mt-2 inline-block"
                >
                  Ver historial completo →
                </Link>
              )}
            </div>
          )}

          {/* Estado */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Estado del Turno
              </p>
              <Badge
                variant="outline"
                className={getStatusColor(appointment.status)}
              >
                {getStatusLabel(appointment.status)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={() => setIsEditing(true)}>
              Editar Turno
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

