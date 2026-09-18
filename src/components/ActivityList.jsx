import { useState, useEffect } from 'react';
import { Activity, Circle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../utils/api';
import { Skeleton, Avatar, Badge } from './ui';

const renderActionText = (action) => {
  if (!action.includes('→')) return <p className="text-sm text-slate-600">{action}</p>;

  // Parse rich action: "status: To Do → Done, priority: Medium → High"
  const changes = action.split(', ').map(change => {
    const [field, values] = change.split(': ');
    if (!values || !values.includes('→')) return change;
    const [from, to] = values.split(' → ');
    return (
      <div key={field} className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded px-2 py-1 w-fit">
        <span className="font-medium text-slate-500 capitalize">{field}:</span>
        <span className="line-through text-slate-400">{from}</span>
        <span>→</span>
        <span className="font-semibold text-slate-700">{to}</span>
      </div>
    );
  });

  return (
    <div className="flex flex-col gap-1.5 mt-1">
      <span className="text-sm text-slate-500">Updated fields:</span>
      <div className="flex flex-wrap gap-2">
        {changes}
      </div>
    </div>
  );
};

const ActivityList = ({ entityType, entityId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await api.get(`/activities/${entityType}/${entityId}`);
        setActivities(res.data.data);
      } catch (err) {
        console.error('Failed to load activities', err);
      } finally {
        setLoading(false);
      }
    };
    if (entityId) fetchActivities();
  }, [entityType, entityId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="h-8 w-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-900">No activity yet</p>
        <p className="text-sm text-slate-500 mt-1">Actions taken will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
      {activities.map((activity, index) => (
        <div key={activity._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
            {activity.userId ? (
              <Avatar name={`${activity.userId.firstName} ${activity.userId.lastName}`} size="sm" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
          </div>
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] card p-4 ml-4 md:ml-0 shadow-sm border border-slate-100 group-hover:border-slate-200 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-900">
                {activity.userId ? `${activity.userId.firstName} ${activity.userId.lastName}` : 'System'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
              </span>
            </div>
            {renderActionText(activity.action)}
            {activity.details && (
              <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                {activity.details}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityList;
