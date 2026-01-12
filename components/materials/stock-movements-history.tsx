"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { TrendingUp, TrendingDown, Edit } from "lucide-react";

type StockMovement = {
  id: number;
  type: "entrada" | "salida" | "ajuste";
  quantity: number;
  reason: string | null;
  movementDate: Date;
  createdAt: Date;
  user: {
    id: number;
    name: string;
    email: string;
  } | null;
};

type Material = {
  id: number;
  name: string;
  unit: string;
};

interface StockMovementsHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: Material | null;
}

async function fetchStockMovements(materialId: number): Promise<StockMovement[]> {
  const response = await fetch(`/api/materials/${materialId}/movements?limit=100`);
  if (!response.ok) throw new Error("Error fetching stock movements");
  return response.json();
}

function getMovementIcon(type: string) {
  switch (type) {
    case "entrada":
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case "salida":
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    case "ajuste":
      return <Edit className="h-4 w-4 text-blue-500" />;
    default:
      return null;
  }
}

function getMovementLabel(type: string): string {
  switch (type) {
    case "entrada":
      return "Entrada";
    case "salida":
      return "Salida";
    case "ajuste":
      return "Ajuste";
    default:
      return type;
  }
}

function getMovementBadgeVariant(type: string) {
  switch (type) {
    case "entrada":
      return "default";
    case "salida":
      return "destructive";
    case "ajuste":
      return "secondary";
    default:
      return "outline";
  }
}

export function StockMovementsHistory({
  open,
  onOpenChange,
  material,
}: StockMovementsHistoryProps) {
  const { data: movements, isLoading } = useQuery({
    queryKey: ["material-movements", material?.id],
    queryFn: () => (material ? fetchStockMovements(material.id) : []),
    enabled: open && !!material,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Historial de Movimientos</DialogTitle>
          <DialogDescription>
            {material && (
              <>
                Material: <strong>{material.name}</strong>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : movements && movements.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Usuario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="font-mono text-sm">
                      {formatDateTime(movement.movementDate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getMovementBadgeVariant(movement.type)}>
                        <div className="flex items-center gap-1">
                          {getMovementIcon(movement.type)}
                          {getMovementLabel(movement.type)}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {Number(movement.quantity).toLocaleString()} {material?.unit}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {movement.reason || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {movement.user?.name || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay movimientos registrados
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
