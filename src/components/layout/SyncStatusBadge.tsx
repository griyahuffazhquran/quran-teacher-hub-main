import { RefreshCw, CheckCircle2, AlertCircle, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAutoSync } from "@/hooks/use-auto-sync";
import { cn } from "@/lib/utils";

export function SyncStatusBadge() {
  useAutoSync();
  return null;
}
