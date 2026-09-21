import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Calendar, AlertCircle, CheckCircle2, X } from 'lucide-react';
import api from '../utils/api';
import { Avatar, Badge } from '../components/ui';
import { useToast } from '../components/Toast';
import TaskDetailsModal from '../components/TaskDetailsModal';

const COLUMNS = [
  { id: 'To Do',      label: 'To Do',        color: 'bg-slate-200 text-slate-700',   dot: 'bg-slate-400' },
  { id: 'In Progress',label: 'In Progress',  color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  { id: 'Review',     label: 'Review',       color: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500' },
  { id: 'Blocked',    label: 'Blocked',      color: 'bg-red-100 text-red-700',       dot: 'bg-red-500' },
  { id: 'Done',       label: 'Done',         color: 'bg-emerald-100 text-emerald-700',dot:'bg-emerald-500' },
];

const PRIORITY_STYLES = {
  Critical: 'bg-red-50 text-red-600 border-red-200',
  High:     'bg-orange-50 text-orange-600 border-orange-200',
  Medium:   'bg-amber-50 text-amber-600 border-amber-200',
  Low:      'bg-slate-50 text-slate-500 border-slate-200',
};

const QuickAddCard = ({ columnId, projectId, members, onAdded, onCancel, isEmployee }) => {
  const [title, setTitle] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const taskCode = `TASK-${Date.now().toString(36).toUpperCase()}`;
      const body = { title: title.trim(), projectId, status: columnId, taskCode, priority: 'Medium' };
      if (assignedTo) body.assignedTo = assignedTo;
      const res = await api.post('/tasks', body);
      addToast({ type: 'success', message: 'Task created.' });
      onAdded(res.data.data);
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Failed to create task.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-brand-300 shadow-sm p-3 space-y-2">
      <input
        autoFocus
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onCancel(); }}
        placeholder="Task title..."
        className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-brand-500"
      />
      {members.length > 0 && !isEmployee && (
        <select
          value={assignedTo}
          onChange={e => setAssignedTo(e.target.value)}
          className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-brand-500"
        >
          <option value="">Unassigned</option>
          {members.map(m => (
            <option key={m._id} value={m._id}>{m.firstName} {m.lastName}</option>
          ))}
        </select>
      )}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!title.trim() || saving}
          className="btn btn-primary py-1 text-xs flex-1 disabled:opacity-50"
        >
          {saving ? 'Adding…' : 'Add Task'}
        </button>
        <button onClick={onCancel} className="btn btn-secondary py-1 text-xs">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

