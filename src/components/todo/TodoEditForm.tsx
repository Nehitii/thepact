import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarIcon, Briefcase, Heart, BookOpen, Cog, User, Tag, Calendar, Clock, Sparkles, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { TodoPriority, TodoTask } from '@/hooks/useTodoList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface UpdateTaskInput {
  id: string;
  name: string;
  deadline: string | null;
  priority: TodoPriority;
  is_urgent: boolean;
  category: string;
  task_type: string;
}

interface TodoEditFormProps {
  task: TodoTask;
  onSubmit: (input: UpdateTaskInput) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const categories = [
  { id: 'work', label: 'Work', icon: Briefcase, color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  { id: 'health', label: 'Health', icon: Heart, color: 'text-red-400 border-red-500/30 bg-red-500/10' },
  { id: 'personal', label: 'Personal', icon: User, color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
  { id: 'study', label: 'Study', icon: BookOpen, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  { id: 'admin', label: 'Admin', icon: Cog, color: 'text-gray-400 border-gray-500/30 bg-gray-500/10' },
  { id: 'general', label: 'General', icon: Tag, color: 'text-muted-foreground border-border bg-muted/30' },
];

const taskTypes = [
  { id: 'flexible', label: 'Flexible', icon: Sparkles, color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
  { id: 'deadline', label: 'Deadline', icon: Clock, color: 'text-red-400 border-red-500/30 bg-red-500/10' },
  { id: 'appointment', label: 'Appointment', icon: Calendar, color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
];

const priorities = [
  { id: 'low', label: 'Easy', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20' },
  { id: 'medium', label: 'Medium', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20' },
  { id: 'high', label: 'Hard', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20' },
];

export function TodoEditForm({ task, onSubmit, onCancel, isLoading }: TodoEditFormProps) {
  const [name, setName] = useState(task.name);
  const [deadline, setDeadline] = useState<Date | undefined>(
    task.deadline ? new Date(task.deadline) : undefined
  );
  const [priority, setPriority] = useState<TodoPriority>(task.priority);
  const [category, setCategory] = useState(task.category || 'general');
  const [taskType, setTaskType] = useState(task.task_type || 'flexible');
  const [isUrgent, setIsUrgent] = useState(task.is_urgent);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    onSubmit({
      id: task.id,
      name: name.trim(),
      deadline: deadline?.toISOString() ?? null,
      priority,
      is_urgent: isUrgent,
      category,
      task_type: taskType,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Task name */}
      <div className="space-y-3">
        <Label htmlFor="edit-task-name" className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80 flex items-center gap-2">
          Quest Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="edit-task-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="What needs to be conquered?"
          variant="light"
          className="h-12 text-base rounded-xl"
          maxLength={100}
          autoComplete="off"
          autoFocus
        />
      </div>

      {/* Category selection */}
      <div className="space-y-3">
        <Label className="text-sm text-muted-foreground">Category</Label>
        <div className="grid grid-cols-3 gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = category === cat.id;
            return (
              <motion.button
                key={cat.id}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCategory(cat.id)}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-xl border transition-all',
                  isSelected 
                    ? cat.color + ' ring-1 ring-current'
                    : 'border-border/50 bg-card/30 hover:bg-card/50'
                )}
              >
                <Icon className={cn('w-4 h-4', isSelected ? '' : 'text-muted-foreground')} />
                <span className={cn('text-sm font-medium', isSelected ? '' : 'text-muted-foreground')}>{cat.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Task type */}
      <div className="space-y-3">
        <Label className="text-sm text-muted-foreground">Task Type</Label>
        <div className="grid grid-cols-3 gap-2">
          {taskTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = taskType === type.id;
            return (
              <motion.button
                key={type.id}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setTaskType(type.id)}
                className={cn(
                  'flex flex-col items-center gap-1 p-3 rounded-xl border transition-all',
                  isSelected 
                    ? type.color + ' ring-1 ring-current'
                    : 'border-border/50 bg-card/30 hover:bg-card/50'
                )}
              >
                <Icon className={cn('w-5 h-5', isSelected ? '' : 'text-muted-foreground')} />
                <span className={cn('text-xs font-medium', isSelected ? '' : 'text-muted-foreground')}>{type.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Priority / Difficulty */}
      <div className="space-y-3">
        <Label className="text-sm text-muted-foreground">Difficulty</Label>
        <div className="flex gap-2">
          {priorities.map((p) => {
            const isSelected = priority === p.id;
            return (
              <motion.button
                key={p.id}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPriority(p.id as TodoPriority)}
                className={cn(
                  'flex-1 py-3 rounded-xl border font-medium transition-all',
                  isSelected 
                    ? p.color + ' ring-1 ring-current'
                    : 'border-border/50 bg-card/30 text-muted-foreground hover:bg-card/50'
                )}
              >
                {p.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Deadline */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Deadline (optional)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              type="button"
              className={cn(
                'w-full justify-start text-left font-normal bg-card/50 border-border/50 rounded-xl h-12',
                !deadline && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {deadline ? format(deadline, 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-card/95 backdrop-blur-xl border-border" align="start">
            <CalendarComponent
              mode="single"
              selected={deadline}
              onSelect={setDeadline}
              initialFocus
            />
            {deadline && (
              <div className="p-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setDeadline(undefined)}
                  className="w-full text-muted-foreground"
                >
                  Clear date
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Urgent checkbox */}
      <motion.div 
        whileHover={{ scale: 1.01 }}
        className="flex items-center gap-3 p-3 rounded-xl border border-red-500/20 bg-red-500/5"
      >
        <Checkbox
          id="edit-urgent"
          checked={isUrgent}
          onCheckedChange={(checked) => setIsUrgent(checked === true)}
          className="border-red-400/50 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
        />
        <Label 
          htmlFor="edit-urgent" 
          className="text-sm text-foreground cursor-pointer select-none flex-1"
        >
          <span className="font-medium">Mark as Urgent</span>
          <p className="text-xs text-muted-foreground mt-0.5">This task needs immediate attention</p>
        </Label>
      </motion.div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
          className="text-muted-foreground rounded-xl"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!name.trim() || isLoading}
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground border-0 rounded-xl px-6"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
