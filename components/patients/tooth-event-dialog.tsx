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
import { formatDate, formatDateTime } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Stethoscope, FileText, User, Clock } from "lucide-react";

interface ToothEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: number;
  toothNumber: number;
  onClose: () => void;
}

const statusOptions = [
  { value: "healthy", label: "Sano" },
  { value: "caries", label: "Caries" },
  { value: "filled", label: "Obturado" },
  { value: "crown", label: "Corona" },
  { value: "endo", label: "Endodoncia" },
  { value: "missing", label: "Ausente" },
  { value: "extraction", label: "Extracción" },
  { value: "implant", label: "Implante" },
  { value: "bridge", label: "Puente" },
  { value: "fracture", label: "Fractura" },
  { value: "watch", label: "Observar" },
];

async function fetchTreatments() {
  const response = await fetch("/api/treatments");
  if (!response.ok) throw new Error("Error fetching treatments");
  return response.json();
}

async function fetchAppointments(patientId: number) {
  const response = await fetch(`/api/appointments?patientId=${patientId}`);
  if (!response.ok) throw new Error("Error fetching appointments");
  return response.json();
}

async function fetchMedicalRecords(patientId: number) {
  const response = await fetch(`/api/medical-records?patientId=${patientId}`);
  if (!response.ok) throw new Error("Error fetching medical records");
  return response.json();
}

async function fetchToothEvents(patientId: number, toothNumber: number) {
  const response = await fetch(
    `/api/patients/${patientId}/odontogram/events?tooth=${toothNumber}`
  );
  if (!response.ok) throw new Error("Error fetching tooth events");
  return response.json();
}

async function fetchToothStates(patientId: number) {
  const response = await fetch(`/api/patients/${patientId}/odontogram/state`);
  if (!response.ok) throw new Error("Error fetching tooth states");
  return response.json();
}

async function createToothEvent(data: any) {
  const response = await fetch("/api/odontogram/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error creating tooth event");
  }
  return response.json();
}

