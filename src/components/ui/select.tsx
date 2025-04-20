"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";

const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    children: React.ReactNode;
  }
>(({ className, children, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        className={cn(
          "flex h-10 w-full appearance-none items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon className="absolute right-3 top-3 h-4 w-4 opacity-50" />
    </div>
  );
});
Select.displayName = "Select";

const SelectOption = React.forwardRef<
  HTMLOptionElement,
  React.OptionHTMLAttributes<HTMLOptionElement>
>(({ className, ...props }, ref) => {
  return (
    <option
      className={cn(
        "relative cursor-pointer data-[selected]:bg-accent",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
SelectOption.displayName = "SelectOption";

export { Select, SelectOption };
