import { Toaster as Sonner } from "sonner";
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-right"
      richColors
      expand={false}
      icons={{
        success: <CheckCircle2 className="size-5 text-emerald-500 animate-pulse" />,
        info: <Info className="size-5 text-blue-500" />,
        warning: <AlertTriangle className="size-5 text-amber-500" />,
        error: <AlertCircle className="size-5 text-rose-500" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background/95 group-[.toaster]:backdrop-blur-md group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl group-[.toaster]:p-3.5 group-[.toaster]:gap-3 transition-all duration-300 font-sans",
          description: "group-[.toast]:text-muted-foreground text-xs",
          actionButton: "group-[.toast]:bg-emerald-600 group-[.toast]:text-white font-medium text-xs rounded-lg px-3 py-1.5",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground text-xs rounded-lg px-3 py-1.5",
          success: "!border-emerald-500/40 !bg-emerald-500/10 dark:!bg-emerald-950/40 !text-emerald-900 dark:!text-emerald-100 shadow-emerald-500/10",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
