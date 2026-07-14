import { useEffect, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import Loader from '../ui/Loader';
import type { Task, TaskStatus, GroupedTasks } from '../../types';

interface KanbanBoardProps {
  workspaceId: string;
}

const columns: { id: TaskStatus; title: string }[] = [
  { id: 'TODO', title: 'To Do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'IN_REVIEW', title: 'In Review' },
  { id: 'DONE', title: 'Done' },
];

const emptyGroups: GroupedTasks = {
  TODO: [],
  IN_PROGRESS: [],
  IN_REVIEW: [],
  DONE: [],
};

/** A droppable column wrapper. */
function Column({
  id,
  children,
}: {
  id: TaskStatus;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[120px] flex-col gap-2 rounded-lg p-2 transition ${
        isOver ? 'bg-indigo-500/10' : ''
      }`}
    >
      {children}
    </div>
  );
}

export default function KanbanBoard({ workspaceId }: KanbanBoardProps) {
  const [groups, setGroups] = useState<GroupedTasks>(emptyGroups);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<TaskStatus>('TODO');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/tasks/workspace/${workspaceId}`);
      setGroups(data.grouped);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const findTask = (id: string): Task | undefined => {
    for (const col of columns) {
      const t = groups[col.id].find((task) => task.id === id);
      if (t) return t;
    }
    return undefined;
  };

  const onDragStart = (event: DragStartEvent) => {
    const task = findTask(String(event.active.id));
    if (task) setActiveTask(task);
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const task = findTask(taskId);
    if (!task) return;

    // The droppable id is the column status; the over id may be a card too.
    let targetStatus = over.id as TaskStatus;
    if (!columns.some((c) => c.id === targetStatus)) {
      const overTask = findTask(String(over.id));
      if (overTask) targetStatus = overTask.status;
    }

    if (targetStatus === task.status) return;

    // Optimistic update.
    setGroups((prev) => {
      const next: GroupedTasks = {
        TODO: [...prev.TODO],
        IN_PROGRESS: [...prev.IN_PROGRESS],
        IN_REVIEW: [...prev.IN_REVIEW],
        DONE: [...prev.DONE],
      };
      next[task.status] = next[task.status].filter((t) => t.id !== taskId);
      next[targetStatus] = [{ ...task, status: targetStatus }, ...next[targetStatus]];
      return next;
    });

    try {
      await api.put(`/tasks/${taskId}`, { status: targetStatus });
    } catch (err) {
      toast.error((err as Error).message);
      load(); // revert by reloading
    }
  };

  const handleSaved = (task: Task) => {
    setGroups((prev) => {
      const next: GroupedTasks = {
        TODO: prev.TODO.filter((t) => t.id !== task.id),
        IN_PROGRESS: prev.IN_PROGRESS.filter((t) => t.id !== task.id),
        IN_REVIEW: prev.IN_REVIEW.filter((t) => t.id !== task.id),
        DONE: prev.DONE.filter((t) => t.id !== task.id),
      };
      next[task.status] = [task, ...next[task.status]];
      return next;
    });
  };

  const handleDeleted = (taskId: string) => {
    setGroups((prev) => ({
      TODO: prev.TODO.filter((t) => t.id !== taskId),
      IN_PROGRESS: prev.IN_PROGRESS.filter((t) => t.id !== taskId),
      IN_REVIEW: prev.IN_REVIEW.filter((t) => t.id !== taskId),
      DONE: prev.DONE.filter((t) => t.id !== taskId),
    }));
  };

  const openCreate = (status: TaskStatus) => {
    setModalTask(null);
    setCreateStatus(status);
    setModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setModalTask(task);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader label="Loading tasks..." />
      </div>
    );
  }

  return (
    <div className="h-full overflow-x-auto p-4">
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex h-full gap-4">
          {columns.map((col) => (
            <div key={col.id} className="flex w-72 flex-shrink-0 flex-col rounded-xl bg-bg-dark">
              <div className="flex items-center justify-between px-3 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text-primary">{col.title}</span>
                  <span className="rounded-full bg-white/10 px-2 text-xs text-text-secondary">
                    {groups[col.id].length}
                  </span>
                </div>
                <button
                  onClick={() => openCreate(col.id)}
                  className="text-text-secondary transition hover:text-white"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <SortableContext
                  items={groups[col.id].map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <Column id={col.id}>
                    {groups[col.id].map((task) => (
                      <TaskCard key={task.id} task={task} onClick={openEdit} />
                    ))}
                    {groups[col.id].length === 0 && (
                      <p className="px-2 py-4 text-center text-xs text-text-secondary">
                        No tasks
                      </p>
                    )}
                  </Column>
                </SortableContext>
              </div>
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} onClick={() => {}} /> : null}
        </DragOverlay>
      </DndContext>

      <TaskModal
        task={modalTask}
        workspaceId={workspaceId}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
        key={modalTask?.id || `create-${createStatus}`}
      />
    </div>
  );
}