const TaskCard = ({ task, index, onClick }) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = due && due < today && task.status !== 'Done';
  const isToday = due && due.toDateString() === today.toDateString();

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(task)}
          className={`bg-white rounded-lg border shadow-sm p-3.5 cursor-pointer select-none transition-shadow hover:shadow-md ${
            snapshot.isDragging ? 'shadow-lg rotate-1 border-brand-300 ring-1 ring-brand-300' : 'border-slate-200 hover:border-brand-200'
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-[10px] font-mono text-slate-400">{task.taskCode}</span>
            <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.Medium}`}>
              {task.priority}
            </span>
          </div>

          <p className="text-sm font-medium text-slate-900 leading-snug mb-3">{task.title}</p>

          {task.progress > 0 && task.progress < 100 && (
            <div className="mb-3">
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-1 bg-brand-500 rounded-full transition-all" style={{ width: `${task.progress}%` }} />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 text-right">{task.progress}%</p>
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            {(() => {
              const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : (task.assignedTo ? [task.assignedTo] : []);
              return assignees.length > 0 ? (
                <div className="flex -space-x-1.5">
                  {assignees.slice(0, 3).map((a, i) => (
                    <Avatar key={a._id || i} name={`${a.firstName} ${a.lastName}`} size="sm" />
                  ))}
                  {assignees.length > 3 && (
                    <div className="h-6 w-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[9px] font-bold">
                      +{assignees.length - 3}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-6 w-6 rounded-full border border-dashed border-slate-300 flex items-center justify-center">
                  <span className="text-[10px] text-slate-400">?</span>
                </div>
              );
            })()}

            {due && (
              <div className={`flex items-center gap-1 text-[11px] font-medium ${
                isOverdue ? 'text-red-600' : isToday ? 'text-amber-600' : 'text-slate-400'
              }`}>
                {isOverdue ? <AlertCircle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                {due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            )}

            {task.status === 'Done' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
          </div>
        </div>
      )}
    </Draggable>
  );
};

const ProjectBoard = ({ projectId: propProjectId, projectData, canCreateTask }) => {
  const { id: paramId } = useParams();
  const id = propProjectId || paramId;
  const { user } = useSelector(state => state.auth);
  const { addToast } = useToast();
  const isEmployee = user?.role === 'employee';

  const [project, setProject] = useState(projectData || null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(!projectData);
  const [addingTo, setAddingTo] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const requests = [api.get(`/tasks?projectId=${id}`)];
      if (!projectData) requests.unshift(api.get(`/projects/${id}`));
      const results = await Promise.all(requests);
      if (!projectData) setProject(results[0].data.data);
      setTasks((projectData ? results[0] : results[1]).data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, projectData]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getColumnTasks = (status) => tasks.filter(t => t.status === status);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    const taskId = draggableId;

    // Optimistic update
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));

    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to update task status.' });
      // Revert
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: source.droppableId } : t));
    }
  };

  const handleTaskAdded = (newTask) => {
    setTasks(prev => [newTask, ...prev]);
    setAddingTo(null);
  };

  const handleTaskUpdated = (updatedTask) => {
    if (updatedTask === null) {
      fetchData();
    } else {
      setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
    }
    setSelectedTaskId(null);
  };

  const members = project?.members || [];

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => (
          <div key={col.id} className="flex-shrink-0 w-72 bg-slate-100 rounded-xl h-64 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!project && !projectData) {
    return <div className="text-center text-slate-400 py-20">Project not found.</div>;
  }

  const isStandalone = !propProjectId; // rendered as its own route

  return (
    <div className={isStandalone ? 'space-y-6' : ''}>
      {isStandalone && (
        <div>
          <nav className="flex items-center gap-2 text-sm mb-4">
            <Link to="/projects" className="text-slate-500 hover:text-slate-700">Projects</Link>
            <span className="text-slate-300">/</span>
            <Link to={`/projects/${id}`} className="text-slate-500 hover:text-slate-700">{project?.name}</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-medium">Board</span>
          </nav>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">{project?.name} — Board</h1>
              <p className="text-sm text-slate-500 mt-0.5">{tasks.length} tasks</p>
            </div>
          </div>
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
          {COLUMNS.map(col => {
            const colTasks = getColumnTasks(col.id);
            return (
              <div key={col.id} className="flex-shrink-0 w-72 flex flex-col">
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                    <span className="text-sm font-semibold text-slate-700">{col.label}</span>
                    <span className="text-xs font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                      {colTasks.length}
                    </span>
                  </div>
                  {canCreateTask !== false && (
                    <button
                      onClick={() => setAddingTo(col.id)}
                      className="text-slate-400 hover:text-brand-600 transition-colors"
                      title={`Add to ${col.label}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Droppable area */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 space-y-2.5 p-2 rounded-xl min-h-[200px] transition-colors ${
                        snapshot.isDraggingOver ? 'bg-brand-50 border-2 border-dashed border-brand-300' : 'bg-slate-50 border-2 border-transparent'
                      }`}
                    >
                      {addingTo === col.id && (
                        <QuickAddCard
                          columnId={col.id}
                          projectId={id}
                          members={members}
                          isEmployee={isEmployee}
                          onAdded={handleTaskAdded}
                          onCancel={() => setAddingTo(null)}
                        />
                      )}
                      {colTasks.map((task, index) => (
                        <TaskCard
                          key={task._id}
                          task={task}
                          index={index}
                          onClick={(t) => setSelectedTaskId(t._id)}
                        />
                      ))}
                      {provided.placeholder}
                      {colTasks.length === 0 && addingTo !== col.id && (
                        <div className="text-center text-xs text-slate-400 py-6">
                          Drop tasks here
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {selectedTaskId && (
        <TaskDetailsModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={handleTaskUpdated}
        />
      )}
    </div>
  );
};

export default ProjectBoard;
