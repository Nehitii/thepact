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
      className={cn("p-3 pointer-events-auto bg-[#0C0F1A] rounded-[10px] border-2 border-[#3B82F6]", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-semibold text-[#FFFFFF] tracking-wider",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-[#0C0F1A] border-2 border-[#3B82F6] p-0 hover:bg-[#3B82F6] hover:border-[#60A5FA] hover:text-[#FFFFFF] transition-all duration-200",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-[#C7D8FF] rounded-md w-9 font-semibold text-[0.7rem] uppercase tracking-wider",
        row: "flex w-full mt-2",
        cell: cn(
          "h-9 w-9 text-center text-sm p-0 relative",
          "[&:has([aria-selected].day-range-end)]:rounded-r-md",
          "[&:has([aria-selected].day-outside)]:bg-[#3B82F6]/30",
          "[&:has([aria-selected])]:bg-[#3B82F6]/20",
          "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
          "focus-within:relative focus-within:z-20",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal text-[#FFFFFF] hover:bg-[#3B82F6] hover:text-[#FFFFFF] aria-selected:opacity-100 transition-all duration-150",
        ),
        day_range_end: "day-range-end",
        day_selected: cn(
          "bg-[#3B82F6] text-[#FFFFFF] font-semibold",
          "hover:bg-[#60A5FA] hover:text-[#FFFFFF]",
          "focus:bg-[#3B82F6] focus:text-[#FFFFFF]",
          "shadow-[0_0_8px_#3B82F6]",
        ),
        day_today: "bg-[#60A5FA]/30 text-[#FFFFFF] font-semibold border-2 border-[#60A5FA]",
        day_outside: cn(
          "day-outside text-[#8FA3C8] opacity-60",
          "aria-selected:bg-[#3B82F6]/20 aria-selected:text-[#8FA3C8] aria-selected:opacity-40",
        ),
        day_disabled: "text-[#8FA3C8] opacity-40",
        day_range_middle: "aria-selected:bg-[#3B82F6]/20 aria-selected:text-[#FFFFFF]",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4 text-[#60A5FA]" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4 text-[#60A5FA]" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
