"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
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
import { TrendingUp, TrendingDown, Edit } from "lucide-react";

type Material = {
  id: number;
  name: string;
  description: string | null;
  unit: string;
  price: number | null;
  minStock: number;
  currentStock: number;
  category: string | null;
  active: boolean;
};

interface StockMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: Material | null;
}

async function createStockMovement(materialId: number, data: any) {
  const response = await fetch(`/api/materials/${materialId}/movements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    let errorMessage = "Error al registrar el movimiento";
    try {
      const error = await response.json();
      if (error.error) {
        errorMessage = error.error;
        // Si hay detalles de validación Zod, agregarlos al mensaje
        if (error.details && Array.isArray(error.details)) {
          const firstError = error.details[0];
          if (firstError?.message) {
            errorMessage = firstError.message;
          }
        }
      }
    } catch (e) {
      // Si no se puede parsear, usar el mensaje por defecto
    }
    throw new Error(errorMessage);
  }
  
  return response.json();
}

export function StockMovementDialog({
  open,
  onOpenChange,
  material,
}: StockMovementDialogProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const userRole = session?.user?.role || "secretary";
  const canAdjust = userRole !== "secretary";
  
  const [formData, setFormData] = useState({
    type: "entrada" as "entrada" | "salida" | "ajuste",
    quantity: "",
    reason: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setFormData({
        type: "entrada",
        quantity: "",
        reason: "",
      });
      setError("");
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (!material) throw new Error("Material no seleccionado");
      return createStockMovement(material.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      queryClient.invalidateQueries({ queryKey: ["material-movements"] });
      onOpenChange(false);
      setError("");
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const quantity = parseFloat(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      setError("La cantidad debe ser un número positivo");
      return;
    }

    // Validar que reason es obligatorio para ajuste
    if (formData.type === "ajuste" && (!formData.reason || formData.reason.trim().length === 0)) {
      setError("El motivo es obligatorio para ajustes");
      return;
    }

    const data = {
      type: formData.type,
      quantity: quantity,
      reason: formData.reason?.trim() || null,
    };

    mutation.mutate(data);
  };

  const getMovementIcon = () => {
    switch (formData.type) {
      case "entrada":
        return <TrendingUp className="h-4 w-4" />;
      case "salida":
        return <TrendingDown className="h-4 w-4" />;
      case "ajuste":
        return <Edit className="h-4 w-4" />;
    }
  };

  const getMovementLabel = () => {
    switch (formData.type) {
      case "entrada":
        return "Entrada";
      case "salida":
        return "Salida";
      case "ajuste":
        return "Ajuste";
    }
  };

  const calculateNewStock = () => {
    if (!material || !formData.quantity) return null;
    
    const quantity = parseFloat(formData.quantity);
    if (isNaN(quantity)) return null;

    const current = Number(material.currentStock);
    let newStock = current;

    if (formData.type === "entrada") {
      newStock = current + quantity;
    } else if (formData.type === "salida") {
      newStock = current - quantity;
    } else if (formData.type === "ajuste") {
      newStock = quantity;
    }

    return newStock;
  };

  const newStock = calculateNewStock();
  const isStockNegative = newStock !== null && newStock < 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Movimiento de Stock</DialogTitle>
          <DialogDescription>
            {material && (
              <>
                Material: <strong>{material.name}</strong>
                <br />
                Stock actual: <strong>{Number(material.currentStock).toLocaleString()} {material.unit}</strong>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            {isStockNegative && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                ⚠️ La cantidad resultante sería negativa. Verifica el stock disponible.
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="type">Tipo de Movimiento *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "entrada" | "salida" | "ajuste") =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Entrada (Agregar stock)
                    </div>
                  </SelectItem>
                  <SelectItem value="salida">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      Salida (Quitar stock)
                    </div>
                  </SelectItem>
                  {canAdjust && (
                    <SelectItem value="ajuste">
                      <div className="flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        Ajuste (Corregir stock)
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quantity">
                Cantidad ({material?.unit}) *
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                required
                placeholder="0.00"
              />
              {newStock !== null && (
                <p className="text-xs text-muted-foreground">
                  Stock después del movimiento:{" "}
                  <strong
                    className={
                      newStock <= Number(material?.minStock || 0)
                        ? "text-destructive"
                        : ""
                    }
                  >
                    {newStock.toLocaleString()} {material?.unit}
                  </strong>
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason">
                Motivo / Nota {formData.type === "ajuste" && "*"}
              </Label>
              <textarea
                id="reason"
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                required={formData.type === "ajuste"}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Ej: Compra realizada, Uso en tratamiento, Corrección de inventario..."
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
            <Button
              type="submit"
              disabled={mutation.isPending || isStockNegative}
            >
              {getMovementIcon()}
              <span className="ml-2">
                {mutation.isPending
                  ? "Registrando..."
                  : `Registrar ${getMovementLabel()}`}
              </span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
