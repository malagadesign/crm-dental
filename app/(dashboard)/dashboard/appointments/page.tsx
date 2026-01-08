"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Plus, Pencil, Trash2, Clock } from "lucide-react";
import { AppointmentDialog } from "@/components/appointments/appointment-dialog";
import { AppointmentWithRelations } from "@/types";
import { formatDateTime } from "@/lib/utils";

async function fetchAppointments(): Promise<AppointmentWithRelations[]> {
  const response = await fetch("/api/appointments");
  if (!response.ok) throw new Error("Error fetching appointments");
  return response.json();
}

async function deleteAppointment(id: number): Promise<void> {
  const response = await fetch(`/api/appointments/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Error deleting appointment");
}

const statusColors = {
  confirmado: "bg-blue-100 text-blue-800",
  cancelado: "bg-gray-100 text-gray-800",
  asistio: "bg-green-100 text-green-800",
  no_asistio: "bg-red-100 text-red-800",
};

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<AppointmentWithRelations | null>(null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: fetchAppointments,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  const handleEdit = (appointment: AppointmentWithRelations) => {
    setEditingAppointment(appointment);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este turno?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCreate = () => {
    setEditingAppointment(null);
    setIsDialogOpen(true);
  };

  // Filtrar turnos futuros o de hoy
  const upcomingAppointments =
    appointments?.filter(
      (apt) => new Date(apt.datetimeStart) >= new Date().setHours(0, 0, 0, 0)
    ) || [];

  // Filtrar turnos pasados
  const pastAppointments =
    appointments?.filter(
      (apt) => new Date(apt.datetimeStart) < new Date().setHours(0, 0, 0, 0)
    ) || [];

  // Ordenar por fecha (ascendente para futuros, descendente para pasados)
  upcomingAppointments.sort(
    (a, b) =>
      new Date(a.datetimeStart).getTime() - new Date(b.datetimeStart).getTime()
  );

  pastAppointments.sort(
    (a, b) =>
      new Date(b.datetimeStart).getTime() - new Date(a.datetimeStart).getTime()
  );

  const displayedAppointments =
    activeTab === "upcoming" ? upcomingAppointments : pastAppointments;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Turnos</h1>
          <p className="text-muted-foreground">
            Gestiona los turnos y citas de tus pacientes
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Turno
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "upcoming" | "past")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="upcoming">
            <Calendar className="mr-2 h-4 w-4" />
            Próximos ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            <Clock className="mr-2 h-4 w-4" />
            Histórico ({pastAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {isLoading ? (
            <div className="text-center py-12">Cargando...</div>
          ) : upcomingAppointments.length > 0 ? (
            <div className="grid gap-4">
              {upcomingAppointments.map((appointment) => (
                <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          <div>
                            <h3 className="text-lg font-semibold">
                              {appointment.patient.firstName}{" "}
                              {appointment.patient.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {formatDateTime(appointment.datetimeStart)} -{" "}
                              {new Date(appointment.datetimeEnd).toLocaleTimeString(
                                "es-AR",
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                          <div>
                            <span className="font-medium">Consultorio:</span>{" "}
                            {appointment.clinic.name}
                          </div>
                          {appointment.treatment && (
                            <div>
                              <span className="font-medium">Tratamiento:</span>{" "}
                              {appointment.treatment.name}
                            </div>
                          )}
                          {appointment.user && (
                            <div>
                              <span className="font-medium">Odontólogo:</span>{" "}
                              {appointment.user.name}
                            </div>
                          )}
                          <div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                statusColors[appointment.status]
                              }`}
                            >
                              {appointment.status}
                            </span>
                          </div>
                        </div>
                        {appointment.notes && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {appointment.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(appointment)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(appointment.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  No hay turnos programados
                </p>
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primer Turno
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {isLoading ? (
            <div className="text-center py-12">Cargando...</div>
          ) : pastAppointments.length > 0 ? (
            <div className="grid gap-4">
              {pastAppointments.map((appointment) => (
            <Card key={appointment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="text-lg font-semibold">
                          {appointment.patient.firstName}{" "}
                          {appointment.patient.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(appointment.datetimeStart)} -{" "}
                          {new Date(appointment.datetimeEnd).toLocaleTimeString(
                            "es-AR",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                      <div>
                        <span className="font-medium">Consultorio:</span>{" "}
                        {appointment.clinic.name}
                      </div>
                      {appointment.treatment && (
                        <div>
                          <span className="font-medium">Tratamiento:</span>{" "}
                          {appointment.treatment.name}
                        </div>
                      )}
                      {appointment.user && (
                        <div>
                          <span className="font-medium">Odontólogo:</span>{" "}
                          {appointment.user.name}
                        </div>
                      )}
                      <div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            statusColors[appointment.status]
                          }`}
                        >
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                    {appointment.notes && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {appointment.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(appointment)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(appointment.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No hay turnos en el histórico
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <AppointmentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        appointment={editingAppointment}
      />
    </div>
  );
}
