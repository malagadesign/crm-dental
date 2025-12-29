"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

interface DuplicateGroup {
  group: Array<{
    id: number;
    firstName: string;
    lastName: string;
    fullName: string;
    dni?: string | null;
    phone?: string | null;
    email?: string | null;
    appointmentsCount: number;
    medicalRecordsCount: number;
    createdAt: string;
  }>;
  mainPatientId: number;
}

interface DuplicatesResponse {
  duplicates: DuplicateGroup[];
  totalGroups: number;
}

async function fetchDuplicates(similarity: number = 80): Promise<DuplicatesResponse> {
  const response = await fetch(`/api/patients/unify-duplicates?similarity=${similarity}`);
  if (!response.ok) throw new Error("Error fetching duplicates");
  return response.json();
}

async function unifyDuplicates(groupIds: number[], mainPatientId: number) {
  const response = await fetch("/api/patients/unify-duplicates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ groupIds, mainPatientId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error unifying duplicates");
  }
  return response.json();
}

interface UnifyDuplicatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UnifyDuplicatesDialog({
  open,
  onOpenChange,
}: UnifyDuplicatesDialogProps) {
  const queryClient = useQueryClient();
  const [similarity, setSimilarity] = useState(80);
  const [selectedGroups, setSelectedGroups] = useState<Set<number>>(new Set());

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["duplicates", similarity],
    queryFn: () => fetchDuplicates(similarity),
    enabled: open,
  });

  const unifyMutation = useMutation({
    mutationFn: ({ groupIds, mainPatientId }: { groupIds: number[]; mainPatientId: number }) =>
      unifyDuplicates(groupIds, mainPatientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["duplicates"] });
      setSelectedGroups(new Set());
      refetch();
    },
  });

  const handleUnifyGroup = (group: DuplicateGroup) => {
    const groupIds = group.group.map((p) => p.id);
    unifyMutation.mutate({
      groupIds,
      mainPatientId: group.mainPatientId,
    });
  };

  const handleUnifySelected = () => {
    if (selectedGroups.size === 0) return;

    data?.duplicates.forEach((group) => {
      if (selectedGroups.has(group.group[0].id)) {
        handleUnifyGroup(group);
      }
    });
  };

  const toggleGroupSelection = (groupId: number) => {
    const newSelected = new Set(selectedGroups);
    if (newSelected.has(groupId)) {
      newSelected.delete(groupId);
    } else {
      newSelected.add(groupId);
    }
    setSelectedGroups(newSelected);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Unificar Pacientes Duplicados
          </DialogTitle>
          <DialogDescription>
            Detecta y unifica pacientes que pueden ser duplicados basándose en
            nombre, DNI, teléfono o email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">
              Umbral de similitud: {similarity}%
            </label>
            <input
              type="range"
              min="70"
              max="100"
              value={similarity}
              onChange={(e) => setSimilarity(Number(e.target.value))}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              Buscar
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : data && data.duplicates.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Se encontraron {data.totalGroups} grupos de duplicados
                </p>
                {selectedGroups.size > 0 && (
                  <Button
                    onClick={handleUnifySelected}
                    disabled={unifyMutation.isPending}
                  >
                    Unificar Seleccionados ({selectedGroups.size})
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {data.duplicates.map((group, index) => {
                  const main = group.group.find((p) => p.id === group.mainPatientId);
                  const duplicates = group.group.filter(
                    (p) => p.id !== group.mainPatientId
                  );
                  const isSelected = selectedGroups.has(group.group[0].id);

                  return (
                    <Card
                      key={index}
                      className={`border-l-4 ${
                        isSelected
                          ? "border-l-primary bg-primary/5"
                          : "border-l-orange-500"
                      }`}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() =>
                                toggleGroupSelection(group.group[0].id)
                              }
                              className="mt-1"
                            />
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            <span className="font-semibold">
                              Grupo {index + 1} - {group.group.length} pacientes
                            </span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleUnifyGroup(group)}
                            disabled={unifyMutation.isPending}
                          >
                            Unificar Grupo
                          </Button>
                        </div>

                        <div className="space-y-3">
                          {/* Paciente principal */}
                          {main && (
                            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                <span className="font-semibold text-primary">
                                  Principal: {main.fullName}
                                </span>
                                <Badge variant="secondary" className="ml-auto">
                                  ID: {main.id}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                                {main.dni && (
                                  <div>
                                    <span className="font-medium">DNI:</span> {main.dni}
                                  </div>
                                )}
                                {main.phone && (
                                  <div>
                                    <span className="font-medium">Tel:</span> {main.phone}
                                  </div>
                                )}
                                {main.email && (
                                  <div>
                                    <span className="font-medium">Email:</span>{" "}
                                    {main.email}
                                  </div>
                                )}
                                <div>
                                  <span className="font-medium">Turnos:</span>{" "}
                                  {main.appointmentsCount}
                                </div>
                                <div>
                                  <span className="font-medium">Registros:</span>{" "}
                                  {main.medicalRecordsCount}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Duplicados */}
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                              Duplicados a unificar:
                            </p>
                            {duplicates.map((dup) => (
                              <div
                                key={dup.id}
                                className="p-3 rounded-lg bg-muted/50 border"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium">{dup.fullName}</span>
                                  <Badge variant="outline" className="ml-auto">
                                    ID: {dup.id}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                                  {dup.dni && (
                                    <div>
                                      <span className="font-medium">DNI:</span> {dup.dni}
                                    </div>
                                  )}
                                  {dup.phone && (
                                    <div>
                                      <span className="font-medium">Tel:</span> {dup.phone}
                                    </div>
                                  )}
                                  {dup.email && (
                                    <div>
                                      <span className="font-medium">Email:</span>{" "}
                                      {dup.email}
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-medium">Turnos:</span>{" "}
                                    {dup.appointmentsCount}
                                  </div>
                                  <div>
                                    <span className="font-medium">Registros:</span>{" "}
                                    {dup.medicalRecordsCount}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-muted-foreground">
                  No se encontraron pacientes duplicados
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

