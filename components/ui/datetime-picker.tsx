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

interface DateTimePickerProps {
  value: string; // ISO string format "YYYY-MM-DDTHH:mm"
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  min?: string;
  max?: string;
}

export function DateTimePicker({
  value,
  onChange,
  label,
  required,
  min,
  max,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const date = value ? new Date(value) : new Date();
  
  // Función para convertir hora de 24h a 12h
  const convertTo12Hour = (hour24: number) => {
    let hour12 = hour24;
    let period: "AM" | "PM" = "AM";
    
    if (hour24 === 0) {
      hour12 = 12;
      period = "AM";
    } else if (hour24 < 12) {
      hour12 = hour24;
      period = "AM";
    } else if (hour24 === 12) {
      hour12 = 12;
      period = "PM";
    } else {
      hour12 = hour24 - 12;
      period = "PM";
    }
    
    // Asegurar que esté en el rango válido (9 AM - 8 PM)
    if (hour24 < 9) {
      hour12 = 9;
      period = "AM";
    } else if (hour24 > 20) {
      hour12 = 8;
      period = "PM";
    }
    
    return { hour12, period };
  };
  
  const hour24 = date.getHours();
  const { hour12, period } = convertTo12Hour(hour24);
  
  const [selectedDate, setSelectedDate] = useState<Date>(date);
  const [selectedHour, setSelectedHour] = useState<number>(hour12);
  const [selectedMinute, setSelectedMinute] = useState<number>(
    Math.round(date.getMinutes() / 30) * 30 // Redondear a intervalos de 30 minutos
  );
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">(period);
  
  // Actualizar estado cuando cambia el value externo
  React.useEffect(() => {
    if (value) {
      const newDate = new Date(value);
      setSelectedDate(newDate);
      const { hour12: newHour12, period: newPeriod } = convertTo12Hour(newDate.getHours());
      setSelectedHour(newHour12);
      setSelectedMinute(Math.round(newDate.getMinutes() / 30) * 30);
      setSelectedPeriod(newPeriod);
    }
  }, [value]);

  // Generar horas para mostrar (9 AM a 8 PM)
  // Mostramos: 9, 10, 11, 12 (AM), luego 1, 2, 3, 4, 5, 6, 7, 8 (PM)
  const hoursAM = [9, 10, 11, 12];
  const hoursPM = [1, 2, 3, 4, 5, 6, 7, 8];
  const minutes = [0, 30];
  
  // Determinar qué horas mostrar según el periodo seleccionado
  const displayHours = selectedPeriod === "AM" ? hoursAM : hoursPM;

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setSelectedDate(newDate);
      updateDateTime(newDate, selectedHour, selectedMinute, selectedPeriod);
    }
  };

  const updateDateTime = (
    date: Date,
    hour: number,
    minute: number,
    period: "AM" | "PM"
  ) => {
    const newDate = new Date(date);
    let finalHour = hour;
    
    // Convertir hora de 12h a 24h
    if (period === "PM") {
      if (hour === 12) {
        finalHour = 12;
      } else {
        finalHour = hour + 12;
      }
    } else {
      // AM
      if (hour === 12) {
        finalHour = 0;
      } else {
        finalHour = hour;
      }
    }
    
    // Asegurar que esté en el rango 9-20
    if (finalHour < 9) finalHour = 9;
    if (finalHour > 20) finalHour = 20;
    
    newDate.setHours(finalHour, minute, 0, 0);
    
    // Formatear como "YYYY-MM-DDTHH:mm" para datetime-local
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, "0");
    const day = String(newDate.getDate()).padStart(2, "0");
    const hours = String(finalHour).padStart(2, "0");
    const mins = String(minute).padStart(2, "0");
    
    onChange(`${year}-${month}-${day}T${hours}:${mins}`);
  };

  const handleHourChange = (hour: number) => {
    setSelectedHour(hour);
    updateDateTime(selectedDate, hour, selectedMinute, selectedPeriod);
  };

  const handleMinuteChange = (minute: number) => {
    setSelectedMinute(minute);
    updateDateTime(selectedDate, selectedHour, minute, selectedPeriod);
  };

  const handlePeriodChange = (period: "AM" | "PM") => {
    setSelectedPeriod(period);
    // Si cambiamos de AM a PM o viceversa, ajustar la hora si es necesario
    let adjustedHour = selectedHour;
    const hoursInPeriod = period === "AM" ? hoursAM : hoursPM;
    
    // Si la hora actual no está en el nuevo periodo, usar la primera hora disponible
    if (!hoursInPeriod.includes(selectedHour)) {
      adjustedHour = hoursInPeriod[0];
      setSelectedHour(adjustedHour);
    }
    
    updateDateTime(selectedDate, adjustedHour, selectedMinute, period);
  };

  const displayValue = value
    ? format(new Date(value), "dd/MM/yyyy, hh:mm a", { locale: es })
    : "Seleccionar fecha y hora";

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
          <div className="flex">
            {/* Calendario */}
            <div className="p-4 border-r">
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
                    const firstDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Lunes = 0
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

                    if (day <= 0 || !isCurrentMonth) {
                      return <div key={i} className="h-8" />;
                    }

                    return (
                      <Button
                        key={i}
                        variant={isSelected ? "default" : "ghost"}
                        size="icon"
                        className={cn(
                          "h-8 w-8 text-xs",
                          !isCurrentMonth && "text-muted-foreground opacity-50",
                          isToday && !isSelected && "border border-primary",
                          isSelected && "bg-primary text-primary-foreground"
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
                      setSelectedHour(today.getHours() >= 12 ? today.getHours() - 12 || 12 : today.getHours() || 12);
                      setSelectedMinute(Math.round(today.getMinutes() / 30) * 30);
                      setSelectedPeriod(today.getHours() >= 12 ? "PM" : "AM");
                      updateDateTime(
                        today,
                        today.getHours() >= 12 ? today.getHours() - 12 || 12 : today.getHours() || 12,
                        Math.round(today.getMinutes() / 30) * 30,
                        today.getHours() >= 12 ? "PM" : "AM"
                      );
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

            {/* Selector de hora */}
            <div className="p-4">
              <div className="text-sm font-medium mb-3">Hora</div>
              <div className="flex gap-2">
                {/* Horas */}
                <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
                  {displayHours.map((hour) => (
                    <Button
                      key={hour}
                      variant={selectedHour === hour ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "h-8 w-12",
                        selectedHour === hour && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => handleHourChange(hour)}
                    >
                      {String(hour).padStart(2, "0")}
                    </Button>
                  ))}
                </div>

                {/* Minutos */}
                <div className="flex flex-col gap-1">
                  {minutes.map((minute) => (
                    <Button
                      key={minute}
                      variant={selectedMinute === minute ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "h-8 w-12",
                        selectedMinute === minute && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => handleMinuteChange(minute)}
                    >
                      {String(minute).padStart(2, "0")}
                    </Button>
                  ))}
                </div>

                {/* AM/PM */}
                <div className="flex flex-col gap-1">
                  <Button
                    variant={selectedPeriod === "AM" ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-8 w-12",
                      selectedPeriod === "AM" && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => handlePeriodChange("AM")}
                  >
                    a.m.
                  </Button>
                  <Button
                    variant={selectedPeriod === "PM" ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-8 w-12",
                      selectedPeriod === "PM" && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => handlePeriodChange("PM")}
                  >
                    p.m.
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

