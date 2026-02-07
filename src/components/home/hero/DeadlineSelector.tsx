"use client";

import { motion } from 'framer-motion';
import { Clock, Zap, Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DeadlineType } from '@/hooks/useActiveMission';

interface DeadlineSelectorProps {
  onSelect: (deadline: DeadlineType) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const DEADLINE_OPTIONS: { value: DeadlineType; label: string; icon: React.ElementType; description: string }[] = [
  { value: '24h', label: '24 Hours', icon: Zap, description: 'Sprint mode' },
  { value: '48h', label: '48 Hours', icon: Clock, description: 'Quick focus' },
  { value: '72h', label: '72 Hours', icon: Calendar, description: 'Standard' },
  { value: '1week', label: '1 Week', icon: CalendarDays, description: 'Deep work' },
  { value: '1month', label: '1 Month', icon: CalendarRange, description: 'Long haul' },
];

/**
 * Deadline selector for mission focus
 * Allows user to commit to a timeframe
 */
export function DeadlineSelector({ onSelect, onCancel, isLoading }: DeadlineSelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-3"
    >
      <div className="text-center mb-4">
        <p className="text-xs text-muted-foreground font-rajdhani">
          Choose your commitment window
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {DEADLINE_OPTIONS.slice(0, 4).map((option) => (
          <Button
            key={option.value}
            variant="outline"
            onClick={() => onSelect(option.value)}
            disabled={isLoading}
            className={cn(
              "flex-col h-auto py-3 px-2",
              "border-white/10 hover:border-primary/40 hover:bg-primary/10",
              "transition-all duration-200"
            )}
          >
            <option.icon className="w-4 h-4 mb-1 text-primary" />
            <span className="text-xs font-orbitron">{option.label}</span>
            <span className="text-[10px] text-muted-foreground">{option.description}</span>
          </Button>
        ))}
      </div>

      {/* Last option full width */}
      <Button
        variant="outline"
        onClick={() => onSelect('1month')}
        disabled={isLoading}
        className={cn(
          "w-full flex items-center justify-center gap-2",
          "border-white/10 hover:border-primary/40 hover:bg-primary/10"
        )}
      >
        <CalendarRange className="w-4 h-4 text-primary" />
        <span className="text-xs font-orbitron">1 Month</span>
        <span className="text-[10px] text-muted-foreground">(Long haul)</span>
      </Button>

      <Button
        variant="ghost"
        onClick={onCancel}
        disabled={isLoading}
        className="w-full text-xs text-muted-foreground hover:text-white"
      >
        Cancel
      </Button>
    </motion.div>
  );
}
