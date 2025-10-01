import React from "react";
import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useOrg } from "@/context/OrgProvider";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/context/AuthProvider";

const isMasterUser = (email?: string) =>
  !!email && ['contato@vesselopsportal.com', 'contact@vesselopsportal.com'].includes(email.toLowerCase());

export function OrgSwitcher() {
  const { organizations, activeOrg, setActiveOrg } = useOrg();
  const { isPlatformAdmin } = useUserRole();
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  
  const isMaster = isMasterUser(user?.email);

  const handleSelectOrg = (org: typeof organizations[0]) => {
    setActiveOrg(org);
    setOpen(false);
    // Refresh the current page to reload data for new org
    window.location.reload();
  };

  // Show "All Tenants" button for platformAdmin without org
  if (isPlatformAdmin && !activeOrg) {
    // Master users can open the switcher even without activeOrg
    if (isMaster && organizations.length > 0) {
      return (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[200px] justify-between"
            >
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="truncate">All Tenants</span>
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search organizations..." />
              <CommandEmpty>No organization found.</CommandEmpty>
              <CommandList>
                <CommandGroup>
                  {organizations.map((org) => (
                    <CommandItem
                      key={org.id}
                      value={org.name}
                      onSelect={() => handleSelectOrg(org)}
                    >
                      <Check className="mr-2 h-4 w-4 opacity-0" />
                      <div className="flex flex-col">
                        <span>{org.name}</span>
                        <span className="text-xs text-muted-foreground">{org.role}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      );
    }
    
    return (
      <Button
        variant="outline"
        className="w-[200px] justify-start"
        disabled
      >
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <span className="truncate">All Tenants</span>
        </div>
      </Button>
    );
  }

  // Hide switcher for non-master users with no org or only one org
  if (!isMaster && (!activeOrg || organizations.length === 0)) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="truncate">{activeOrg.name}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search organizations..." />
          <CommandEmpty>No organization found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {organizations.map((org) => (
                <CommandItem
                  key={org.id}
                  value={org.name}
                  onSelect={() => handleSelectOrg(org)}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      activeOrg.id === org.id ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  <div className="flex flex-col">
                    <span>{org.name}</span>
                    <span className="text-xs text-muted-foreground">{org.role}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
