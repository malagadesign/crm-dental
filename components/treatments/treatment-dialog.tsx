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
import { Treatment } from "@prisma/client";

interface TreatmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treatment: Treatment | null;
}

async function createTreatment(
  data: Omit<Treatment, "id" | "createdAt" | "updatedAt">
) {
  const response = await fetch("/api/treatments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error creating treatment");
  return response.json();
}

async function updateTreatment(
  id: number,
  data: Omit<Treatment, "id" | "createdAt" | "updatedAt">
) {
  const response = await fetch(`/api/treatments/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error updating treatment");
  return response.json();
}

export function TreatmentDialog({
  open,
  onOpenChange,
  treatment,
}: TreatmentDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    durationMinutes: "30",
    active: true,
  });

  useEffect(() => {
    if (treatment) {
      setFormData({
        name: treatment.name || "",
        description: treatment.description || "",
        price: treatment.price.toString(),
        durationMinutes: treatment.durationMinutes.toString(),
        active: treatment.active,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        price: "",
        durationMinutes: "30",
        active: true,
      });
    }
  }, [treatment, open]);

  const mutation = useMutation({
    mutationFn: (data: Omit<Treatment, "id" | "createdAt" | "updatedAt">) =>
      treatment
        ? updateTreatment(treatment.id, data)
        : createTreatment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatments"] });
      onOpenChange(false);
      setFormData({
        name: "",
        description: "",
        price: "",
        durationMinutes: "30",
        active: true,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      durationMinutes: parseInt(formData.durationMinutes),
      active: formData.active,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {treatment ? "Editar Tratamiento" : "Nuevo Tratamiento"}
          </DialogTitle>
          <DialogDescription>
            {treatment
              ? "Modifica la información del tratamiento"
              : "Agrega un nuevo tratamiento al catálogo"}
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
                placeholder="Ej: Limpieza Dental"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Descripción del tratamiento..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Precio *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="durationMinutes">Duración (min) *</Label>
                <Input
                  id="durationMinutes"
                  type="number"
                  min="1"
                  value={formData.durationMinutes}
                  onChange={(e) =>
                    setFormData({ ...formData, durationMinutes: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) =>
                  setFormData({ ...formData, active: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="active" className="cursor-pointer">
                Tratamiento activo
              </Label>
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
                : treatment
                ? "Actualizar"
                : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