export function ToothEventDialog({
  open,
  onOpenChange,
  patientId,
  toothNumber,
  onClose,
}: ToothEventDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    kind: "healthy",
    treatmentId: "none",
    appointmentId: "none",
    medicalRecordId: "none",
    note: "",
    eventDate: new Date().toISOString().split("T")[0],
  });

  const { data: treatments } = useQuery({
    queryKey: ["treatments"],
    queryFn: fetchTreatments,
    enabled: open,
  });

  const { data: appointments } = useQuery({
    queryKey: ["appointments", patientId],
    queryFn: () => fetchAppointments(patientId),
    enabled: open && !!patientId,
  });

  const { data: medicalRecords } = useQuery({
    queryKey: ["medical-records", patientId],
    queryFn: () => fetchMedicalRecords(patientId),
    enabled: open && !!patientId,
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["tooth-events", patientId, toothNumber],
    queryFn: () => fetchToothEvents(patientId, toothNumber),
    enabled: open && !!patientId && !!toothNumber,
  });

  const { data: toothStates } = useQuery({
    queryKey: ["tooth-states", patientId],
    queryFn: () => fetchToothStates(patientId),
    enabled: open && !!patientId,
  });

  useEffect(() => {
    if (open) {
      // Obtener el estado actual del diente específico
      const currentToothState = toothStates?.find(
        (state: any) => state.toothNumber === toothNumber
      );
      const currentStatus = currentToothState?.currentStatus || "healthy";

      setFormData({
        kind: currentStatus,
        treatmentId: "none",
        appointmentId: "none",
        medicalRecordId: "none",
        note: "",
        eventDate: new Date().toISOString().split("T")[0],
      });
    }
  }, [open, toothNumber, toothStates]);

  const mutation = useMutation({
    mutationFn: createToothEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tooth-states", patientId] });
      queryClient.invalidateQueries({
        queryKey: ["tooth-events", patientId, toothNumber],
      });
      queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
      setFormData({
        kind: "healthy",
        treatmentId: "none",
        appointmentId: "none",
        medicalRecordId: "none",
        note: "",
        eventDate: new Date().toISOString().split("T")[0],
      });
      // No cerrar el diálogo automáticamente para permitir ver el historial
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      patientId,
      toothNumber,
      kind: formData.kind,
      treatmentId: formData.treatmentId && formData.treatmentId !== "none" ? parseInt(formData.treatmentId) : null,
      appointmentId: formData.appointmentId && formData.appointmentId !== "none"
        ? parseInt(formData.appointmentId)
        : null,
      medicalRecordId: formData.medicalRecordId && formData.medicalRecordId !== "none"
        ? parseInt(formData.medicalRecordId)
        : null,
      note: formData.note || null,
      eventDate: formData.eventDate,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Diente {toothNumber} - Eventos Odontológicos</DialogTitle>
          <DialogDescription>
            Agrega un nuevo evento o revisa el historial del diente
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new">Nuevo Evento</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-4">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="kind">Estado *</Label>
                  <Select
                    value={formData.kind}
                    onValueChange={(value) =>
                      setFormData({ ...formData, kind: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="eventDate">Fecha *</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) =>
                      setFormData({ ...formData, eventDate: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="treatmentId">
                    Tratamiento (Opcional)
                  </Label>
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
                      <SelectItem value="none">Sin tratamiento</SelectItem>
                      {treatments?.map((treatment: any) => (
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

                <div className="grid gap-2">
                  <Label htmlFor="appointmentId">
                    Relacionar con Turno (Opcional)
                  </Label>
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
                          {formatDateTime(appointment.datetimeStart)} -{" "}
                          {appointment.clinic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="medicalRecordId">
                    Relacionar con Nota Clínica (Opcional)
                  </Label>
                  <Select
                    value={formData.medicalRecordId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, medicalRecordId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar nota clínica" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin relacionar</SelectItem>
                      {medicalRecords?.map((record: any) => (
                        <SelectItem
                          key={record.id}
                          value={record.id.toString()}
                        >
                          {formatDate(record.recordDate)} -{" "}
                          {record.notes.substring(0, 50)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="note">Nota (Opcional)</Label>
                  <textarea
                    id="note"
                    value={formData.note}
                    onChange={(e) =>
                      setFormData({ ...formData, note: e.target.value })
                    }
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Agrega notas adicionales sobre el evento..."
                  />
                </div>

                {mutation.isError && (
                  <div className="text-sm text-red-600">
                    {(mutation.error as Error).message}
                  </div>
                )}

                {mutation.isSuccess && (
                  <div className="text-sm text-green-600">
                    Evento creado exitosamente
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cerrar
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Guardando..." : "Guardar Evento"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {eventsLoading ? (
              <div className="text-center py-8">Cargando...</div>
            ) : events && events.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {events.map((event: any) => (
                  <div
                    key={event.id}
                    className="border-l-4 border-primary pl-4 py-2"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {formatDate(event.eventDate)}
                        </span>
                        <span className="px-2 py-1 rounded text-xs bg-muted">
                          {
                            statusOptions.find((o) => o.value === event.kind)
                              ?.label || event.kind
                          }
                        </span>
                      </div>
                    </div>
                    {event.treatment && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Stethoscope className="h-3 w-3" />
                        <span>{event.treatment.name}</span>
                      </div>
                    )}
                    {event.appointment && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          Turno: {formatDateTime(event.appointment.datetimeStart)}
                        </span>
                      </div>
                    )}
                    {event.medicalRecord && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <FileText className="h-3 w-3" />
                        <span>
                          Nota Clínica: {formatDate(event.medicalRecord.recordDate)}
                        </span>
                      </div>
                    )}
                    {event.createdByUser && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <User className="h-3 w-3" />
                        <span>Por: {event.createdByUser.name}</span>
                      </div>
                    )}
                    {event.note && (
                      <p className="text-sm whitespace-pre-wrap mt-1">
                        {event.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay eventos registrados para este diente
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
