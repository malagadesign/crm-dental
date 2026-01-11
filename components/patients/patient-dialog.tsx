"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Patient, PatientOrigin } from "@prisma/client";
import { DNIScanner } from "./dni-scanner";
import { Scan } from "lucide-react";

interface PatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
}

async function createPatient(data: Omit<Patient, "id" | "createdAt" | "updatedAt">) {
  const response = await fetch("/api/patients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error creating patient");
  }
  return response.json();
}

async function updatePatient(
  id: number,
  data: Omit<Patient, "id" | "createdAt" | "updatedAt">
) {
  const response = await fetch(`/api/patients/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error updating patient");
  }
  return response.json();
}

export function PatientDialog({ open, onOpenChange, patient }: PatientDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    dni: string;
    birthDate: string;
    phone: string;
    email: string;
    address: string;
    origin: PatientOrigin;
    notes: string;
  }>({
    firstName: "",
    lastName: "",
    dni: "",
    birthDate: "",
    phone: "",
    email: "",
    address: "",
    origin: "otro",
    notes: "",
  });
  const [error, setError] = useState("");
  const [showDNIScanner, setShowDNIScanner] = useState(false);

  useEffect(() => {
    if (patient) {
      setFormData({
        firstName: patient.firstName || "",
        lastName: patient.lastName || "",
        dni: patient.dni || "",
        birthDate: patient.birthDate
          ? new Date(patient.birthDate).toISOString().split("T")[0]
          : "",
        phone: patient.phone || "",
        email: patient.email || "",
        address: patient.address || "",
        origin: patient.origin || "otro",
        notes: patient.notes || "",
      });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        dni: "",
        birthDate: "",
        phone: "",
        email: "",
        address: "",
        origin: "otro",
        notes: "",
      });
    }
    setError("");
  }, [patient, open]);

  const mutation = useMutation({
    mutationFn: (data: Omit<Patient, "id" | "createdAt" | "updatedAt">) =>
      patient
        ? updatePatient(patient.id, data)
        : createPatient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      onOpenChange(false);
      setFormData({
        firstName: "",
        lastName: "",
        dni: "",
        birthDate: "",
        phone: "",
        email: "",
        address: "",
        origin: "otro",
        notes: "",
      });
      setError("");
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Convertir formData al formato esperado por Prisma
    const data: Omit<Patient, "id" | "createdAt" | "updatedAt"> = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      dni: formData.dni || null,
      birthDate: formData.birthDate ? new Date(formData.birthDate) : null,
      phone: formData.phone || null,
      email: formData.email || null,
      address: formData.address || null,
      origin: formData.origin,
      notes: formData.notes || null,
    };
    
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {patient ? "Editar Paciente" : "Nuevo Paciente"}
          </DialogTitle>
          <DialogDescription>
            {patient
              ? "Modifica la información del paciente"
              : "Registra un nuevo paciente en el sistema"}
          </DialogDescription>
        </DialogHeader>
        {showDNIScanner ? (
          <DNIScanner
            onDataExtracted={(data) => {
              setFormData((prev) => ({
                ...prev,
                firstName: data.firstName || prev.firstName,
                lastName: data.lastName || prev.lastName,
                dni: data.dni || prev.dni,
                birthDate: data.birthDate || prev.birthDate,
                address: data.address || prev.address,
              }));
              setShowDNIScanner(false);
            }}
            onClose={() => setShowDNIScanner(false)}
          />
        ) : (
          <>
            {!patient && (
              <div className="mb-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDNIScanner(true)}
                  className="w-full"
                >
                  <Scan className="mr-2 h-4 w-4" />
                  Escanear DNI para extraer datos automáticamente
                </Button>
              </div>
            )}
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">Nombre *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                  placeholder="Ej: Juan"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Apellido *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                  placeholder="Ej: Pérez"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dni">DNI</Label>
                <Input
                  id="dni"
                  value={formData.dni}
                  onChange={(e) =>
                    setFormData({ ...formData, dni: e.target.value })
                  }
                  placeholder="Ej: 12345678"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) =>
                    setFormData({ ...formData, birthDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="Ej: +54 11 1234-5678"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Ej: juan@example.com"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Ej: Av. Principal 123, CABA"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="origin">Origen</Label>
              <Select
                value={formData.origin}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, origin: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="recomendacion">Recomendación</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
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
                placeholder="Notas adicionales sobre el paciente..."
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
                : patient
                ? "Actualizar"
                : "Crear"}
            </Button>
          </DialogFooter>
        </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
