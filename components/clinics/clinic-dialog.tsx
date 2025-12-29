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
import { Clinic } from "@prisma/client";

interface ClinicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinic: Clinic | null;
}

async function createClinic(data: Omit<Clinic, "id" | "createdAt" | "updatedAt">) {
  const response = await fetch("/api/clinics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error creating clinic");
  return response.json();
}

async function updateClinic(
  id: number,
  data: Omit<Clinic, "id" | "createdAt" | "updatedAt">
) {
  const response = await fetch(`/api/clinics/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error updating clinic");
  return response.json();
}

export function ClinicDialog({ open, onOpenChange, clinic }: ClinicDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    if (clinic) {
      setFormData({
        name: clinic.name || "",
        address: clinic.address || "",
        phone: clinic.phone || "",
        email: clinic.email || "",
      });
    } else {
      setFormData({
        name: "",
        address: "",
        phone: "",
        email: "",
      });
    }
  }, [clinic, open]);

  const mutation = useMutation({
    mutationFn: (data: Omit<Clinic, "id" | "createdAt" | "updatedAt">) =>
      clinic
        ? updateClinic(clinic.id, data)
        : createClinic(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinics"] });
      onOpenChange(false);
      setFormData({ name: "", address: "", phone: "", email: "" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {clinic ? "Editar Consultorio" : "Nuevo Consultorio"}
          </DialogTitle>
          <DialogDescription>
            {clinic
              ? "Modifica la información del consultorio"
              : "Agrega un nuevo consultorio a tu clínica"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="Ej: Consultorio Principal"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Ej: Av. Principal 123"
              />
            </div>
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
                placeholder="Ej: info@consultorio.com"
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
                : clinic
                ? "Actualizar"
                : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
