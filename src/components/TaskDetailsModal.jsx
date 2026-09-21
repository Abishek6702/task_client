import { useState, useEffect, useCallback } from 'react';
import {
  X, CheckCircle2, Clock, Circle, MessageSquare, Paperclip,
  Loader2, Send, Trash2, Edit2, Activity, ChevronDown, Plus, UserCircle, Flag,
  Calendar, Hash, AlertTriangle, Copy, Play, Square
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Badge, Avatar, Skeleton } from './ui';
import { useToast } from './Toast';
import Pagination from './Pagination';

const STATUS_OPTIONS = ['To Do', 'In Progress', 'Review', 'Done', 'Blocked', 'On Hold'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];

const PRIORITY_COLORS = {
  Low: 'text-slate-500',
  Medium: 'text-blue-600',
  High: 'text-amber-600',
  Critical: 'text-red-600',
};

const TABS = ['details', 'subtasks', 'comments', 'attachments', 'activity'];

// ── FIELD ROW ──────────────────────────────────────────────────────────────
const FieldRow = ({ label, children }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
    {children}
  </div>
);

// ── INLINE SELECT ──────────────────────────────────────────────────────────
const InlineSelect = ({ value, options, onChange, colorMap }) => (
  <div className="relative inline-block">
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`appearance-none bg-transparent border-none focus:outline-none text-sm font-medium cursor-pointer pr-5 ${colorMap?.[value] || 'text-slate-700'}`}
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
  </div>
);

