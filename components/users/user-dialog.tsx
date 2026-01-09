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
import { User } from "@prisma/client";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error creating user");
  }
  return response.json();
}

async function updateUser(
  id: number,
  data: {
    name: string;
    email: string;
    password?: string;
    role: string;
  }
) {
  const response = await fetch(`/api/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error updating user");
  }
  return response.json();
}

export function UserDialog({ open, onOpenChange, user }: UserDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "odontologo",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        password: "", // No mostrar password existente
        role: (user.role as string) || "odontologo",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "secretary",
      });
    }
    setError("");
  }, [user, open]);

  const mutation = useMutation({
    mutationFn: (data: {
      name: string;
      email: string;
      password?: string;
      role: string;
    }) =>
      user
        ? updateUser(user.id, data)
        : createUser({
            ...data,
            password: data.password || "",
          } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onOpenChange(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "odontologo",
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

    if (!user && !formData.password) {
      setError("La contraseña es requerida para nuevos usuarios");
      return;
    }

    const data: any = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
    };

    // Solo incluir password si se proporciona (para updates) o es nuevo usuario
    if (formData.password) {
      data.password = formData.password;
    }

    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {user ? "Editar Usuario" : "Nuevo Usuario"}
          </DialogTitle>
          <DialogDescription>
            {user
              ? "Modifica la información del usuario"
              : "Crea un nuevo usuario en el sistema"}
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
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="Ej: Juan Pérez"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                placeholder="Ej: juan@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">
                Contraseña {user ? "(dejar vacío para no cambiar)" : "*"}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required={!user}
                placeholder="••••••••"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Rol *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="odontologo">Odontólogo</SelectItem>
                  <SelectItem value="secretary">Secretaria</SelectItem>
                </SelectContent>
              </Select>
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
                : user
                ? "Actualizar"
                : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
