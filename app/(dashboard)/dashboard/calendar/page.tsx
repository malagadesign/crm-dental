"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppointmentWithRelations } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { FullCalendarWrapper } from "@/components/calendar/full-calendar-wrapper";
import { AppointmentDetailsDialog } from "@/components/calendar/appointment-details-dialog";

async function fetchAppointments(startDate?: string, endDate?: string): Promise<AppointmentWithRelations[]> {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  
  const url = `/api/appointments${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Error fetching appointments");
  return response.json();
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"dayGridMonth" | "timeGridWeek" | "timeGridDay">("dayGridMonth");
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithRelations | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  // Cargar un rango amplio: 6 meses atrás y 12 meses adelante para ver histórico y futuro
  const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1);
  const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 12, 0, 23, 59, 59);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments", "calendar", "all"],
    queryFn: () => fetchAppointments(), // Sin filtros para cargar todos los turnos
  });

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
    
    return {
      id: apt.id.toString(),
      title: `${apt.patient.firstName} ${apt.patient.lastName}`,
      start: startISO,
      end: endISO,
      allDay: false, // Asegurar que no sean eventos de día completo
      backgroundColor: getStatusColor(apt.status),
      borderColor: getStatusColor(apt.status),
      display: "block", // Mostrar como bloque en vistas de tiempo
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
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-sm">Confirmado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-500"></div>
              <span className="text-sm">Cancelado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-sm">Asistió</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-sm">No Asistió</span>
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

function getStatusColor(status: string): string {
  switch (status) {
    case "confirmado":
      return "#3b82f6"; // blue
    case "cancelado":
      return "#6b7280"; // gray
    case "asistio":
      return "#10b981"; // green
    case "no_asistio":
      return "#ef4444"; // red
    default:
      return "#3b82f6";
  }
}
