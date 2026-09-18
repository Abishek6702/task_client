import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, User } from 'lucide-react';
import { Badge } from './ui';
import { format } from 'date-fns';
import api from '../utils/api';
import { useToast } from './Toast';
import CreateTaskModal from './CreateTaskModal';
import TaskDetailsModal from './TaskDetailsModal';

const COLUMNS = [
  { id: 'To Do', label: 'To Do', dotColor: 'bg-slate-400' },
  { id: 'In Progress', label: 'In Progress', dotColor: 'bg-blue-500' },
  { id: 'Review', label: 'Review', dotColor: 'bg-amber-500' },
  { id: 'Done', label: 'Done', dotColor: 'bg-green-500' },
  { id: 'Blocked', label: 'Blocked', dotColor: 'bg-red-500' },
  { id: 'On Hold', label: 'On Hold', dotColor: 'bg-orange-400' },
];

const TaskCard = ({ task, index, onClick }) => (
  <Draggable draggableId={task._id} index={index}>
    {(provided, snapshot) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        onClick={() => onClick(task._id)}
        className={`bg-white border rounded-md p-3 space-y-2 cursor-pointer select-none transition-shadow ${
          snapshot.isDragging ? 'shadow-lg border-brand-300' : 'border-slate-200 hover:border-slate-300 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-400">{task.taskCode}</span>
          <Badge label={task.priority || 'Medium'} showDot />
        </div>
        <p className="text-sm font-medium text-slate-900 leading-snug">{task.title}</p>
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            {task.dueDate && (
              <span className={`${new Date(task.dueDate) < new Date() && task.status !== 'Done' ? 'text-red-600 font-medium' : ''}`}>
                {format(new Date(task.dueDate), 'MMM d')}
              </span>
            )}
          </div>
          {(() => {
            const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : (task.assignedTo ? [task.assignedTo] : []);
            return assignees.length > 0 ? (
              <div className="flex -space-x-1">
                {assignees.slice(0, 3).map((a, i) => (
                  <div key={a._id || i} className="h-6 w-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold border-2 border-white" title={`${a.firstName} ${a.lastName}`}>
                    {a.firstName?.[0]}{a.lastName?.[0]}
                  </div>
                ))}
                {assignees.length > 3 && (
                  <div className="h-6 w-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[9px] font-bold border-2 border-white">
                    +{assignees.length - 3}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
                <User className="h-3 w-3 text-slate-400" />
              </div>
            );
          })()}
        </div>
      </div>
    )}
  </Draggable>
);

const ProjectBoard = ({ projectId, tasks, setTasks, canManage, project }) => {
  const { addToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;

    const newStatus = destination.droppableId;
    const previousTasks = tasks;

    // Optimistic update
    setTasks(prev => prev.map(t => t._id === draggableId ? { ...t, status: newStatus } : t));

    try {
      await api.put(`/tasks/${draggableId}`, { status: newStatus });
    } catch (err) {
      // Rollback on failure
      setTasks(previousTasks);
      addToast({ type: 'error', message: 'Failed to update task status. Please try again.' });
    }
  };

  const tasksByStatus = (status) => tasks.filter(t => t.status === status);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{tasks.length} tasks in this project</p>
        {canManage && (
          <button onClick={() => setShowCreate(true)} className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" /> Add Task
          </button>
        )}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map(col => {
            const colTasks = tasksByStatus(col.id);
            return (
              <div key={col.id} className="flex-shrink-0 w-72 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`h-2 w-2 rounded-full ${col.dotColor}`}></span>
                  <h3 className="text-sm font-semibold text-slate-700">{col.label}</h3>
                  <span className="ml-auto text-xs font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {colTasks.length}
                  </span>
                </div>
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 min-h-[120px] space-y-2 p-2 rounded-md transition-colors ${
                        snapshot.isDraggingOver ? 'bg-brand-50 border border-brand-200 border-dashed' : 'bg-slate-50 border border-slate-200'
                      }`}
                    >
                      {colTasks.map((task, index) => (
                        <TaskCard key={task._id} task={task} index={index} onClick={setSelectedTaskId} />
                      ))}
                      {provided.placeholder}
                      {colTasks.length === 0 && !snapshot.isDraggingOver && (
                        <p className="text-xs text-slate-400 text-center py-6">Drop here</p>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {showCreate && (
        <CreateTaskModal
          projectId={projectId}
          project={project}
          onClose={() => setShowCreate(false)}
          onCreated={(newTask) => {
            setTasks(prev => [newTask, ...prev]);
            setShowCreate(false);
          }}
        />
      )}
      
      {selectedTaskId && (
        <TaskDetailsModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={(updatedTask) => {
            setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
          }}
        />
      )}
    </div>
  );
};

export default ProjectBoard;
