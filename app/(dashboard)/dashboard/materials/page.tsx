"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Search,
  AlertTriangle,
  TrendingUp,
  History,
} from "lucide-react";
import { MaterialDialog } from "@/components/materials/material-dialog";
import { StockMovementDialog } from "@/components/materials/stock-movement-dialog";
import { StockMovementsHistory } from "@/components/materials/stock-movements-history";
import { MaterialsImportExport } from "@/components/materials/materials-import-export";

type Material = {
  id: number;
  name: string;
  description: string | null;
  unit: string;
  price: number | null;
  minStock: number;
  currentStock: number;
  targetStock: number;
  category: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

async function fetchMaterials(): Promise<Material[]> {
  const response = await fetch("/api/materials");
  if (!response.ok) throw new Error("Error fetching materials");
  return response.json();
}

async function deleteMaterial(id: number): Promise<void> {
  const response = await fetch(`/api/materials/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Error deleting material");
}

function getStockStatus(material: Material): "critical" | "low" | "ok" {
  const current = Number(material.currentStock);
  const min = Number(material.minStock);
  const target = Number(material.targetStock);

  // 🔴 CRÍTICO: current_stock <= min_stock
  if (current <= min) {
    return "critical";
  }

  // 🟡 BAJO: current_stock > min_stock AND current_stock < target_stock
  // Si target_stock = 0, no mostrar BAJO
  if (target > 0 && current < target) {
    return "low";
  }

  // 🟢 OK: current_stock >= target_stock (o si target = 0)
  return "ok";
}

function getStockStatusBadge(material: Material) {
  const status = getStockStatus(material);
  const tooltips = {
    critical: "Crítico: stock ≤ mínimo",
    low: "Bajo: stock por debajo del objetivo",
    ok: "OK: stock en nivel objetivo o superior",
  };

  const badge = (
    <Badge
      variant={status === "critical" ? "destructive" : "outline"}
      className={
        status === "critical"
          ? "flex items-center gap-1"
          : status === "low"
          ? "border-yellow-500 text-yellow-600"
          : "border-green-500 text-green-600"
      }
    >
      {status === "critical" && <AlertTriangle className="h-3 w-3" />}
      {status === "critical" ? "Crítico" : status === "low" ? "Bajo" : "OK"}
    </Badge>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent>
        <p>{tooltips[status]}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default function MaterialsPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role || "secretary";
  const isAdmin = userRole === "admin";
  const isSecretary = userRole === "secretary";

  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [selectedMaterialForMovement, setSelectedMaterialForMovement] = useState<Material | null>(null);
  const [selectedMaterialForHistory, setSelectedMaterialForHistory] = useState<Material | null>(null);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: materials, isLoading } = useQuery({
    queryKey: ["materials"],
    queryFn: fetchMaterials,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      setIsDeleteDialogOpen(false);
      setMaterialToDelete(null);
    },
  });

  // Filtrar materiales por búsqueda
  const filteredMaterials = useMemo(() => {
    if (!materials) return [];
    if (!searchQuery.trim()) return materials;

    const query = searchQuery.toLowerCase().trim();
    return materials.filter((material) => {
      return (
        material.name.toLowerCase().includes(query) ||
        (material.description && material.description.toLowerCase().includes(query)) ||
        (material.category && material.category.toLowerCase().includes(query)) ||
        (material.price !== null && material.price.toString().includes(query))
      );
    });
  }, [materials, searchQuery]);

  // Contar materiales con stock crítico y bajo
  const criticalStockCount = useMemo(() => {
    if (!materials) return 0;
    return materials.filter((m) => getStockStatus(m) === "critical").length;
  }, [materials]);

  const lowStockCount = useMemo(() => {
    if (!materials) return 0;
    return materials.filter((m) => getStockStatus(m) === "low").length;
  }, [materials]);

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (material: Material) => {
    setMaterialToDelete(material);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (materialToDelete) {
      deleteMutation.mutate(materialToDelete.id);
    }
  };

  const handleCreate = () => {
    setEditingMaterial(null);
    setIsDialogOpen(true);
  };

  const handleAddMovement = (material: Material) => {
    setSelectedMaterialForMovement(material);
    setIsMovementDialogOpen(true);
  };

  const handleViewHistory = (material: Material) => {
    setSelectedMaterialForHistory(material);
    setIsHistoryDialogOpen(true);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Materiales</h1>
            <p className="text-muted-foreground">
              Gestiona el inventario de materiales
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <MaterialsImportExport />
            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Material
            </Button>
          </div>
        </div>

        {/* Alertas de stock */}
        {criticalStockCount > 0 ? (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div className="flex gap-4">
                  <p className="text-sm font-medium">
                    {criticalStockCount}{" "}
                    {criticalStockCount === 1 ? "material" : "materiales"} en
                    estado crítico
                  </p>
                  {lowStockCount > 0 && (
                    <p className="text-sm font-medium text-yellow-600">
                      ({lowStockCount}{" "}
                      {lowStockCount === 1 ? "en bajo" : "en bajo"})
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : lowStockCount > 0 ? (
          <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm font-medium text-yellow-700">
                  {lowStockCount}{" "}
                  {lowStockCount === 1 ? "material" : "materiales"} en estado bajo
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Buscador */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, descripción, categoría o precio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">Cargando...</div>
        ) : filteredMaterials && filteredMaterials.length > 0 ? (
          <Card>
            <Table containerClassName="max-h-[calc(100vh-400px)]">
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow className="border-b bg-background">
                  <TableHead className="bg-background">Nombre</TableHead>
                  <TableHead className="bg-background">Categoría</TableHead>
                  <TableHead className="text-right bg-background">Stock</TableHead>
                  <TableHead className="text-right bg-background">Mínimo</TableHead>
                  <TableHead className="bg-background">Unidad</TableHead>
                  <TableHead className="bg-background">Estado</TableHead>
                  <TableHead className="text-right bg-background">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {filteredMaterials.map((material) => {
                    const status = getStockStatus(material);
                    return (
                      <TableRow key={material.id}>
                        <TableCell className="font-medium">
                          {material.name}
                        </TableCell>
                        <TableCell>
                          {material.category ? (
                            <Badge variant="outline">{material.category}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              status === "critical"
                                ? "font-bold text-destructive"
                                : status === "low"
                                ? "font-semibold text-yellow-600"
                                : "font-semibold"
                            }
                          >
                            {Number(material.currentStock).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {Number(material.minStock).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {material.unit}
                        </TableCell>
                        <TableCell>{getStockStatusBadge(material)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewHistory(material)}
                                >
                                  <History className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Ver historial</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAddMovement(material)}
                                >
                                  <TrendingUp className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Registrar movimiento</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(material)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Editar</p>
                              </TooltipContent>
                            </Tooltip>
                            {isAdmin && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteClick(material)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Eliminar</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "No se encontraron materiales con ese criterio"
                  : "No hay materiales registrados"}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primer Material
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <MaterialDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          material={editingMaterial}
        />

        <StockMovementDialog
          open={isMovementDialogOpen}
          onOpenChange={setIsMovementDialogOpen}
          material={selectedMaterialForMovement}
        />

        <StockMovementsHistory
          open={isHistoryDialogOpen}
          onOpenChange={setIsHistoryDialogOpen}
          material={selectedMaterialForHistory}
        />

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar material?</AlertDialogTitle>
              <AlertDialogDescription>
                Se ocultará del sistema (soft delete). Esta acción puede revertirse más
                adelante.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
