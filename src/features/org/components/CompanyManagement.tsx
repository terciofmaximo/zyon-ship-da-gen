import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Plus, Trash2, Edit2, ArrowRight, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOrg } from "@/context/OrgProvider";
import { useCompany } from "@/context/CompanyProvider";
import { usePermissions } from "@/hooks/usePermissions";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const companySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  slug: z.string()
    .trim()
    .min(1, "Slug is required")
    .max(50, "Slug must be less than 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .regex(/^[a-z0-9]/, "Slug must start with a letter or number")
    .regex(/[a-z0-9]$/, "Slug must end with a letter or number"),
  owner_email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
});

type Company = {
  id: string;
  name: string;
  slug: string;
  primary_domain?: string;
  created_at: string;
};

export function CompanyManagement() {
  const { toast } = useToast();
  const { organizations, setActiveOrg, reloadOrganizations } = useOrg();
  const { refetch: refetchCompanies } = useCompany();
  const { isPlatformAdmin, requirePermission } = usePermissions();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [showInviteSuccessModal, setShowInviteSuccessModal] = useState(false);
  const [currentCompanyName, setCurrentCompanyName] = useState<string>("");
  const [currentOwnerEmail, setCurrentOwnerEmail] = useState<string>("");
  
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; slug?: string; owner_email?: string }>({});

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, slug, primary_domain, created_at")
        .order("name");

      if (error) throw error;
      setCompanies(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load companies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendOrganizationInvite = async (email: string, orgId: string, orgName: string, orgSlug: string, role: string, primaryDomain?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-organization-invite', {
        body: {
          email,
          org_id: orgId,
          org_name: orgName,
          org_slug: orgSlug,
          role,
          primary_domain: primaryDomain,
        },
      });

      if (error) throw error;
      
      return { success: true, data };
    } catch (error: any) {
      console.error('Error sending invite:', error);
      return { success: false, error: error.message };
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check platform admin permission
    if (!isPlatformAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only platform administrators can create companies",
        variant: "destructive",
      });
      return;
    }

    setErrors({});

    // Validate inputs
    const validation = companySchema.safeParse({ 
      name, 
      slug, 
      owner_email: ownerEmail || undefined 
    });
    
    if (!validation.success) {
      const fieldErrors: any = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setCreating(true);
    try {
      // 1. Create organization
      const { data: newOrg, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: validation.data.name,
          slug: validation.data.slug,
        })
        .select()
        .single();

      if (orgError) {
        if (orgError.code === "23505") {
          toast({
            title: "Error",
            description: "A company with this slug already exists",
            variant: "destructive",
          });
        } else {
          throw orgError;
        }
        return;
      }

      // 2. Handle owner invitation if email provided
      if (validation.data.owner_email) {
        const inviteResult = await sendOrganizationInvite(
          validation.data.owner_email,
          newOrg.id,
          validation.data.name,
          validation.data.slug,
          'owner',
          newOrg.primary_domain
        );

        if (inviteResult.success) {
          setCurrentCompanyName(validation.data.name);
          setCurrentOwnerEmail(validation.data.owner_email);
          setShowInviteSuccessModal(true);
        } else {
          toast({
            title: "Warning",
            description: `Company created but failed to send invite: ${inviteResult.error}`,
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Success",
        description: `Company "${validation.data.name}" created successfully${validation.data.owner_email ? ' and invite sent' : ''}`,
      });

      // Reset form
      setName("");
      setSlug("");
      setOwnerEmail("");
      setShowForm(false);
      
      // Reload companies and organizations
      await loadCompanies();
      await reloadOrganizations();
      await refetchCompanies(); // This will refresh the company switcher
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCompany = async (id: string, name: string) => {
    if (!isPlatformAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only platform administrators can delete companies",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("organizations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Company "${name}" deleted successfully`,
      });

      loadCompanies();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditCompany = async (company: Company, newName: string, newSlug: string) => {
    if (!isPlatformAdmin) {
      toast({
        title: "Permission Denied", 
        description: "Only platform administrators can edit companies",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("organizations")
        .update({ name: newName, slug: newSlug })
        .eq("id", company.id);

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Error",
            description: "A company with this slug already exists",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Success",
        description: `Company updated successfully`,
      });

      setEditingCompany(null);
      loadCompanies();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSwitchToOrg = async (company: Company) => {
    // Find the org in organizations list
    const org = organizations.find(o => o.id === company.id);
    if (org) {
      setActiveOrg(org);
      navigate("/");
      toast({
        title: "Switched",
        description: `Now viewing ${company.name}`,
      });
    } else {
      toast({
        title: "Error",
        description: "Organization not found in your list",
        variant: "destructive",
      });
    }
  };

  const generateSlugFromName = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Companies / Tenants
              </CardTitle>
              <CardDescription>
                Create and manage tenant organizations
              </CardDescription>
            </div>
            {!showForm && isPlatformAdmin && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Company
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showForm && isPlatformAdmin && (
            <form onSubmit={handleCreateCompany} className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/50">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name *</Label>
                  <Input
                    id="company-name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!slug) {
                        setSlug(generateSlugFromName(e.target.value));
                      }
                    }}
                    placeholder="Acme Corporation"
                    maxLength={100}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-slug">Slug *</Label>
                  <Input
                    id="company-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase())}
                    placeholder="acme-corporation"
                    maxLength={50}
                  />
                  {errors.slug && (
                    <p className="text-sm text-destructive">{errors.slug}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Lowercase, numbers, hyphens. Unique.
                  </p>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="owner-email">Owner Email</Label>
                  <Input
                    id="owner-email"
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="owner@acme.com"
                  />
                  {errors.owner_email && (
                    <p className="text-sm text-destructive">{errors.owner_email}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    An invitation email will be sent by Supabase
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create Company"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setName("");
                    setSlug("");
                    setOwnerEmail("");
                    setErrors({});
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Success Modal */}
          {showInviteSuccessModal && (
            <Dialog open={showInviteSuccessModal} onOpenChange={setShowInviteSuccessModal}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>✅ Invitation Sent!</DialogTitle>
                  <DialogDescription>
                    An invitation email has been sent to {currentOwnerEmail} for {currentCompanyName}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-900 dark:text-green-100">
                      The owner will receive an email from Supabase with instructions to set their password and access the platform.
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setShowInviteSuccessModal(false)}
                    className="w-full"
                  >
                    Done
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <div className="mb-4">
            <Input
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Loading companies...
            </p>
          ) : filteredCompanies.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {searchQuery ? "No companies match your search." : "No companies found. Create your first company to get started."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Primary Domain</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {company.slug}
                      </code>
                    </TableCell>
                    <TableCell>
                      {company.primary_domain ? (
                        <a 
                          href={`https://${company.primary_domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Globe className="h-3 w-3" />
                          {company.primary_domain}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">Auto-generated</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(company.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {isPlatformAdmin && (
                        <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSwitchToOrg(company)}
                          title="Switch to this organization"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" title="Edit company">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Company</DialogTitle>
                              <DialogDescription>
                                Update the company name or slug
                              </DialogDescription>
                            </DialogHeader>
                            <EditCompanyForm
                              company={company}
                              onSave={handleEditCompany}
                            />
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" title="Delete company">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Company</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{company.name}"?
                                This will also delete all associated data including members, PDAs, and FDAs.
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCompany(company.id, company.name)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Edit Company Form Component
function EditCompanyForm({ 
  company, 
  onSave 
}: { 
  company: Company; 
  onSave: (company: Company, name: string, slug: string) => void;
}) {
  const [name, setName] = useState(company.name);
  const [slug, setSlug] = useState(company.slug);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(company, name, slug);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-name">Company Name</Label>
        <Input
          id="edit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-slug">Slug</Label>
        <Input
          id="edit-slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          maxLength={50}
          required
        />
      </div>
      <Button type="submit">Save Changes</Button>
    </form>
  );
}
