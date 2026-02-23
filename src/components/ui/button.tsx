import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md border font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "border-stone-700 bg-stone-800 text-stone-100 hover:bg-stone-900",
        variant === "secondary" && "border-stone-600 bg-stone-700 text-stone-100 hover:bg-stone-600",
        variant === "ghost" && "border-transparent bg-transparent text-stone-700 hover:bg-stone-100",
        variant === "danger" && "border-red-700 bg-red-700 text-white hover:bg-red-800",
        size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
        className,
      )}
      {...props}
    />
  );
}
