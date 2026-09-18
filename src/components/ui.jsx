// Badge component for status/priority/role labels
const badgeClasses = {
  // Status
  'To Do': 'bg-slate-100 text-slate-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Review': 'bg-amber-100 text-amber-700',
  'Done': 'bg-green-100 text-green-700',
  'Blocked': 'bg-red-100 text-red-700',
  'On Hold': 'bg-orange-100 text-orange-700',
  'Cancelled': 'bg-slate-100 text-slate-500 line-through',
  // Priority
  'Low': 'bg-slate-100 text-slate-600',
  'Medium': 'bg-blue-100 text-blue-700',
  'High': 'bg-amber-100 text-amber-700',
  'Critical': 'bg-red-100 text-red-700',
  // Project status
  'Planning': 'bg-purple-100 text-purple-700',
  'Active': 'bg-green-100 text-green-700',
  'Archived': 'bg-slate-100 text-slate-600',
  'Completed': 'bg-teal-100 text-teal-700',
};

const priorityDot = {
  'Low': 'bg-slate-400',
  'Medium': 'bg-blue-500',
  'High': 'bg-amber-500',
  'Critical': 'bg-red-500',
};

export const Badge = ({ label, showDot = false }) => {
  const cls = badgeClasses[label] || 'bg-slate-100 text-slate-700';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${priorityDot[label] || 'bg-slate-400'}`}></span>}
      {label}
    </span>
  );
};

export const Avatar = ({ name = '', size = 'md' }) => {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const sizes = { sm: 'h-6 w-6 text-xs', md: 'h-8 w-8 text-sm', lg: 'h-10 w-10 text-base' };
  return (
    <div className={`${sizes[size]} rounded bg-brand-100 text-brand-700 font-semibold flex items-center justify-center flex-shrink-0`}>
      {initials}
    </div>
  );
};

export const EmptyState = ({ icon: Icon, title, message, action }) => (
  <div className="text-center py-16">
    {Icon && <Icon className="mx-auto h-10 w-10 text-slate-300 mb-4" />}
    <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
    <p className="text-sm text-slate-500 mb-4">{message}</p>
    {action}
  </div>
);

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

export const SkeletonRow = () => (
  <div className="flex items-center space-x-4 p-4 border-b border-slate-100">
    <Skeleton className="h-8 w-8 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);
