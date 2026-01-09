"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, FileText, Calendar, Building2, Stethoscope, User, Clock } from "lucide-react";
import Link from "next/link";
import { formatDate, formatDateTime } from "@/lib/utils";
import { MedicalRecordDialog } from "@/components/patients/medical-record-dialog";

async function fetchPatient(id: number) {
  const response = await fetch(`/api/patients/${id}`);
  if (!response.ok) throw new Error("Error fetching patient");
  return response.json();
}

async function fetchMedicalRecords(patientId: number) {
  const response = await fetch(`/api/medical-records?patientId=${patientId}`);
  if (!response.ok) throw new Error("Error fetching medical records");
  return response.json();
}

const statusColors: Record<string, string> = {
  confirmado: "bg-blue-100 text-blue-800",
  cancelado: "bg-gray-100 text-gray-800",
  asistio: "bg-green-100 text-green-800",
  no_asistio: "bg-red-100 text-red-800",
};

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const patientId = parseInt(resolvedParams.id);
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => fetchPatient(patientId),
  });

  const { data: medicalRecords, isLoading: recordsLoading } = useQuery({
    queryKey: ["medical-records", patientId],
    queryFn: () => fetchMedicalRecords(patientId),
    enabled: !!patientId,
  });

  if (patientLoading) {
    return <div className="text-center py-12">Cargando...</div>;
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Paciente no encontrado</p>
        <Link href="/dashboard/patients">
          <Button variant="outline">Volver a Pacientes</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/patients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-muted-foreground">Detalle del paciente</p>
          </div>
        </div>
        <Button onClick={() => setIsRecordDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Nota Clínica
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {patient.dni && (
              <div>
                <span className="font-medium">DNI:</span> {patient.dni}
              </div>
            )}
            {patient.birthDate && (
              <div>
                <span className="font-medium">Fecha de Nacimiento:</span>{" "}
                {formatDate(patient.birthDate)}
              </div>
            )}
            {patient.phone && (
              <div>
                <span className="font-medium">Teléfono:</span> {patient.phone}
              </div>
            )}
            {patient.email && (
              <div>
                <span className="font-medium">Email:</span> {patient.email}
              </div>
            )}
            {patient.address && (
              <div>
                <span className="font-medium">Dirección:</span> {patient.address}
              </div>
            )}
            <div>
              <span className="font-medium">Origen:</span> {patient.origin}
            </div>
            {patient.notes && (
              <div>
                <span className="font-medium">Notas:</span>
                <p className="text-muted-foreground mt-1">{patient.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estadísticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="font-medium">Total de Turnos:</span>{" "}
              {patient.appointments?.length || 0}
            </div>
            <div>
              <span className="font-medium">Notas Clínicas:</span>{" "}
              {medicalRecords?.length || 0}
            </div>
            <div>
              <span className="font-medium">Registrado:</span>{" "}
              {formatDate(patient.createdAt)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Historia Clínica
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recordsLoading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : medicalRecords && medicalRecords.length > 0 ? (
            <div className="space-y-4">
              {medicalRecords.map((record: any) => (
                <div
                  key={record.id}
                  className="border-l-4 border-primary pl-4 py-2"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {formatDate(record.recordDate)}
                      </span>
                      {record.user && (
                        <span className="text-sm text-muted-foreground">
                          por {record.user.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{record.notes}</p>
                  {record.appointment && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Relacionado con turno del{" "}
                      {formatDateTime(record.appointment.datetimeStart)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay notas clínicas registradas
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historial de Turnos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patient.appointments && patient.appointments.length > 0 ? (
            <div className="space-y-3">
              {patient.appointments.map((appointment: any) => {
                const appointmentDate = new Date(appointment.datetimeStart);
                const appointmentEnd = new Date(appointment.datetimeEnd);
                const duration = Math.round(
                  (appointmentEnd.getTime() - appointmentDate.getTime()) / 60000
                );
                const isPast = appointmentDate < new Date();
                
                return (
                  <div
                    key={appointment.id}
                    className={`flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors ${
                      isPast ? "opacity-75" : ""
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="font-medium text-base">
                          {formatDateTime(appointmentDate)}
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            statusColors[appointment.status] || "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {appointment.status === "confirmado" ? "Confirmado" :
                           appointment.status === "cancelado" ? "Cancelado" :
                           appointment.status === "asistio" ? "Asistió" :
                           appointment.status === "no_asistio" ? "No Asistió" :
                           appointment.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span>{appointment.clinic.name}</span>
                        </div>
                        {appointment.treatment && (
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4" />
                            <span>{appointment.treatment.name}</span>
                          </div>
                        )}
                        {appointment.user && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>Dr. {appointment.user.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Duración: {duration} minutos</span>
                        </div>
                        {appointment.notes && (
                          <div className="mt-2 pt-2 border-t text-xs">
                            <span className="font-medium">Notas: </span>
                            {appointment.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay turnos registrados para este paciente
            </div>
          )}
        </CardContent>
      </Card>

      <MedicalRecordDialog
        open={isRecordDialogOpen}
        onOpenChange={setIsRecordDialogOpen}
        patientId={patientId}
      />
    </div>
  );
}
