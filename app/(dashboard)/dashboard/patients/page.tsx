"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  Merge,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import Link from "next/link";
import { Patient } from "@prisma/client";
import { PatientDialog } from "@/components/patients/patient-dialog";
import { UnifyDuplicatesDialog } from "@/components/patients/unify-duplicates-dialog";

interface PatientsResponse {
  data: Patient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function fetchPatients(
  search?: string,
  page: number = 1,
  limit: number = 50,
  sortBy?: string,
  sortOrder?: "asc" | "desc"
): Promise<PatientsResponse> {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  params.append("page", page.toString());
  params.append("limit", limit.toString());
  if (sortBy) params.append("sortBy", sortBy);
  if (sortOrder) params.append("sortOrder", sortOrder);

  const response = await fetch(`/api/patients?${params.toString()}`);
  if (!response.ok) throw new Error("Error fetching patients");
  return response.json();
}

async function deletePatient(id: number): Promise<void> {
  const response = await fetch(`/api/patients/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Error deleting patient");
}

export default function PatientsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDuplicatesDialogOpen, setIsDuplicatesDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["patients", search, page, sortBy, sortOrder],
    queryFn: () => fetchPatients(search, page, 50, sortBy, sortOrder),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este paciente?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCreate = () => {
    setEditingPatient(null);
    setIsDialogOpen(true);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page when searching
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Si ya está ordenando por esta columna, cambiar el orden
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Si es una nueva columna, ordenar ascendente por defecto
      setSortBy(column);
      setSortOrder("asc");
    }
    setPage(1); // Reset to first page when sorting
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground">
            Gestiona el registro de pacientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsDuplicatesDialogOpen(true)}
          >
            <Merge className="mr-2 h-4 w-4" />
            Unificar Duplicados
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Paciente
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, DNI, email o teléfono..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Pacientes</span>
            {data && (
              <span className="text-sm font-normal text-muted-foreground">
                {data.pagination.total} pacientes totales
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-muted-foreground">Cargando pacientes...</p>
            </div>
          ) : data && data.data.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <button
                          onClick={() => handleSort("firstName")}
                          className="flex items-center hover:text-primary transition-colors"
                        >
                          Nombre
                          {getSortIcon("firstName")}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort("lastName")}
                          className="flex items-center hover:text-primary transition-colors"
                        >
                          Apellido
                          {getSortIcon("lastName")}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort("dni")}
                          className="flex items-center hover:text-primary transition-colors"
                        >
                          DNI
                          {getSortIcon("dni")}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort("phone")}
                          className="flex items-center hover:text-primary transition-colors"
                        >
                          Teléfono
                          {getSortIcon("phone")}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort("email")}
                          className="flex items-center hover:text-primary transition-colors"
                        >
                          Email
                          {getSortIcon("email")}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort("birthDate")}
                          className="flex items-center hover:text-primary transition-colors"
                        >
                          Fecha de Nacimiento
                          {getSortIcon("birthDate")}
                        </button>
                      </TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/dashboard/patients/${patient.id}`}
                            className="hover:text-primary transition-colors"
                          >
                            {patient.firstName}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/dashboard/patients/${patient.id}`}
                            className="hover:text-primary transition-colors"
                          >
                            {patient.lastName}
                          </Link>
                        </TableCell>
                        <TableCell>{patient.dni || "-"}</TableCell>
                        <TableCell>{patient.phone || "-"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {patient.email || "-"}
                        </TableCell>
                        <TableCell>
                          {patient.birthDate
                            ? new Date(patient.birthDate).toLocaleDateString(
                                "es-AR"
                              )
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(patient)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(patient.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando{" "}
                    {(data.pagination.page - 1) * data.pagination.limit + 1} -{" "}
                    {Math.min(
                      data.pagination.page * data.pagination.limit,
                      data.pagination.total
                    )}{" "}
                    de {data.pagination.total} pacientes
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: data.pagination.totalPages },
                        (_, i) => i + 1
                      )
                        .filter((p) => {
                          // Mostrar primera, última, actual y adyacentes
                          return (
                            p === 1 ||
                            p === data.pagination.totalPages ||
                            (p >= page - 1 && p <= page + 1)
                          );
                        })
                        .map((p, idx, arr) => {
                          // Agregar elipsis si hay gap
                          const prev = arr[idx - 1];
                          const showEllipsis = prev && p - prev > 1;
                          return (
                            <div key={p} className="flex items-center gap-1">
                              {showEllipsis && (
                                <span className="px-2 text-muted-foreground">
                                  ...
                                </span>
                              )}
                              <Button
                                variant={page === p ? "default" : "outline"}
                                size="sm"
                                className="w-10"
                                onClick={() => handlePageChange(p)}
                              >
                                {p}
                              </Button>
                            </div>
                          );
                        })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === data.pagination.totalPages}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {search
                  ? "No se encontraron pacientes"
                  : "No hay pacientes registrados"}
              </p>
              {!search && (
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primer Paciente
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <PatientDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        patient={editingPatient}
      />

      <UnifyDuplicatesDialog
        open={isDuplicatesDialogOpen}
        onOpenChange={setIsDuplicatesDialogOpen}
      />
    </div>
  );
}
