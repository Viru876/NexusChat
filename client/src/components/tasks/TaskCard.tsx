import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar } from 'lucide-react';
import { format, isPast } from 'date-fns';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Tooltip from '../ui/Tooltip';
import type { Task, TaskPriority } from '../../types';

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

const priorityColor: Record<TaskPriority, 'gray' | 'cyan' | 'orange' | 'red'> = {
  LOW: 'gray',
  MEDIUM: 'cyan',
  HIGH: 'orange',
  URGENT: 'red',
};

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const overdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'DONE';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className="glass cursor-grab rounded-lg p-3 transition hover:border-indigo-500/50 active:cursor-grabbing"
    >
      <p className="mb-2 text-sm font-semibold text-text-primary">{task.title}</p>

      {task.description && (
        <p className="mb-2 line-clamp-2 text-xs text-text-secondary">{task.description}</p>
      )}

      <div className="flex items-center justify-between">
        <Badge color={priorityColor[task.priority]}>{task.priority}</Badge>

        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span
              className={`flex items-center gap-1 text-xs ${
                overdue ? 'text-red-400' : 'text-text-secondary'
              }`}
            >
              <Calendar size={12} />
              {format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}
          {task.assignee && (
            <Tooltip content={task.assignee.name} side="top">
              <Avatar user={task.assignee} size="sm" showStatus />
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
