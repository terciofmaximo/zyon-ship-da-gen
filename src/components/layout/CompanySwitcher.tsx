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
import { useState } from "react";
import { useCompany } from "@/context/CompanyProvider";
import { cn } from "@/lib/utils";

export function CompanySwitcher() {
  const [open, setOpen] = useState(false);
  const { companies, activeCompanyId, setActiveCompanyId } = useCompany();
  
  const activeCompany = companies.find(company => company.id === activeCompanyId);

  if (companies.length <= 1) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[240px] justify-between bg-background hover:bg-accent hover:text-accent-foreground"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {activeCompany ? activeCompany.name : "Select company..."}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0 bg-background border shadow-lg">
        <Command className="bg-background">
          <CommandInput placeholder="Search companies..." className="border-0" />
          <CommandList>
            <CommandEmpty>No companies found.</CommandEmpty>
            <CommandGroup>
              {companies.map((company) => (
                <CommandItem
                  key={company.id}
                  value={company.name}
                  onSelect={() => {
                    setActiveCompanyId(company.id);
                    setOpen(false);
                  }}
                  className="hover:bg-accent hover:text-accent-foreground cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Building2 className="h-4 w-4 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{company.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {company.role}
                      </div>
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      activeCompanyId === company.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}