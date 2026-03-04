"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppointmentWithRelations, Clinic, User, UserRole } from "@/types";
import { FullCalendarWrapper } from "@/components/calendar/full-calendar-wrapper";
import { AppointmentDetailsDialog } from "@/components/calendar/appointment-details-dialog";

interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

async function fetchAppointments(options: {
  startDate?: string;
  endDate?: string;
  clinicId?: string;
  userId?: string;
} = {}): Promise<AppointmentWithRelations[]> {
  const params = new URLSearchParams();
  if (options.startDate) params.append("startDate", options.startDate);
  if (options.endDate) params.append("endDate", options.endDate);
  if (options.clinicId) params.append("clinicId", options.clinicId);
  if (options.userId) params.append("userId", options.userId);

  const url = `/api/appointments${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Error fetching appointments");
  return response.json();
}

async function fetchClinics(): Promise<Clinic[]> {
  const response = await fetch("/api/clinics");
  if (!response.ok) throw new Error("Error fetching clinics");
  return response.json();
}

async function fetchUsers(): Promise<User[]> {
  const response = await fetch("/api/users");
  if (!response.ok) throw new Error("Error fetching users");
  return response.json();
}

async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const response = await fetch("/api/users/me");
  if (!response.ok) return null;
  return response.json();
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"dayGridMonth" | "timeGridWeek" | "timeGridDay">("dayGridMonth");
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithRelations | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedClinicId, setSelectedClinicId] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");

  // Cargar un rango amplio: 6 meses atrás y 12 meses adelante para ver histórico y futuro
  const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1);
  const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 12, 0, 23, 59, 59);

  const { data: clinics } = useQuery({
    queryKey: ["clinics"],
    queryFn: fetchClinics,
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: fetchCurrentUser,
  });

  const canFilterByUser =
    currentUser && (currentUser.role === "admin" || currentUser.role === "secretary");

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments", "calendar", selectedClinicId, selectedUserId],
    queryFn: () =>
      fetchAppointments({
        clinicId: selectedClinicId !== "all" ? selectedClinicId : undefined,
        userId:
          canFilterByUser && selectedUserId !== "all" ? selectedUserId : undefined,
      }),
  });

  const getClinicColor = (clinicName?: string | null): string => {
    const name = clinicName?.toLowerCase() || "";

    if (name.includes("viso")) {
      // Dental del Viso - celeste
      return "#38bdf8"; // sky-400
    }

    if (name.includes("agora")) {
      // Agora Dental - verde
      return "#22c55e"; // green-500
    }

    // Color por defecto si no matchea ningún consultorio
    return "#3b82f6"; // blue-500
  };

  // Convertir appointments a eventos de FullCalendar
  const events = appointments?.map((apt) => {
    // Asegurarse de que las fechas sean objetos Date válidos
    const startDate = apt.datetimeStart instanceof Date 
      ? apt.datetimeStart 
      : new Date(apt.datetimeStart);
    const endDate = apt.datetimeEnd instanceof Date 
      ? apt.datetimeEnd 
      : new Date(apt.datetimeEnd);
    
    // Validar que las fechas sean válidas
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.warn("Invalid date for appointment:", apt.id, apt.datetimeStart, apt.datetimeEnd);
      return null;
    }
    
    // Usar formato ISO para FullCalendar (asegurar que incluya hora)
    // FullCalendar espera fechas en formato ISO 8601 con zona horaria
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();
    
    // Debug para eventos del día 12
    if (startDate.getDate() === 12 && startDate.getMonth() === 0 && startDate.getFullYear() === 2026) {
      console.log("Event for Jan 12:", {
        id: apt.id,
        patient: `${apt.patient.firstName} ${apt.patient.lastName}`,
        startISO,
        endISO,
        startLocal: startDate.toString(),
        startHour: startDate.getHours(),
        startMinute: startDate.getMinutes(),
      });
    }
    
    const clinicColor = getClinicColor(apt.clinic?.name);
    const hasPendingTasks = apt.tasks?.some((t) => !t.done) ?? false;

    return {
      id: apt.id.toString(),
      title: `${apt.patient.firstName} ${apt.patient.lastName}`,
      start: startISO,
      end: endISO,
      allDay: false, // Asegurar que no sean eventos de día completo
      backgroundColor: clinicColor,
      borderColor: clinicColor,
      display: "block", // Mostrar como bloque en vistas de tiempo
      classNames: hasPendingTasks ? ["has-appointment-task"] : [],
      extendedProps: {
        patient: apt.patient,
        clinic: apt.clinic,
        treatment: apt.treatment,
        user: apt.user,
        status: apt.status,
        notes: apt.notes,
      },
    };
  }).filter((event) => event !== null) || [];

  const handleDateClick = (info: any) => {
    // Aquí podrías abrir un modal para crear un nuevo turno
    console.log("Date clicked:", info.dateStr);
  };

  const handleEventClick = (info: any) => {
    // Buscar el appointment completo en los datos
    const eventId = parseInt(info.event.id);
    const appointment = appointments?.find((apt) => apt.id === eventId);
    
    if (appointment) {
      setSelectedAppointment(appointment);
      setIsDetailsDialogOpen(true);
    }
  };

  const handleViewChange = (newView: "dayGridMonth" | "timeGridWeek" | "timeGridDay") => {
    setView(newView);
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendario</h1>
          <p className="text-muted-foreground">
            Vista de calendario de turnos y citas
          </p>
        </div>
        <div className="flex flex-col items-stretch sm:items-end gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant={view === "dayGridMonth" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange("dayGridMonth")}
              className="flex-1 sm:flex-initial"
            >
              Mes
            </Button>
            <Button
              variant={view === "timeGridWeek" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange("timeGridWeek")}
              className="flex-1 sm:flex-initial"
            >
              Semana
            </Button>
            <Button
              variant={view === "timeGridDay" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange("timeGridDay")}
              className="flex-1 sm:flex-initial"
            >
              Día
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Consultorio:
              </span>
              <Select
                value={selectedClinicId}
                onValueChange={setSelectedClinicId}
              >
                <SelectTrigger className="h-8 w-[200px]">
                  <SelectValue placeholder="Todos los consultorios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los consultorios</SelectItem>
                  {clinics?.map((clinic) => (
                    <SelectItem key={clinic.id} value={clinic.id.toString()}>
                      {clinic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {canFilterByUser && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Odontólogo:
                </span>
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                >
                  <SelectTrigger className="h-8 w-[200px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {users
                      ?.filter((user) => user.role === "odontologo")
                      .map((user) => (
                        <SelectItem
                          key={user.id}
                          value={user.id.toString()}
                        >
                          {user.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-muted-foreground">Cargando turnos...</p>
            </div>
          ) : (
            <div className="calendar-container">
              <FullCalendarWrapper
                key={view}
                initialView={view}
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "", // Ocultar botones de vista, usar los personalizados
                }}
                buttonText={{
                  today: "Hoy",
                  month: "Mes",
                  week: "Semana",
                  day: "Día",
                }}
                moreLinkText="más"
                events={events}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                locale="es"
                height="auto"
                eventDisplay="block"
                eventTimeFormat={{
                  hour: "2-digit",
                  minute: "2-digit",
                  meridiem: "short",
                }}
                dayMaxEvents={3}
                moreLinkClick="popover"
                // Configuración de horario para vistas de tiempo (9:00 - 20:00)
                slotMinTime="09:00:00"
                slotMaxTime="20:00:00"
                slotDuration="00:30:00"
                snapDuration="00:30:00"
                slotLabelInterval="01:00:00"
                slotLabelFormat={{
                  hour: "2-digit",
                  minute: "2-digit",
                  omitZeroMinute: true,
                  meridiem: "short",
                }}
                allDaySlot={false}
                // Configuraciones específicas por vista
                views={{
                  timeGridDay: {
                    slotMinTime: "09:00:00",
                    slotMaxTime: "20:00:00",
                    slotDuration: "00:30:00",
                    snapDuration: "00:30:00",
                    slotLabelInterval: "01:00:00",
                    slotLabelFormat: {
                      hour: "2-digit",
                      minute: "2-digit",
                      omitZeroMinute: true,
                      meridiem: "short",
                    },
                  },
                  timeGridWeek: {
                    slotMinTime: "09:00:00",
                    slotMaxTime: "20:00:00",
                    slotDuration: "00:30:00",
                    snapDuration: "00:30:00",
                    slotLabelInterval: "01:00:00",
                    slotLabelFormat: {
                      hour: "2-digit",
                      minute: "2-digit",
                      omitZeroMinute: true,
                      meridiem: "short",
                    },
                  },
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leyenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-sky-400"></div>
              <span className="text-sm">Dental del Viso</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-sm">Agora Dental</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <AppointmentDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        appointment={selectedAppointment}
      />
    </div>
  );
}
