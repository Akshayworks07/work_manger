"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Search, Users, ArrowRight, Building2, Mail, Calendar } from "lucide-react";
import { fetchClients, createClientRecord } from "@/lib/data-store";
import { Client } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";

import { useApp } from "@/lib/providers";
import { ShieldAlert } from "lucide-react";

const clientSchema = z.object({
  name: z.string().min(2, "Client name must be at least 2 characters"),
  contact_email: z.string().email("Please enter a valid email address").or(z.literal("")),
  logo_url: z.string().url("Please enter a valid URL").or(z.literal("")),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export default function ClientsPage() {
  const { profile } = useApp();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const isAdmin = profile?.role === "admin";

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
    enabled: isAdmin,
  });

  if (profile && !isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-md">
          Client directory management is restricted to Administrators. Team-mates can access projects and deliverables assigned to them directly from their dashboard.
        </p>
        <Link href="/" className="mt-6">
          <Button variant="outline">Return to My Dashboard</Button>
        </Link>
      </div>
    );
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      contact_email: "",
      logo_url: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: ClientFormValues) =>
      createClientRecord({
        name: values.name,
        contact_email: values.contact_email || null,
        logo_url: values.logo_url || null,
        owner_id: null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setIsCreateOpen(false);
      reset();
    },
  });

  const onSubmit = (values: ClientFormValues) => {
    createMutation.mutate(values);
  };

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.contact_email && c.contact_email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Client Directory
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage brands, client contacts, and assigned video project suites.
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add New Client
        </Button>
      </div>

      {/* Search & Stats Filter */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by client or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="text-xs text-slate-400">
          Showing <span className="font-semibold text-white">{filteredClients.length}</span> client{filteredClients.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Clients Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800"
            />
          ))}
        </div>
      ) : filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-sm transition-all hover:border-purple-500/40 hover:bg-slate-900/90"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    {client.logo_url ? (
                      <img
                        src={client.logo_url}
                        alt={client.name}
                        className="h-12 w-12 rounded-xl object-cover border border-slate-700"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 font-bold text-base">
                        {client.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors text-base">
                        {client.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                        <Mail className="h-3 w-3 text-slate-500" />
                        <span>{client.contact_email || "No contact email"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-1.5 text-xs text-slate-400 pt-4 border-t border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="h-3 w-3" /> Client since
                    </span>
                    <span>{formatDate(client.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3">
                <Link href={`/clients/${client.id}`}>
                  <Button
                    variant="outline"
                    className="w-full justify-between group-hover:border-purple-500/50 group-hover:text-purple-200"
                  >
                    <span>View Projects</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 p-12 text-center">
          <Users className="h-10 w-10 text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-300">
            No clients found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            {search
              ? "No clients match your search query. Try adjusting your keyword."
              : "Get started by registering your first client company."}
          </p>
          <Button
            onClick={() => setIsCreateOpen(true)}
            size="sm"
            className="mt-4 gap-2"
          >
            <Plus className="h-4 w-4" /> Add Client
          </Button>
        </div>
      )}

      {/* Create Client Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent onClose={() => setIsCreateOpen(false)}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <p className="text-xs text-slate-400 mt-1">
                Register a new company or client to track deliverables for.
              </p>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="client-name">Company / Client Name *</Label>
                <Input
                  id="client-name"
                  placeholder="e.g. Acme Media Labs"
                  {...register("name")}
                  className="mt-1.5"
                />
                {errors.name && (
                  <p className="text-xs text-rose-400 mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="client-email">Primary Contact Email</Label>
                <Input
                  id="client-email"
                  type="email"
                  placeholder="contact@acme.com"
                  {...register("contact_email")}
                  className="mt-1.5"
                />
                {errors.contact_email && (
                  <p className="text-xs text-rose-400 mt-1">
                    {errors.contact_email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="client-logo">Brand Logo URL (Optional)</Label>
                <Input
                  id="client-logo"
                  placeholder="https://... (PNG/JPG image link)"
                  {...register("logo_url")}
                  className="mt-1.5"
                />
                {errors.logo_url && (
                  <p className="text-xs text-rose-400 mt-1">
                    {errors.logo_url.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Save Client
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
