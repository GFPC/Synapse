import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const MONTH_NAMES = [
  '??????', '???????', '????', '??????', '???', '????',
  '????', '??????', '????????', '???????', '??????', '???????'
];

const WEEKDAYS = ['??', '??', '??', '??', '??', '??', '??'];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = '??.??.????',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial date or default to current date
  const parsedDate = value ? new Date(value) : null;
  const validDate = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : null;

  const [currentYear, setCurrentYear] = useState<number>(
    validDate ? validDate.getFullYear() : new Date().getFullYear()
  );
  const [currentMonth, setCurrentMonth] = useState<number>(
    validDate ? validDate.getMonth() : new Date().getMonth()
  );

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleSetToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    const formattedYear = today.getFullYear();
    const formattedMonth = String(today.getMonth() + 1).padStart(2, '0');
    const formattedDay = String(today.getDate()).padStart(2, '0');
    const dateStr = `${formattedYear}-${formattedMonth}-${formattedDay}`;
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  // Generate calendar days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  // Adjust so Monday is 0, Sunday is 6
  const startDayOffset = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Format display string
  const displayValue = validDate
    ? `${String(validDate.getDate()).padStart(2, '0')}.${String(validDate.getMonth() + 1).padStart(2, '0')}.${validDate.getFullYear()}`
    : '';

  const today = new Date();
  const isCurrentMonthToday = today.getFullYear() === currentYear && today.getMonth() === currentMonth;

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all duration-150 ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-surface/50 border-border text-text-muted'
            : isOpen
            ? 'bg-surface-2 border-emerald-500/80 text-text-main shadow-sm shadow-emerald-500/10'
            : 'bg-surface border-border hover:border-border-2 text-text-main'
        }`}
      >
        <Calendar className="w-3.5 h-3.5 text-text-muted" />
        <span className={displayValue ? 'text-text-main font-medium' : 'text-text-muted'}>
          {displayValue || placeholder}
        </span>
        {value && !disabled && (
          <span
            onClick={handleClear}
            className="ml-1 p-0.5 hover:bg-surface-3 rounded text-text-muted hover:text-red-400 transition-colors"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {/* Floating Dark Calendar Popup */}
      {isOpen && (
        <div className="absolute top-full mt-1.5 left-0 z-50 w-64 p-3 bg-[#121820] border border-[#212A36] rounded-xl shadow-2xl shadow-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
          {/* Header with Month / Year & Nav */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1E2633]">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-gray-100">
                {MONTH_NAMES[currentMonth]}
              </span>
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                {currentYear}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:bg-[#1E2633] rounded-md text-gray-400 hover:text-white transition-colors"
                title="?????????? ?????"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:bg-[#1E2633] rounded-md text-gray-400 hover:text-white transition-colors"
                title="????????? ?????"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAYS.map((wd, i) => (
              <span
                key={wd}
                className={`text-[10px] font-semibold ${
                  i >= 5 ? 'text-amber-500/70' : 'text-gray-500'
                }`}
              >
                {wd}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center mb-3">
            {/* Prev month fill days */}
            {Array.from({ length: startDayOffset }).map((_, i) => {
              const dayNum = daysInPrevMonth - startDayOffset + i + 1;
              return (
                <div
                  key={`prev-${i}`}
                  className="h-7 flex items-center justify-center text-[11px] text-gray-600 font-mono"
                >
                  {dayNum}
                </div>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isSelected =
                validDate &&
                validDate.getFullYear() === currentYear &&
                validDate.getMonth() === currentMonth &&
                validDate.getDate() === dayNum;

              const isToday = isCurrentMonthToday && today.getDate() === dayNum;

              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`h-7 w-7 mx-auto rounded-lg flex items-center justify-center text-xs font-mono transition-all duration-100 relative ${
                    isSelected
                      ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30'
                      : isToday
                      ? 'bg-[#1E2633] text-emerald-400 font-bold border border-emerald-500/40 hover:bg-emerald-500/20'
                      : 'text-gray-200 hover:bg-[#1E2633] hover:text-white'
                  }`}
                >
                  {dayNum}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-0.5 w-1 h-1 bg-emerald-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Quick Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-[#1E2633] text-[11px]">
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-red-400 font-medium transition-colors"
            >
              ????????
            </button>
            <button
              type="button"
              onClick={handleSetToday}
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
            >
              ???????
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
