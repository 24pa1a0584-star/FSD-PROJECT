import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({ message = 'No records available', icon: Icon = Inbox, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-sm mb-4">
        {message}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
