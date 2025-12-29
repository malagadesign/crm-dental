"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Building2, Stethoscope, FileText } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { AppointmentWithRelations } from "@/types";

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

export function AppointmentDetailsDialog({
  open,
  onOpenChange,
  appointment,
}: AppointmentDetailsDialogProps) {
  if (!appointment) return null;

  const startDate = new Date(appointment.datetimeStart);
  const endDate = new Date(appointment.datetimeEnd);
  const duration = Math.round(
    (endDate.getTime() - startDate.getTime()) / 60000
  );

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
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Paciente
              </p>
              <Link
                href={`/dashboard/patients/${appointment.patient.id}`}
                className="text-lg font-semibold hover:text-primary transition-colors"
              >
                {appointment.patient.firstName} {appointment.patient.lastName}
              </Link>
              {appointment.patient.dni && (
                <p className="text-sm text-muted-foreground mt-1">
                  DNI: {appointment.patient.dni}
                </p>
              )}
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
          <Button asChild>
            <Link href={`/dashboard/appointments?edit=${appointment.id}`}>
              Editar Turno
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

