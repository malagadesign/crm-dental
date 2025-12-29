"use client";

import { useState } from "react";
import * as React from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value: string; // Formato "HH:mm"
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
}

export function TimePicker({
  value,
  onChange,
  label,
  required,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Parsear valor actual
  const [hour, minute] = value ? value.split(":").map(Number) : [9, 0];
  
  // Asegurar que esté en el rango válido (9-20)
  const validHour = hour < 9 ? 9 : hour > 20 ? 20 : hour;
  
  const [selectedHour, setSelectedHour] = useState<number>(validHour);
  const [selectedMinute, setSelectedMinute] = useState<number>(
    Math.round(minute / 30) * 30
  );
  
  // Horas disponibles (9 a 20)
  const hours = Array.from({ length: 12 }, (_, i) => i + 9); // 9, 10, 11, ..., 20
  const minutes = [0, 30];
  
  // Actualizar cuando cambia el value externo
  React.useEffect(() => {
    if (value) {
      const [h, m] = value.split(":").map(Number);
      const validH = h < 9 ? 9 : h > 20 ? 20 : h;
      setSelectedHour(validH);
      setSelectedMinute(Math.round(m / 30) * 30);
    }
  }, [value]);
  
  const updateTime = (hour: number, minute: number) => {
    // Asegurar rango 9-20
    const finalHour = hour < 9 ? 9 : hour > 20 ? 20 : hour;
    
    const timeString = `${String(finalHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    onChange(timeString);
  };
  
  const handleHourChange = (hour: number) => {
    setSelectedHour(hour);
    updateTime(hour, selectedMinute);
  };
  
  const handleMinuteChange = (minute: number) => {
    setSelectedMinute(minute);
    updateTime(selectedHour, minute);
  };
  
  const displayValue = value
    ? `${String(selectedHour).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")}`
    : "Seleccionar hora";
  
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
            <Clock className="mr-2 h-4 w-4" />
            {displayValue}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4">
            <div className="text-sm font-medium mb-3">Hora (24hs)</div>
            <div className="flex gap-2">
              {/* Horas */}
              <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
                {hours.map((h) => (
                  <Button
                    key={h}
                    variant={selectedHour === h ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-8 w-12",
                      selectedHour === h && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => handleHourChange(h)}
                  >
                    {String(h).padStart(2, "0")}
                  </Button>
                ))}
              </div>
              
              {/* Minutos */}
              <div className="flex flex-col gap-1">
                {minutes.map((m) => (
                  <Button
                    key={m}
                    variant={selectedMinute === m ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-8 w-12",
                      selectedMinute === m && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => handleMinuteChange(m)}
                  >
                    {String(m).padStart(2, "0")}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

