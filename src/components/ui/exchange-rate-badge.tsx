import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, User } from "lucide-react";

interface ExchangeRateBadgeProps {
  source?: "BCB_PTAX_D1" | "MANUAL" | "PROVIDER_X";
  timestamp?: string;
  className?: string;
}

export function ExchangeRateBadge({ source = "MANUAL", timestamp, className }: ExchangeRateBadgeProps) {
  const getSourceInfo = () => {
    switch (source) {
      case "BCB_PTAX_D1":
        return {
          label: "Fonte: BCB PTAX (D-1)",
          icon: Clock,
          tooltip: "Taxa PTAX de venda do Banco Central do Brasil, dia útil anterior",
          variant: "secondary" as const
        };
      case "PROVIDER_X":
        return {
          label: "Fonte: Provider X",
          icon: Clock,
          tooltip: "Taxa obtida de provedor externo",
          variant: "secondary" as const
        };
      default:
        return {
          label: "Fonte: Manual",
          icon: User,
          tooltip: "Taxa inserida manualmente pelo usuário",
          variant: "outline" as const
        };
    }
  };

  const sourceInfo = getSourceInfo();
  const Icon = sourceInfo.icon;

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
        timeZoneName: "short"
      });
    } catch {
      return "Data inválida";
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={sourceInfo.variant} className={className}>
            <Icon className="w-3 h-3 mr-1" />
            {sourceInfo.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p>{sourceInfo.tooltip}</p>
            {timestamp && source !== "MANUAL" && (
              <p className="text-xs text-muted-foreground">
                Atualizado: {formatTimestamp(timestamp)}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}