import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Plus, Trash2, Edit2, ArrowRight, Globe, Copy, Check, RefreshCw, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOrg } from "@/context/OrgProvider";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from 'qrcode.react';
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
  primary_domain: z.string().trim().optional(),
  owner_email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
});

type Company = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export function CompanyManagement() {
  const { toast } = useToast();
  const { organizations, setActiveOrg, reloadOrganizations } = useOrg();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<{slug: string; name: string; orgId: string} | null>(null);
  const [currentOwnerEmail, setCurrentOwnerEmail] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [primaryDomain, setPrimaryDomain] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; slug?: string; primary_domain?: string; owner_email?: string }>({});

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, slug, created_at")
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


  const generateInviteLink = (slug: string, token: string): string => {
    const hostname = window.location.hostname;
    const isDev = hostname === 'localhost' || hostname.includes('127.0.0.1');
    
    if (isDev) {
      // Development: use /t/{slug} pattern
      return `${window.location.origin}/t/${slug}/auth/accept-invite?token=${token}`;
    } else {
      // Production: use subdomain
      return `https://${slug}.vesselopsportal.com/auth/accept-invite?token=${token}`;
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setInviteLink(null);
    setShowInviteModal(false);

    // Validate inputs
    const validation = companySchema.safeParse({ 
      name, 
      slug, 
      primary_domain: primaryDomain ? sanitizeDomain(primaryDomain) : undefined,
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

      // 2. Add primary domain if provided
      if (validation.data.primary_domain) {
        const { error: domainError } = await supabase
          .from("organization_domains")
          .insert({
            org_id: newOrg.id,
            domain: validation.data.primary_domain,
            verified_at: new Date().toISOString(),
          });

        if (domainError && domainError.code !== "23505") {
          console.error("Domain insert error:", domainError);
        }
      }

      // 3. Handle owner assignment or invite
      if (validation.data.owner_email) {
        // Generate invitation token
        const inviteToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours
        
        const { error: inviteError } = await supabase
          .from("organization_invites")
          .insert({
            org_id: newOrg.id,
            email: validation.data.owner_email,
            role: "owner",
            token: inviteToken,
            expires_at: expiresAt.toISOString(),
          });

        if (inviteError) {
          console.error("Invite creation error:", inviteError);
        } else {
          // Generate invite link
          const inviteUrl = generateInviteLink(validation.data.slug, inviteToken);
          
          setInviteLink(inviteUrl);
          setCurrentCompany({ 
            slug: validation.data.slug, 
            name: validation.data.name,
            orgId: newOrg.id
          });
          setCurrentOwnerEmail(validation.data.owner_email);
          setShowInviteModal(true);
        }
      }

      toast({
        title: "Success",
        description: `Company "${validation.data.name}" created successfully${validation.data.owner_email ? ' - Invite link generated' : ''}`,
      });

      // Reset form
      setName("");
      setSlug("");
      setPrimaryDomain("");
      setOwnerEmail("");
      setShowForm(false);
      
      // Reload companies and organizations
      await loadCompanies();
      await reloadOrganizations();
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

  const copyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
      toast({
        title: "Copied",
        description: "Invite link copied to clipboard",
      });
    }
  };

  const sanitizeDomain = (domain: string): string => {
    if (!domain) return "";
    // Remove protocol (http://, https://)
    let cleaned = domain.replace(/^https?:\/\//, "");
    // Remove trailing slash
    cleaned = cleaned.replace(/\/$/, "");
    // Remove www. prefix if present
    cleaned = cleaned.replace(/^www\./, "");
    return cleaned.toLowerCase().trim();
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

  const handleRegenerateInvite = async () => {
    if (!currentCompany || !currentOwnerEmail) return;
    
    setRegenerating(true);
    try {
      // Invalidate old invites
      await supabase
        .from("organization_invites")
        .update({ expires_at: new Date().toISOString() })
        .eq('org_id', currentCompany.orgId)
        .eq('email', currentOwnerEmail);

      // Create new invite
      const inviteToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
      
      const { error: inviteError } = await supabase
        .from("organization_invites")
        .insert({
          org_id: currentCompany.orgId,
          email: currentOwnerEmail,
          role: "owner",
          token: inviteToken,
          expires_at: expiresAt.toISOString(),
        });

      if (inviteError) throw inviteError;

      // Generate new link
      const inviteUrl = generateInviteLink(currentCompany.slug, inviteToken);
      setInviteLink(inviteUrl);

      toast({
        title: "Invitation regenerated",
        description: `New invitation link created (previous link invalidated)`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to regenerate invitation",
        variant: "destructive",
      });
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopyInviteForCompany = async (company: Company) => {
    try {
      // Get latest active invite for this company
      const { data: invites, error } = await supabase
        .from("organization_invites")
        .select("*")
        .eq('org_id', company.id)
        .gt('expires_at', new Date().toISOString())
        .is('accepted_at', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!invites || invites.length === 0) {
        toast({
          title: "No active invite",
          description: "Create a new company with owner email to generate an invite",
          variant: "destructive",
        });
        return;
      }

      const invite = invites[0];
      const inviteUrl = generateInviteLink(company.slug, invite.token);
      
      await navigator.clipboard.writeText(inviteUrl);
      toast({
        title: "Copied",
        description: "Invite link copied to clipboard",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to copy invite link",
        variant: "destructive",
      });
    }
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
            {!showForm && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Company
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showForm && (
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

                <div className="space-y-2">
                  <Label htmlFor="primary-domain">Primary Domain</Label>
                  <Input
                    id="primary-domain"
                    value={primaryDomain}
                    onChange={(e) => setPrimaryDomain(e.target.value)}
                    placeholder="acme.com or https://acme.com"
                  />
                  {errors.primary_domain && (
                    <p className="text-sm text-destructive">{errors.primary_domain}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Domain will be auto-verified. Protocol and www are auto-stripped.
                  </p>
                </div>

                <div className="space-y-2">
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
                    Will create invite if user doesn't exist
                  </p>
                </div>
              </div>

              {inviteLink && (
                <div className="p-3 border rounded-lg bg-muted space-y-2">
                  <Label className="text-sm font-medium">Owner Invite Link</Label>
                  <div className="flex gap-2">
                    <Input value={inviteLink} readOnly className="font-mono text-xs" />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={copyInviteLink}
                    >
                      {copiedInvite ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

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
                    setPrimaryDomain("");
                    setOwnerEmail("");
                    setInviteLink(null);
                    setErrors({});
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Invite Modal */}
          {showInviteModal && inviteLink && currentCompany && (
            <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Owner Invitation Link</DialogTitle>
                  <DialogDescription>
                    Share this link with {currentOwnerEmail} to activate their account for {currentCompany.name}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* QR Code */}
                  <div className="flex justify-center p-4 bg-white rounded-lg border">
                    <QRCodeSVG value={inviteLink} size={200} level="H" />
                  </div>

                  {/* Invite Link */}
                  <div className="space-y-2">
                    <Label>Invitation Link</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={inviteLink} 
                        readOnly 
                        className="font-mono text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={copyInviteLink}
                      >
                        {copiedInvite ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Valid for 72 hours • Single use only
                    </p>
                    {inviteLink.includes('/t/') && (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded">
                        <p className="text-xs text-blue-900 dark:text-blue-100">
                          <strong>Development mode:</strong> This link uses /t/{currentCompany.slug} pattern for local testing
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRegenerateInvite}
                      disabled={regenerating}
                      className="flex-1"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
                      {regenerating ? 'Regenerating...' : 'Regenerate'}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowInviteModal(false)}
                      className="flex-1"
                    >
                      Done
                    </Button>
                  </div>
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
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(company.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSwitchToOrg(company)}
                          title="Switch to this organization"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyInviteForCompany(company)}
                          title="Copy invite link"
                        >
                          <Mail className="h-4 w-4" />
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
