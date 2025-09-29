import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOrg } from "@/context/OrgProvider";
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

interface Domain {
  id: string;
  domain: string;
  verified_at: string | null;
  created_at: string;
}

export function DomainManagement() {
  const { activeOrg } = useOrg();
  const { toast } = useToast();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (activeOrg) {
      fetchDomains();
    }
  }, [activeOrg]);

  const fetchDomains = async () => {
    if (!activeOrg) return;

    try {
      const { data, error } = await supabase
        .from("organization_domains")
        .select("*")
        .eq("org_id", activeOrg.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDomains(data || []);
    } catch (error) {
      console.error("Error fetching domains:", error);
      toast({
        title: "Error",
        description: "Failed to load domains",
        variant: "destructive",
      });
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg || !newDomain.trim()) return;

    setLoading(true);
    try {
      // Basic domain validation
      const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-_.]+[a-zA-Z0-9]$/;
      const cleanDomain = newDomain.trim().toLowerCase();

      if (!domainPattern.test(cleanDomain)) {
        toast({
          title: "Invalid domain",
          description: "Please enter a valid domain (e.g., company.com)",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("organization_domains")
        .insert({
          org_id: activeOrg.id,
          domain: cleanDomain,
          verified_at: new Date().toISOString(), // Auto-verify for now
        });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Domain already exists",
            description: "This domain is already registered to an organization",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Domain added",
        description: `Users with @${cleanDomain} emails will now auto-join this organization`,
      });

      setNewDomain("");
      fetchDomains();
    } catch (error) {
      console.error("Error adding domain:", error);
      toast({
        title: "Error",
        description: "Failed to add domain",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDomain = async (id: string) => {
    try {
      const { error } = await supabase
        .from("organization_domains")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Domain removed",
        description: "The domain has been removed from your organization",
      });

      fetchDomains();
    } catch (error) {
      console.error("Error deleting domain:", error);
      toast({
        title: "Error",
        description: "Failed to remove domain",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Email Domains</CardTitle>
          <CardDescription>
            Users with these email domains will automatically join your organization when they sign up
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAddDomain} className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="domain" className="sr-only">
                Domain
              </Label>
              <Input
                id="domain"
                type="text"
                placeholder="e.g., company.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading}>
              <Plus className="w-4 h-4 mr-2" />
              Add Domain
            </Button>
          </form>

          <div className="space-y-2">
            {domains.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No domains configured yet
              </p>
            ) : (
              domains.map((domain) => (
                <div
                  key={domain.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm">{domain.domain}</span>
                    {domain.verified_at && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(domain.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove domain?</AlertDialogTitle>
            <AlertDialogDescription>
              Users with this email domain will no longer automatically join your organization.
              Existing members will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDeleteDomain(deleteId)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
