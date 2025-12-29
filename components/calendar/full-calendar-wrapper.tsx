"use client";

import dynamic from "next/dynamic";

// Importar FullCalendar dinámicamente
const FullCalendar = dynamic(
  () =>
    Promise.all([
      import("@fullcalendar/react"),
      import("@fullcalendar/daygrid"),
      import("@fullcalendar/timegrid"),
      import("@fullcalendar/interaction"),
      import("@fullcalendar/core/locales/es"),
    ]).then(([fc, dayGrid, timeGrid, interaction, esLocale]) => {
      // Crear un componente que incluya los plugins y el locale
      const FullCalendarComponent = fc.default;
      const plugins = [dayGrid.default, timeGrid.default, interaction.default];
      
      return function CalendarWithPlugins(props: any) {
        // Si no se especifica locale, usar español por defecto
        const finalProps = {
          ...props,
          locale: props.locale || esLocale.default,
        };
        return <FullCalendarComponent {...finalProps} plugins={plugins} />;
      };
    }),
  {
    ssr: false,
    loading: () => (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-muted-foreground">Cargando calendario...</p>
      </div>
    ),
  }
);

export function FullCalendarWrapper(props: any) {
  return <FullCalendar {...props} />;
}
