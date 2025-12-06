import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 pointer-events-auto", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-semibold text-white tracking-wider",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-[rgba(10,15,25,0.5)] border-[hsl(210_80%_55%/0.5)] p-0 hover:bg-[hsl(210_80%_55%/0.2)] hover:border-[hsl(200_100%_70%)] hover:text-white transition-all duration-200",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-[hsl(220_60%_75%)] rounded-md w-9 font-semibold text-[0.7rem] uppercase tracking-wider",
        row: "flex w-full mt-2",
        cell: cn(
          "h-9 w-9 text-center text-sm p-0 relative",
          "[&:has([aria-selected].day-range-end)]:rounded-r-md",
          "[&:has([aria-selected].day-outside)]:bg-[hsl(200_100%_60%/0.3)]",
          "[&:has([aria-selected])]:bg-[hsl(200_100%_60%/0.15)]",
          "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
          "focus-within:relative focus-within:z-20",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal text-white hover:bg-[hsl(210_80%_55%/0.2)] hover:text-white aria-selected:opacity-100 transition-all duration-150",
        ),
        day_range_end: "day-range-end",
        day_selected: cn(
          "bg-[hsl(200_100%_60%)] text-[hsl(210_100%_5%)] font-semibold",
          "hover:bg-[hsl(200_100%_65%)] hover:text-[hsl(210_100%_5%)]",
          "focus:bg-[hsl(200_100%_60%)] focus:text-[hsl(210_100%_5%)]",
          "shadow-[0_0_12px_hsl(200_100%_60%/0.5)]",
        ),
        day_today: "bg-[hsl(210_80%_55%/0.3)] text-white font-semibold border border-[hsl(200_100%_70%/0.5)]",
        day_outside: cn(
          "day-outside text-[hsl(215_40%_45%)] opacity-60",
          "aria-selected:bg-[hsl(200_100%_60%/0.2)] aria-selected:text-[hsl(215_40%_60%)] aria-selected:opacity-40",
        ),
        day_disabled: "text-[hsl(215_30%_35%)] opacity-40",
        day_range_middle: "aria-selected:bg-[hsl(200_100%_60%/0.15)] aria-selected:text-white",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4 text-[hsl(200_100%_70%)]" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4 text-[hsl(200_100%_70%)]" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
