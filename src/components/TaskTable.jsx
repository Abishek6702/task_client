import { useState } from 'react';
import { Plus, CheckCircle2, Clock, Circle, Trash2 } from 'lucide-react';
import { Badge } from './ui';
import { format } from 'date-fns';
import api from '../utils/api';
import { useToast } from './Toast';
import CreateTaskModal from './CreateTaskModal';
import { ConfirmDialog } from './Modal';
import TaskDetailsModal from './TaskDetailsModal';

const STATUS_OPTIONS = ['To Do', 'In Progress', 'Review', 'Done', 'Blocked', 'On Hold'];

const StatusIcon = ({ status }) => {
  if (status === 'Done') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (status === 'In Progress') return <Clock className="h-4 w-4 text-blue-500" />;
  return <Circle className="h-4 w-4 text-slate-300" />;
};

const TaskTable = ({ projectId, tasks, setTasks, canManage, canCreateTask, project, onRefresh }) => {
  const { addToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const handleStatusChange = async (taskId, newStatus) => {
    setUpdatingId(taskId);
    try {
      const res = await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
      addToast({ type: 'success', message: 'Status updated.' });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to update status.' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/tasks/${deleteId}`);
      setTasks(prev => prev.filter(t => t._id !== deleteId));
      addToast({ type: 'success', message: 'Task deleted.' });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to delete task.' });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{tasks.length} tasks</p>
        {canCreateTask && (
          <button onClick={() => setShowCreate(true)} className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" /> Add Task
          </button>
        )}
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-10"></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Task</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Assignee</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</th>
                {canManage && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="px-4 py-12 text-center text-sm text-slate-400">
                    No tasks yet. {canManage ? 'Add your first task to get started.' : ''}
                  </td>
                </tr>
              ) : tasks.map(task => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';
                return (
                  <tr key={task._id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedTaskId(task._id)}>
                    <td className="px-4 py-3">
                      <StatusIcon status={task.status} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-900">{task.title}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{task.taskCode}</p>
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : (task.assignedTo ? [task.assignedTo] : []);
                        if (assignees.length === 0) return <span className="text-xs text-slate-400">Unassigned</span>;
                        return (
                          <div className="flex items-center gap-1.5">
                            <div className="flex -space-x-1.5">
                              {assignees.slice(0, 3).map((a, i) => (
                                <div key={a._id || i} className="h-6 w-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold border-2 border-white" title={`${a.firstName} ${a.lastName}`}>
                                  {a.firstName?.[0]}{a.lastName?.[0]}
                                </div>
                              ))}
                              {assignees.length > 3 && (
                                <div className="h-6 w-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[9px] font-bold border-2 border-white">+{assignees.length - 3}</div>
                              )}
                            </div>
                            <span className="text-sm text-slate-700 truncate max-w-[80px]">
                              {assignees[0].firstName}{assignees.length > 1 ? ` +${assignees.length - 1}` : ''}
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3"><Badge label={task.priority || 'Medium'} showDot /></td>
                    <td className="px-4 py-3">
                      {updatingId === task._id ? (
                        <span className="text-xs text-slate-400">Updating...</span>
                      ) : (
                        <select
                          value={task.status}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleStatusChange(task._id, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                        >
                          {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
                        {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '—'}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(task._id);
                          }} 
                          className="text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <CreateTaskModal
          projectId={projectId}
          project={project}
          onClose={() => setShowCreate(false)}
          onCreated={(newTask) => { setTasks(prev => [newTask, ...prev]); setShowCreate(false); }}
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

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone and will also delete all subtasks."
        loading={deleting}
      />
    </div>
  );
};

export default TaskTable;
