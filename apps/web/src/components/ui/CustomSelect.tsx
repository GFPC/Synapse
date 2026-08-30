import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  subLabel?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  dropdownClassName?: string;
  size?: 'sm' | 'md';
}

export function CustomSelect<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = 'Выберите...',
  disabled = false,
  className = '',
  dropdownClassName = '',
  size = 'sm',
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const sizeClasses =
    size === 'sm'
      ? 'py-1.5 px-3 text-xs rounded-lg min-h-[32px]'
      : 'py-2 px-3.5 text-xs rounded-xl min-h-[38px]';

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 bg-surface hover:bg-surface-2 border transition-all text-left select-none ${sizeClasses} ${
          isOpen
            ? 'border-accent ring-1 ring-accent/30 bg-surface-2 shadow-glow-sm'
            : 'border-border hover:border-zinc-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span
            className={`truncate font-medium ${
              selectedOption ? 'text-text-main' : 'text-text-muted'
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-text-muted shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-accent' : ''
          }`}
        />
      </button>

      {/* Floating Options Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute top-full left-0 right-0 mt-1.5 z-50 bg-surface-2/95 backdrop-blur-xl border border-border rounded-xl p-1 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-60 overflow-y-auto ${dropdownClassName}`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 p-2 rounded-lg text-xs transition-colors text-left ${
                  isSelected
                    ? 'bg-accent/20 text-accent font-semibold'
                    : 'text-text-main hover:bg-surface-3'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <div className="min-w-0">
                    <div className="truncate text-text-main">
                      {opt.label}
                    </div>
                    {opt.subLabel && (
                      <div className="text-[10px] text-text-muted truncate">{opt.subLabel}</div>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
