import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { TodoPriority, CreateTaskInput } from '@/hooks/useTodoList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface TodoCreateFormProps {
  onSubmit: (input: CreateTaskInput) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function TodoCreateForm({ onSubmit, onCancel, isLoading }: TodoCreateFormProps) {
  const [name, setName] = useState('');
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [priority, setPriority] = useState<TodoPriority>('medium');
  const [isUrgent, setIsUrgent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      deadline: deadline?.toISOString() ?? null,
      priority,
      is_urgent: isUrgent,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Task name */}
      <div className="space-y-2">
        <Label htmlFor="task-name" className="text-sm text-muted-foreground">
          Task Name <span className="text-red-400">*</span>
        </Label>
        <Input
          id="task-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="What needs to be done?"
          className="bg-background/50 border-border"
          autoFocus
        />
      </div>

      {/* Deadline */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Deadline (optional)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal bg-background/50 border-border',
                !deadline && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {deadline ? format(deadline, 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
            <Calendar
              mode="single"
              selected={deadline}
              onSelect={setDeadline}
              initialFocus
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            />
            {deadline && (
              <div className="p-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
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

      {/* Priority */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Priority</Label>
        <Select value={priority} onValueChange={(v) => setPriority(v as TodoPriority)}>
          <SelectTrigger className="bg-background/50 border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Urgent checkbox */}
      <div className="flex items-center gap-3">
        <Checkbox
          id="urgent"
          checked={isUrgent}
          onCheckedChange={(checked) => setIsUrgent(checked === true)}
          className="border-red-400/50 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
        />
        <Label 
          htmlFor="urgent" 
          className="text-sm text-foreground cursor-pointer select-none"
        >
          Mark as Urgent
        </Label>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
          className="text-muted-foreground"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!name.trim() || isLoading}
          className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
        >
          {isLoading ? 'Creating...' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
}