// ── SUBTASK ROW ────────────────────────────────────────────────────────────
const SubtaskRow = ({ sub, onStatusToggle, canDelete, onDelete }) => (
  <div className="flex items-center gap-3 py-2 px-3 hover:bg-slate-50 rounded-md group">
    <button
      onClick={() => onStatusToggle(sub._id, sub.status === 'Done' ? 'To Do' : 'Done')}
      className="flex-shrink-0"
    >
      {sub.status === 'Done'
        ? <CheckCircle2 className="h-4 w-4 text-green-500" />
        : <Circle className="h-4 w-4 text-slate-300 hover:text-brand-500 transition-colors" />
      }
    </button>
    <div className="flex-1 min-w-0">
      <p className={`text-sm truncate ${sub.status === 'Done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
        {sub.title}
      </p>
    </div>
    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <Badge label={sub.status} />
      {canDelete && (
        <button onClick={() => onDelete(sub._id)} className="text-slate-300 hover:text-red-500 transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  </div>
);

// ── COMMENT ROW ────────────────────────────────────────────────────────────
const CommentRow = ({ comment, currentUserId, currentUserRole, onDelete, onEdit }) => {
  const isOwner = comment.userId?._id === currentUserId;
  const canDelete = isOwner || ['organization_admin', 'project_manager'].includes(currentUserRole);

  return (
    <div className="flex gap-3 group">
      <Avatar name={`${comment.userId?.firstName} ${comment.userId?.lastName}`} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <div className="flex items-center justify-between mb-1.5 gap-2">
            <span className="text-xs font-semibold text-slate-900 truncate">
              {comment.userId?.firstName} {comment.userId?.lastName}
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] text-slate-400">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                {comment.editedAt && ' (edited)'}
              </span>
              <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                {isOwner && (
                  <button onClick={() => onEdit(comment)} className="text-slate-400 hover:text-brand-600 transition-colors">
                    <Edit2 className="h-3 w-3" />
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => onDelete(comment._id)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{comment.message}</p>
        </div>
      </div>
    </div>
  );
};

// ── ACTIVITY ROW ────────────────────────────────────────────────────────────
const ActivityRow = ({ activity }) => (
  <div className="flex gap-3">
    <div className="flex-shrink-0 mt-0.5">
      <Avatar name={activity.userId ? `${activity.userId.firstName} ${activity.userId.lastName}` : 'S'} size="sm" />
    </div>
    <div className="flex-1 min-w-0 pb-4 border-b border-slate-100 last:border-0">
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-semibold text-slate-800">
          {activity.userId ? `${activity.userId.firstName} ${activity.userId.lastName}` : 'System'}
        </span>
        <span className="text-xs text-slate-400">
          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
        </span>
      </div>
      <p className="text-xs text-slate-600 mt-0.5">{activity.action}</p>
    </div>
  </div>
);

// ── MAIN MODAL ──────────────────────────────────────────────────────────────
const TaskDetailsModal = ({ taskId, onClose, onUpdate }) => {
  const { user } = useSelector(state => state.auth);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [commentsPagination, setCommentsPagination] = useState(null);
  const [activityPagination, setActivityPagination] = useState(null);
  const [projectUsers, setProjectUsers] = useState([]);
  const [projectTasks, setProjectTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingComment, setEditingComment] = useState(null); // { _id, message }
  const [mentionUsers, setMentionUsers] = useState([]);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [selectedMentions, setSelectedMentions] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null);
  const [manualMinutes, setManualMinutes] = useState('');
  const [timeNotes, setTimeNotes] = useState('');
  const [timeError, setTimeError] = useState('');

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [creatingSubtask, setCreatingSubtask] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchTaskDetails = useCallback(async () => {
    try {
      // Core fetch: task + subtasks + comments
      const [taskRes, subRes, comRes] = await Promise.all([
        api.get(`/tasks/${taskId}`),
        api.get(`/tasks?parentTaskId=${taskId}&limit=100`),
        api.get(`/comments/task/${taskId}?page=1&limit=20`),
      ]);
      const taskData = taskRes.data.data;
      setTask(taskData);
      try {
        const timeRes = await api.get(`/time-entries/task/${taskId}?limit=100`);
        setTimeEntries(timeRes.data.data);
        setActiveTimer(timeRes.data.data.find(entry => !entry.endTime && entry.userId?._id === user?._id) || null);
      } catch (timeLoadError) { setTimeError(timeLoadError.response?.data?.message || 'Failed to load time entries'); }
      setSubtasks(subRes.data.data);
      setComments(comRes.data.data);
      setCommentsPagination(comRes.data.pagination);

      // Non-critical: activity log
      try {
        const actRes = await api.get(`/activity/task/${taskId}?page=1&limit=20`);
        setActivities(actRes.data.data);
        setActivityPagination(actRes.data.pagination);
      } catch {
        setActivities([]);
      }

      // Load project members for assignee dropdown (exclude inactive)
      if (taskData.projectId?._id) {
        try {
          const [projRes, tasksRes] = await Promise.all([
            api.get(`/projects/${taskData.projectId._id}`),
            api.get(`/tasks?projectId=${taskData.projectId._id}&limit=100`)
          ]);
          const members = projRes.data.data.members || [];
          setProjectUsers(members.filter(m => m.isActive !== false));
          setProjectTasks(tasksRes.data.data.filter(t => t._id !== taskId && t.parentTaskId !== taskId));
        } catch {
          setProjectUsers([]);
          setProjectTasks([]);
        }
      }
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Failed to load task details' });
      // Only close if it's a 403/404 — for other errors keep the modal open
      if (err.response?.status === 403 || err.response?.status === 404) {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => { fetchTaskDetails(); }, [fetchTaskDetails]);

  const fetchCommentsPage = async (page) => {
    const res = await api.get(`/comments/task/${taskId}?page=${page}&limit=20`);
    setComments(res.data.data);
    setCommentsPagination(res.data.pagination);
  };

  const fetchActivityPage = async (page) => {
    const res = await api.get(`/activity/task/${taskId}?page=${page}&limit=20`);
    setActivities(res.data.data);
    setActivityPagination(res.data.pagination);
  };

  const refreshTime = async () => {
    const response = await api.get(`/time-entries/task/${taskId}?limit=100`);
    setTimeEntries(response.data.data);
    setActiveTimer(response.data.data.find(entry => !entry.endTime && String(entry.userId?._id || entry.userId) === String(user?._id)) || null);
  };

  const startTimer = async () => {
    try { await api.post('/time-entries/start', { taskId }); await refreshTime(); } catch (err) { setTimeError(err.response?.data?.message || 'Failed to start timer'); }
  };
  const stopTimer = async () => {
    try { await api.post(`/time-entries/stop/${activeTimer._id}`); await refreshTime(); } catch (err) { setTimeError(err.response?.data?.message || 'Failed to stop timer'); }
  };
  const addManualTime = async () => {
    try { await api.post('/time-entries', { taskId, durationMinutes: Number(manualMinutes), notes: timeNotes }); setManualMinutes(''); setTimeNotes(''); await refreshTime(); } catch (err) { setTimeError(err.response?.data?.message || 'Failed to record time'); }
  };

  // ── UPDATE TASK ───────────────────────────────────────────────────────────
  const handleUpdateTask = async (updates) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, updates);
      setTask(res.data.data);
      if (onUpdate) onUpdate(res.data.data);
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Update failed' });
    }
  };

  const handleDeleteTask = async () => {
    setDeleting(true);
    try {
      await api.delete(`/tasks/${taskId}`);
      addToast({ type: 'success', message: 'Task deleted' });
      if (onUpdate) onUpdate(null); // null signals deletion
      onClose();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Delete failed' });
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleDuplicateTask = async () => {
    try {
      const res = await api.post(`/tasks/${taskId}/duplicate`);
      addToast({ type: 'success', message: 'Task duplicated' });
      if (onUpdate) onUpdate(res.data.data); // Or let the parent decide
      onClose();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Duplicate failed' });
    }
  };

  // ── COMMENTS ──────────────────────────────────────────────────────────────
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await api.post('/comments', { taskId, message: newComment.trim(), mentions: selectedMentions });
      setComments(prev => [...prev, res.data.data]);
      setNewComment('');
      setSelectedMentions([]);
      setMentionQuery(null);
      addToast({ type: 'success', message: 'Comment added' });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to add comment' });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleEditComment = async () => {
    if (!editingComment?.message?.trim()) return;
    try {
      const res = await api.put(`/comments/${editingComment._id}`, { message: editingComment.message });
      setComments(prev => prev.map(c => c._id === editingComment._id ? res.data.data : c));
      setEditingComment(null);
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to update comment' });
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments(prev => prev.filter(c => c._id !== commentId));
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to delete comment' });
    }
  };

  // ── SUBTASKS ──────────────────────────────────────────────────────────────
  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    setCreatingSubtask(true);
    try {
      const res = await api.post('/tasks', {
        title: newSubtaskTitle.trim(),
        projectId: task.projectId._id || task.projectId,
        parentTaskId: taskId,
        status: 'To Do',
        priority: 'Medium',
      });
      setSubtasks(prev => [...prev, res.data.data]);
      setNewSubtaskTitle('');
      // Refresh parent task progress
      const taskRes = await api.get(`/tasks/${taskId}`);
      setTask(taskRes.data.data);
      if (onUpdate) onUpdate(taskRes.data.data);
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Failed to create subtask' });
    } finally {
      setCreatingSubtask(false);
    }
  };

  const handleSubtaskStatusToggle = async (subtaskId, newStatus) => {
    try {
      const res = await api.put(`/tasks/${subtaskId}`, { status: newStatus });
      setSubtasks(prev => prev.map(s => s._id === subtaskId ? res.data.data : s));
      const taskRes = await api.get(`/tasks/${taskId}`);
      setTask(taskRes.data.data);
      if (onUpdate) onUpdate(taskRes.data.data);
    } catch (err) {
      addToast({ type: 'error', message: 'Update failed' });
    }
  };

  const handleSubtaskDelete = async (subtaskId) => {
    try {
      await api.delete(`/tasks/${subtaskId}`);
      setSubtasks(prev => prev.filter(s => s._id !== subtaskId));
    } catch (err) {
      addToast({ type: 'error', message: 'Delete failed' });
    }
  };

  // ── ATTACHMENTS ───────────────────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityId', taskId);
    formData.append('entityType', 'task');
    try {
      addToast({ type: 'info', message: 'Uploading…' });
      await api.post('/uploads', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const taskRes = await api.get(`/tasks/${taskId}`);
      setTask(taskRes.data.data);
      addToast({ type: 'success', message: 'File uploaded' });
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Upload failed' });
    } finally {
      e.target.value = '';
    }
  };

  const handleAttachmentDownload = async (file) => {
    try {
      const response = await api.get(`/uploads/${encodeURIComponent(file.fileName)}`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.originalName || file.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Unable to download attachment' });
    }
  };

  const handleAttachmentDelete = async (file) => {
    try {
      await api.delete(`/uploads/${encodeURIComponent(file.fileName)}`);
      setTask(current => ({ ...current, attachments: (current.attachments || []).filter(item => item.fileName !== file.fileName) }));
      addToast({ type: 'success', message: 'Attachment deleted' });
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Unable to delete attachment' });
    }
  };

  // ── PERMISSION HELPERS ────────────────────────────────────────────────────
  const canManage = task && (
    user?.role === 'organization_admin' ||
    task.projectId?.managerId?.toString() === user?._id ||
    user?.role === 'project_manager'
  );

  const canDelete = user?.role === 'organization_admin' || user?.role === 'project_manager' ||
    (task?.projectId && task.projectId?.managerId?.toString() === user?._id);

  // ── RENDER ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/40 flex justify-end">
        <div className="w-full max-w-2xl bg-white h-full shadow-2xl p-6 flex flex-col gap-4">
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-8 w-2/3 rounded" />
          <Skeleton className="h-40 w-full rounded" />
        </div>
      </div>
    );
  }

  if (!task) return null;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex justify-end animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-slide-left overflow-hidden">

        {/* Header */}
        <div className="flex-shrink-0 border-b border-slate-200 px-5 py-3.5 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2 text-sm text-slate-500 min-w-0">
            <Hash className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="font-mono font-medium">{task.taskCode}</span>
            <span className="text-slate-300">/</span>
            <button
              onClick={() => { navigate(`/projects/${task.projectId?._id || task.projectId}`); onClose(); }}
              className="hover:text-brand-600 truncate transition-colors"
            >
              {task.projectId?.name}
            </button>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {canManage && (
              <button
                onClick={handleDuplicateTask}
                className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
                title="Duplicate task"
              >
                <Copy className="h-4 w-4" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Delete task"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Delete confirmation */}
        {confirmDelete && (
          <div className="flex-shrink-0 bg-red-50 border-b border-red-200 px-5 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>Delete this task and all its subtasks?</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="btn btn-secondary py-1 text-xs">Cancel</button>
              <button onClick={handleDeleteTask} disabled={deleting} className="btn btn-danger py-1 text-xs disabled:opacity-50">
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        )}

        {/* Title */}
        <div className="flex-shrink-0 px-5 pt-4 pb-2">
          <input
            type="text"
            value={task.title}
            onChange={e => setTask({ ...task, title: e.target.value })}
            onBlur={() => handleUpdateTask({ title: task.title })}
            className="text-xl font-bold text-slate-900 w-full border-none focus:outline-none focus:ring-0 p-0 bg-transparent placeholder-slate-300 resize-none leading-tight"
            placeholder="Task title"
          />
          {isOverdue && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 mt-1">
              <AlertTriangle className="h-3 w-3" /> Overdue
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 border-b border-slate-200 px-5">
          <nav className="flex gap-1">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-xs font-medium capitalize border-b-2 -mb-px transition-colors ${
                  activeTab === tab ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
                {tab === 'comments' && comments.length > 0 && (
                  <span className="ml-1 text-[10px] bg-slate-100 text-slate-600 rounded-full px-1.5 py-0.5">{comments.length}</span>
                )}
                {tab === 'subtasks' && subtasks.length > 0 && (
                  <span className="ml-1 text-[10px] bg-slate-100 text-slate-600 rounded-full px-1.5 py-0.5">
                    {subtasks.filter(s => s.status === 'Done').length}/{subtasks.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── DETAILS TAB ── */}
          {activeTab === 'details' && (
            <div className="p-5 space-y-5">
              {/* Field grid */}
              <div className="grid grid-cols-2 gap-4">
                <FieldRow label="Status">
                  <InlineSelect
                    value={task.status}
                    options={STATUS_OPTIONS}
                    onChange={v => handleUpdateTask({ status: v })}
                  />
                </FieldRow>
                <FieldRow label="Priority">
                  <InlineSelect
                    value={task.priority}
                    options={PRIORITY_OPTIONS}
                    onChange={v => handleUpdateTask({ priority: v })}
                    colorMap={PRIORITY_COLORS}
                  />
                </FieldRow>
                <FieldRow label="Assignees">
                  {(() => {
                    const currentAssignees = Array.isArray(task.assignedTo) ? task.assignedTo : (task.assignedTo ? [task.assignedTo] : []);
                    const currentIds = currentAssignees.map(a => a._id || a);
                    const available = projectUsers.filter(m => !currentIds.map(String).includes(String(m._id)));
                    return (
                      <div className="space-y-1.5">
                        {/* Chips */}
                        {currentAssignees.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {currentAssignees.map(a => (
                              <span key={a._id || a} className="inline-flex items-center gap-1 bg-brand-50 border border-brand-200 text-brand-700 rounded-full px-2 py-0.5 text-xs font-medium">
                                <span className="h-3.5 w-3.5 rounded-full bg-brand-200 text-brand-800 flex items-center justify-center text-[8px] font-bold">
                                  {a.firstName?.[0]}{a.lastName?.[0]}
                                </span>
                                {a.firstName} {a.lastName}
                                {canManage && (
                                  <button onClick={() => handleUpdateTask({ assignedTo: currentIds.filter(id => String(id) !== String(a._id || a)) })} className="text-brand-400 hover:text-red-500 ml-0.5">
                                    <X className="h-2.5 w-2.5" />
                                  </button>
                                )}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">Unassigned</span>
                        )}
                        {/* Add dropdown */}
                        {canManage && available.length > 0 && (
                          <select
                            defaultValue=""
                            onChange={e => {
                              if (e.target.value) {
                                handleUpdateTask({ assignedTo: [...currentIds, e.target.value] });
                                e.target.value = '';
                              }
                            }}
                            className="text-xs border border-slate-200 rounded-md px-2 py-1 text-slate-600 focus:outline-none focus:border-brand-400 bg-white cursor-pointer w-full mt-0.5"
                          >
                            <option value="">+ Add assignee…</option>
                            {available.map(m => (
                              <option key={m._id} value={m._id}>{m.firstName} {m.lastName} ({m.role?.replace('_', ' ')})</option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })()}
                </FieldRow>
                <FieldRow label="Reporting To">
                  {canManage ? (
                    <select
                      value={task.reportingTo?._id || task.reportingTo || ''}
                      onChange={e => handleUpdateTask({ reportingTo: e.target.value || null })}
                      className="text-sm text-slate-700 border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:border-brand-400 bg-white cursor-pointer w-full"
                    >
                      <option value="">— None —</option>
                      {projectUsers.map(m => (
                        <option key={m._id} value={m._id}>{m.firstName} {m.lastName} ({m.role?.replace('_', ' ')})</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-sm text-slate-700">
                      {task.reportingTo ? `${task.reportingTo.firstName} ${task.reportingTo.lastName}` : '—'}
                    </span>
                  )}
                </FieldRow>
                <FieldRow label="Created By">
                  <span className="text-sm text-slate-700">
                    {task.createdBy ? `${task.createdBy.firstName} ${task.createdBy.lastName}` : '—'}
                  </span>
                </FieldRow>
                <FieldRow label="Start Date">
                  <input
                    type="date"
                    value={task.startDate ? task.startDate.split('T')[0] : ''}
                    onChange={e => handleUpdateTask({ startDate: e.target.value || null })}
                    className="text-sm text-slate-700 bg-transparent border-none focus:outline-none focus:ring-0 p-0 cursor-pointer"
                  />
                </FieldRow>
                <FieldRow label="Due Date">
                  <input
                    type="date"
                    value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                    onChange={e => handleUpdateTask({ dueDate: e.target.value || null })}
                    className={`text-sm bg-transparent border-none focus:outline-none focus:ring-0 p-0 cursor-pointer ${isOverdue ? 'text-red-600 font-medium' : 'text-slate-700'}`}
                  />
                </FieldRow>
                <FieldRow label="Est. Hours">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={task.estimatedHours || ''}
                    onChange={e => setTask({ ...task, estimatedHours: e.target.value })}
                    onBlur={e => handleUpdateTask({ estimatedHours: parseFloat(e.target.value) || null })}
                    className="text-sm text-slate-700 bg-transparent border-none focus:outline-none w-24 p-0"
                    placeholder="—"
                  />
                </FieldRow>
                <FieldRow label="Actual Hours">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={task.actualHours || ''}
                    readOnly
                    className="text-sm text-slate-700 bg-transparent border-none focus:outline-none w-24 p-0 cursor-not-allowed"
                    placeholder="—"
                  />
                </FieldRow>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Time Tracking</span>
                  {activeTimer ? (
                    <button onClick={stopTimer} className="btn btn-secondary py-1 text-xs"><Square className="h-3 w-3 mr-1" /> Stop timer</button>
                  ) : (
                    <button onClick={startTimer} className="btn btn-primary py-1 text-xs"><Play className="h-3 w-3 mr-1" /> Start timer</button>
                  )}
                </div>
                <div className="flex gap-2">
                  <input type="number" min="1" max="1440" value={manualMinutes} onChange={e => setManualMinutes(e.target.value)} placeholder="Minutes" className="input-field text-sm w-28" />
                  <input value={timeNotes} onChange={e => setTimeNotes(e.target.value)} placeholder="Notes (optional)" className="input-field text-sm flex-1" />
                  <button onClick={addManualTime} disabled={!manualMinutes} className="btn btn-secondary text-xs">Add</button>
                </div>
                {timeError && <p className="text-xs text-red-600">{timeError}</p>}
                <p className="text-xs text-slate-500">Logged: {(timeEntries.filter(entry => entry.durationMinutes).reduce((sum, entry) => sum + entry.durationMinutes, 0) / 60).toFixed(2)} hours</p>
              </div>

              {/* Progress */}
              {(subtasks.length > 0 || task.progress > 0) && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-600">Progress</span>
                    <span className="text-slate-400">{task.progress || 0}%</span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-1.5">
                    <div
                      className="bg-brand-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${task.progress || 0}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Dependencies Section */}
              <div className="border-t border-slate-100 pt-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-slate-400" />
                  Dependencies
                </h3>
                <div className="space-y-2">
                  {(task.dependencies || []).map(depId => {
                    const depTask = projectTasks.find(t => t._id === depId);
                    return (
                      <div key={depId} className="flex items-center justify-between bg-slate-50 border border-slate-100 px-3 py-2 rounded text-sm">
                        <span className="text-slate-700">{depTask ? `${depTask.taskCode}: ${depTask.title}` : 'Unknown Task'}</span>
                        {canManage && (
                          <button 
                            onClick={() => handleUpdateTask({ dependencies: task.dependencies.filter(id => id !== depId) })}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {canManage && (
                    <div className="relative">
                      <select 
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val && !(task.dependencies || []).includes(val)) {
                            handleUpdateTask({ dependencies: [...(task.dependencies || []), val] });
                          }
                          e.target.value = "";
                        }}
                        className="w-full text-sm border border-slate-200 rounded text-slate-600 appearance-none pr-8 cursor-pointer hover:border-slate-300 px-3 py-2 bg-white"
                        defaultValue=""
                      >
                        <option value="" disabled>+ Add dependency...</option>
                        {projectTasks.filter(t => !(task.dependencies || []).includes(t._id)).map(t => (
                          <option key={t._id} value={t._id}>{t.taskCode}: {t.title}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  )}
                  {task.dependentTasks?.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <p className="text-xs font-medium text-slate-500 mb-2">Tasks depending on this task</p>
                      <div className="space-y-1">
                        {task.dependentTasks.map(dependent => (
                          <div key={dependent._id} className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded">
                            {dependent.taskCode}: {dependent.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Description</label>
                <textarea
                  value={task.description || ''}
                  onChange={e => setTask({ ...task, description: e.target.value })}
                  onBlur={() => handleUpdateTask({ description: task.description })}
                  className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 min-h-[100px] resize-y placeholder-slate-400"
                  placeholder="Add a description…"
                />
              </div>
            </div>
          )}

          {/* ── SUBTASKS TAB ── */}
          {activeTab === 'subtasks' && (
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">
                  {subtasks.filter(s => s.status === 'Done').length} of {subtasks.length} completed
                </p>
              </div>

              {subtasks.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No subtasks yet</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {subtasks.map(sub => (
                    <SubtaskRow
                      key={sub._id}
                      sub={sub}
                      onStatusToggle={handleSubtaskStatusToggle}
                      canDelete={canManage}
                      onDelete={handleSubtaskDelete}
                    />
                  ))}
                </div>
              )}

              <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={e => setNewSubtaskTitle(e.target.value)}
                  placeholder="Add a subtask…"
                  className="input-field flex-1 text-sm"
                />
                <button
                  type="submit"
                  disabled={!newSubtaskTitle.trim() || creatingSubtask}
                  className="btn btn-primary py-1.5 text-xs disabled:opacity-50"
                >
                  {creatingSubtask ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                </button>
              </form>
            </div>
          )}

          {/* ── COMMENTS TAB ── */}
          {activeTab === 'comments' && (
            <div className="p-5 space-y-4">
              {comments.length === 0 && (
                <div className="text-center py-10 text-slate-400">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No comments yet</p>
                </div>
              )}
              {comments.map(comment => (
                <CommentRow
                  key={comment._id}
                  comment={comment}
                  currentUserId={user?._id}
                  currentUserRole={user?.role}
                  onDelete={handleDeleteComment}
                  onEdit={c => setEditingComment({ _id: c._id, message: c.message })}
                />
              ))}
              <Pagination page={commentsPagination?.page || 1} totalPages={commentsPagination?.totalPages || commentsPagination?.pages} onPageChange={fetchCommentsPage} />

              {/* Edit comment inline */}
              {editingComment && (
                <div className="border border-brand-200 rounded-lg p-3 bg-brand-50 space-y-2">
                  <p className="text-xs font-medium text-brand-700">Editing comment</p>
                  <textarea
                    value={editingComment.message}
                    onChange={e => setEditingComment({ ...editingComment, message: e.target.value })}
                    className="input-field min-h-[80px] resize-y text-sm"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleEditComment} className="btn btn-primary py-1 text-xs">Save</button>
                    <button onClick={() => setEditingComment(null)} className="btn btn-secondary py-1 text-xs">Cancel</button>
                  </div>
                </div>
              )}

              {/* Add comment */}
              <form onSubmit={handleAddComment} className="flex items-start gap-3 mt-2">
                <Avatar name={`${user?.firstName} ${user?.lastName}`} size="sm" />
                <div className="flex-1 relative">
                  <textarea
                    value={newComment}
                    onChange={async e => {
                      const value = e.target.value;
                      setNewComment(value);
                      const match = value.match(/(?:^|\s)@([\w.+-]*)$/);
                      if (!match) { setMentionQuery(null); return; }
                      setMentionQuery(match[1]);
                      try {
                        const response = await api.get(`/users/mention-search?taskId=${taskId}&search=${encodeURIComponent(match[1])}`);
                        setMentionUsers(response.data.data);
                      } catch { setMentionUsers([]); }
                    }}
                    onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAddComment(e); }}
                    placeholder="Write a comment… (Ctrl+Enter to submit)"
                    className="input-field pr-12 min-h-[80px] resize-y text-sm"
                  />
                  {mentionQuery !== null && mentionUsers.length > 0 && (
                    <div className="absolute left-0 right-0 bottom-full mb-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 overflow-hidden">
                      {mentionUsers.map(mentionUser => (
                        <button
                          key={mentionUser._id}
                          type="button"
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                          onClick={() => {
                            const replacement = newComment.replace(/(?:^|\s)@[\w.+-]*$/, match => `${match.slice(0, -match.trim().length)}@${mentionUser.email} `);
                            setNewComment(replacement);
                            setSelectedMentions(prev => prev.includes(mentionUser._id) ? prev : [...prev, mentionUser._id]);
                            setMentionQuery(null);
                          }}
                        >
                          {mentionUser.firstName} {mentionUser.lastName} <span className="text-xs text-slate-400">@{mentionUser.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submittingComment}
                    className="absolute bottom-2 right-2 p-1.5 bg-brand-600 text-white rounded hover:bg-brand-700 disabled:opacity-40 transition-colors"
                  >
                    {submittingComment ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── ATTACHMENTS TAB ── */}
          {activeTab === 'attachments' && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-700">Attachments ({task.attachments?.length || 0})</h3>
                <label className="btn btn-secondary text-xs py-1.5 cursor-pointer">
                  <Paperclip className="h-3.5 w-3.5 mr-1.5" />
                  Upload File
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>

              {task.attachments && task.attachments.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {task.attachments.map((file, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleAttachmentDownload(file)}
                      className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 bg-white hover:border-brand-300 hover:shadow-sm transition-all"
                    >
                      <Paperclip className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate">{file.originalName}</p>
                        {file.size && (
                          <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                        )}
                      </div>
                      {(canDelete || file.uploadedBy?.toString() === user?._id) && (
                        <span role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); handleAttachmentDelete(file); }} className="ml-auto text-slate-400 hover:text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No attachments</p>
                  <p className="text-xs mt-1">Upload files to share with your team</p>
                </div>
              )}
            </div>
          )}

          {/* ── ACTIVITY TAB ── */}
          {activeTab === 'activity' && (
            <div className="p-5 space-y-1">
              {activities.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No activity recorded yet</p>
                </div>
              ) : (
                activities.map(a => <ActivityRow key={a._id} activity={a} />)
              )}
              <Pagination page={activityPagination?.page || 1} totalPages={activityPagination?.totalPages || activityPagination?.pages} onPageChange={fetchActivityPage} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;
