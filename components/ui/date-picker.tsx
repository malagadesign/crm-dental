"use client";

import { useState } from "react";
import * as React from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DatePickerProps {
  value: string; // Formato "YYYY-MM-DD"
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  min?: string;
  max?: string;
}

export function DatePicker({
  value,
  onChange,
  label,
  required,
  min,
  max,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const date = value ? new Date(value + "T00:00:00") : new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(date);
  
  // Actualizar cuando cambia el value externo
  React.useEffect(() => {
    if (value) {
      const newDate = new Date(value + "T00:00:00");
      setSelectedDate(newDate);
    }
  }, [value]);
  
  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setSelectedDate(newDate);
      const year = newDate.getFullYear();
      const month = String(newDate.getMonth() + 1).padStart(2, "0");
      const day = String(newDate.getDate()).padStart(2, "0");
      onChange(`${year}-${month}-${day}`);
    }
  };
  
  const displayValue = value
    ? format(new Date(value + "T00:00:00"), "dd/MM/yyyy", { locale: es })
    : "Seleccionar fecha";
  
  return (
    <div className="grid gap-2">
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {displayValue}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setMonth(newDate.getMonth() - 1);
                    setSelectedDate(newDate);
                  }}
                >
                  ←
                </Button>
                <div className="text-sm font-medium">
                  {format(selectedDate, "MMMM yyyy", { locale: es })}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setMonth(newDate.getMonth() + 1);
                    setSelectedDate(newDate);
                  }}
                >
                  →
                </Button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                {["L", "M", "M", "J", "V", "S", "D"].map((day) => (
                  <div key={day} className="font-medium text-muted-foreground py-1">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }, (_, i) => {
                  const date = new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth(),
                    1
                  );
                  const dayOfWeek = date.getDay();
                  const firstDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                  const day = i - firstDay + 1;
                  const currentDate = new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth(),
                    day
                  );
                  const isCurrentMonth =
                    currentDate.getMonth() === selectedDate.getMonth();
                  const isSelected =
                    currentDate.toDateString() === selectedDate.toDateString();
                  const isToday =
                    currentDate.toDateString() === new Date().toDateString();
                  
                  // Validar min/max
                  const isDisabled = Boolean(
                    (min && currentDate < new Date(min + "T00:00:00")) ||
                    (max && currentDate > new Date(max + "T00:00:00"))
                  );
                  
                  if (day <= 0 || !isCurrentMonth) {
                    return <div key={i} className="h-8" />;
                  }
                  
                  return (
                    <Button
                      key={i}
                      variant={isSelected ? "default" : "ghost"}
                      size="icon"
                      disabled={isDisabled}
                      className={cn(
                        "h-8 w-8 text-xs",
                        !isCurrentMonth && "text-muted-foreground opacity-50",
                        isToday && !isSelected && "border border-primary",
                        isSelected && "bg-primary text-primary-foreground",
                        isDisabled && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => handleDateSelect(currentDate)}
                    >
                      {day}
                    </Button>
                  );
                })}
              </div>
              <div className="flex justify-between pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    setSelectedDate(today);
                    const year = today.getFullYear();
                    const month = String(today.getMonth() + 1).padStart(2, "0");
                    const day = String(today.getDate()).padStart(2, "0");
                    onChange(`${year}-${month}-${day}`);
                  }}
                >
                  Hoy
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onChange("");
                    setIsOpen(false);
                  }}
                >
                  Borrar
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

