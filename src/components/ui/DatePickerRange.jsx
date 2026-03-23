import React, { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import 'react-day-picker/dist/style.css';

export default function DatePickerRange({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Cerrar al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (range) => {
    onChange(range);
  };

  const getDisplayValue = () => {
    if (value?.from) {
      if (!value.to) {
        return format(value.from, "PPP", { locale: es });
      } else if (value.to) {
        return `${format(value.from, "LLL dd, y", { locale: es })} - ${format(value.to, "LLL dd, y", { locale: es })}`;
      }
    }
    return "Seleccionar fechas...";
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 min-h-[42px] bg-dark-bg border border-dark-border hover:border-brand/50 rounded-lg text-left text-sm text-white transition-all group"
      >
        <CalendarIcon className="w-5 h-5 text-dark-muted group-hover:text-brand transition-colors" />
        <span className="flex-1 capitalize font-medium">{getDisplayValue()}</span>
        {value?.from && (
          <X
            className="w-4 h-4 text-dark-muted hover:text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onChange({ from: undefined, to: undefined });
            }}
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 p-5 bg-[#16161a] border border-[#2a2a32] rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
          <style>{`
            .rdp-root {
              /* Tema Oscuro Nativo */
              --rdp-accent-color: #7c3aed;
              --rdp-background-color: transparent;
              
              /* Rango Intermedio */
              --rdp-range_middle-background-color: rgba(124, 58, 237, 0.2);
              --rdp-range_middle-color: white;
              
              /* Bordes del Rango (Inicio y Fin) */
              --rdp-range_start-background-color: #7c3aed;
              --rdp-range_start-color: white;
              --rdp-range_end-background-color: #7c3aed;
              --rdp-range_end-color: white;
              
              /* Dimensiones y Tipografía */
              --rdp-day-height: 40px;
              --rdp-day-width: 40px;
              --rdp-selected-font: 900;
              color: #f3f4f6;
              margin: 0;
            }
            .rdp-months {
              display: flex;
              gap: 1rem;
            }
            .rdp-caption_label {
              text-transform: capitalize;
              font-weight: 900;
              font-size: 1rem;
              letter-spacing: 0.05em;
            }
            .rdp-head_cell {
              color: #94a3b8;
              text-transform: uppercase;
              font-size: 0.70rem;
              font-weight: 900;
              letter-spacing: 0.1em;
            }
            .rdp-day {
              border-radius: 50%;
              transition: background-color 0.2s;
              font-weight: 500;
            }
            .rdp-day:hover:not(.rdp-selected, .rdp-day_selected):not([disabled]) {
              background-color: rgba(255, 255, 255, 0.1);
            }

            .rdp-nav_button {
              color: #94a3b8;
              border-radius: 8px;
            }
            .rdp-nav_button:hover {
              color: white;
              background-color: rgba(255, 255, 255, 0.1);
            }
            .rdp-outside, .rdp-day_outside {
              opacity: 0.3;
            }
            .rdp-disabled, .rdp-day_disabled {
              opacity: 0;
            }
          `}</style>
          <DayPicker
            mode="range"
            selected={value}
            onSelect={handleSelect}
            locale={es}
            showOutsideDays
          />
        </div>
      )}
    </div>
  );
}
