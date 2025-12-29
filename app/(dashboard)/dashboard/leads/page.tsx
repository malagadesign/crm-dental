"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Plus, Pencil, Trash2 } from "lucide-react";
import { LeadDialog } from "@/components/leads/lead-dialog";
import { LeadWithRelations } from "@/types";

async function fetchLeads(): Promise<LeadWithRelations[]> {
  const response = await fetch("/api/leads");
  if (!response.ok) throw new Error("Error fetching leads");
  return response.json();
}

async function deleteLead(id: number): Promise<void> {
  const response = await fetch(`/api/leads/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Error deleting lead");
}

const statusColors = {
  nuevo: "bg-blue-100 text-blue-800",
  contactado: "bg-yellow-100 text-yellow-800",
  convertido: "bg-green-100 text-green-800",
  descartado: "bg-gray-100 text-gray-800",
};

export default function LeadsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadWithRelations | null>(null);

  const { data: leads, isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: fetchLeads,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const handleEdit = (lead: LeadWithRelations) => {
    setEditingLead(lead);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este lead?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCreate = () => {
    setEditingLead(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">
            Gestiona los leads captados desde diferentes fuentes
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Lead
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Cargando...</div>
      ) : leads && leads.length > 0 ? (
        <div className="grid gap-4">
          {leads.map((lead) => (
            <Card key={lead.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <UserPlus className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="text-lg font-semibold">
                          {lead.firstName || ""} {lead.lastName || ""}
                          {!lead.firstName && !lead.lastName && "Lead sin nombre"}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {lead.phone && <span>📞 {lead.phone}</span>}
                          {lead.email && <span>✉️ {lead.email}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                      <div>
                        <span className="font-medium">Origen:</span> {lead.origin}
                      </div>
                      <div>
                        <span className="font-medium">Estado:</span>{" "}
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            statusColors[lead.status]
                          }`}
                        >
                          {lead.status}
                        </span>
                      </div>
                      {lead.patient && (
                        <div>
                          <span className="font-medium">Convertido a:</span>{" "}
                          {lead.patient.firstName} {lead.patient.lastName}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Fecha:</span>{" "}
                        {new Date(lead.createdAt).toLocaleDateString("es-AR")}
                      </div>
                    </div>
                    {lead.message && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {lead.message}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(lead)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(lead.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No hay leads registrados</p>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Primer Lead
            </Button>
          </CardContent>
        </Card>
      )}

      <LeadDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        lead={editingLead}
      />
    </div>
  );
}
