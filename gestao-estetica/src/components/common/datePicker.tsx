import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {cn} from "@/lib/utils/utils";

interface DatePickerProps {
    /** Selected date value */
    value?: Date;
    /** Callback when date is selected */
    onSelect?: (date: Date | undefined) => void;
    /** Placeholder text when no date is selected */
    placeholder?: string;
    /** Whether the date picker is disabled */
    disabled?: boolean;
    /** Custom CSS classes */
    className?: string;
    /** Button variant */
    variant?: 'default' | 'outline' | 'ghost' | 'secondary';
    /** Button size */
    size?: 'default' | 'sm' | 'lg';
    /** Date format string (using date-fns format) */
    dateFormat?: string;
    /** Minimum selectable date */
    minDate?: Date;
    /** Maximum selectable date */
    maxDate?: Date;
    /** Whether to show time selection */
    showTime?: boolean;
    /** Custom width for the trigger button */
    width?: string;
}

export function DatePicker({
                               value,
                               onSelect,
                               placeholder = 'Selecionar data',
                               disabled = false,
                               className,
                               variant = 'outline',
                               size = 'default',
                               dateFormat = 'dd/MM/yyyy',
                               minDate,
                               maxDate,
                               showTime = false,
                               width = 'w-[280px]',
                           }: DatePickerProps) {
    const [open, setOpen] = React.useState(false);

    const handleSelect = (selectedDate: Date | undefined) => {
        onSelect?.(selectedDate);
        setOpen(false);
    };

    const formatDate = (date: Date) => {
        if (showTime) {
            return format(date, `${dateFormat} HH:mm`, { locale: ptBR });
        }
        return format(date, dateFormat, { locale: ptBR });
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={variant}
                    size={size}
                    disabled={disabled}
                    data-empty={!value}
                    className={cn(
                        'data-[empty=true]:text-muted-foreground justify-start text-left font-normal',
                        width,
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value ? formatDate(value) : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={handleSelect}
                    initialFocus
                    disabled={(date) => {
                        if (minDate && date < minDate) return true;
                        if (maxDate && date > maxDate) return true;
                        return false;
                    }}
                    locale={ptBR}
                />
                {showTime && value && (
                    <div className="p-3 border-t">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Hora:</label>
                            <input
                                type="time"
                                className="text-sm border rounded px-2 py-1"
                                value={format(value, 'HH:mm')}
                                onChange={(e) => {
                                    const [hours, minutes] = e.target.value.split(':');
                                    const newDate = new Date(value);
                                    newDate.setHours(parseInt(hours), parseInt(minutes));
                                    onSelect?.(newDate);
                                }}
                            />
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

// Additional helper components for common use cases

interface DateRangePickerProps {
    /** Selected date range */
    value?: { from?: Date; to?: Date };
    /** Callback when date range is selected */
    onSelect?: (range: { from?: Date; to?: Date } | undefined) => void;
    /** Placeholder text when no dates are selected */
    placeholder?: string;
    /** Whether the date picker is disabled */
    disabled?: boolean;
    /** Custom CSS classes */
    className?: string;
    /** Custom width for the trigger button */
    width?: string;
}

export function DateRangePicker({
                                    value,
                                    onSelect,
                                    placeholder = 'Selecionar período',
                                    disabled = false,
                                    className,
                                    width = 'w-[300px]',
                                }: DateRangePickerProps) {
    const [open, setOpen] = React.useState(false);

    const formatDateRange = (range: { from?: Date; to?: Date }) => {
        if (!range.from) return placeholder;
        if (!range.to) return format(range.from, 'dd/MM/yyyy', { locale: ptBR });
        return `${format(range.from, 'dd/MM/yyyy', { locale: ptBR })} - ${format(range.to, 'dd/MM/yyyy', { locale: ptBR })}`;
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    data-empty={!value?.from}
                    className={cn(
                        'data-[empty=true]:text-muted-foreground justify-start text-left font-normal',
                        width,
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateRange(value || {})}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="range"
                    selected={value ? { from: value.from, to: value.to } : undefined}
                    onSelect={onSelect}
                    numberOfMonths={2}
                    initialFocus
                    locale={ptBR}
                />
            </PopoverContent>
        </Popover>
    );
}

// Preset date picker with common options
interface PresetDatePickerProps extends Omit<DatePickerProps, 'onSelect'> {
    onSelect?: (date: Date | undefined) => void;
    presets?: Array<{
        label: string;
        value: Date | (() => Date);
    }>;
}

export function PresetDatePicker({
                                     value,
                                     onSelect,
                                     presets = [
                                         { label: 'Hoje', value: () => new Date() },
                                         { label: 'Amanhã', value: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
                                         { label: 'Em 1 semana', value: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
                                     ],
                                     ...props
                                 }: PresetDatePickerProps) {
    const [open, setOpen] = React.useState(false);

    const handlePresetSelect = (preset: { label: string; value: Date | (() => Date) }) => {
        const date = typeof preset.value === 'function' ? preset.value() : preset.value;
        onSelect?.(date);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={props.variant || 'outline'}
                    size={props.size}
                    disabled={props.disabled}
                    data-empty={!value}
                    className={cn(
                        'data-[empty=true]:text-muted-foreground justify-start text-left font-normal',
                        props.width || 'w-[280px]',
                        props.className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value ? format(value, props.dateFormat || 'dd/MM/yyyy', { locale: ptBR }) :
                        <span>{props.placeholder || 'Selecionar data'}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="flex">
                    <div className="border-r p-2">
                        <div className="text-sm font-medium mb-2">Presets</div>
                        <div className="space-y-1">
                            {presets.map((preset) => (
                                <Button
                                    key={preset.label}
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start text-sm"
                                    onClick={() => handlePresetSelect(preset)}
                                >
                                    {preset.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <Calendar
                        mode="single"
                        selected={value}
                        onSelect={(date) => {
                            onSelect?.(date);
                            setOpen(false);
                        }}
                        initialFocus
                        locale={ptBR}
                    />
                </div>
            </PopoverContent>
        </Popover>
    );
}