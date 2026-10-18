import React from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import EmptyState from './EmptyState';

const DataTable = ({
  columns,
  data,
  page = 1,
  totalPages = 1,
  onPageChange,
  searchPlaceholder = 'Search records...',
  searchValue = '',
  onSearchChange,
  isLoading = false,
  emptyMessage = 'No records found matching criteria.',
}) => {
  return (
    <div className="glass-card rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Search Header */}
      {onSearchChange && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition text-slate-900 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/80 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              {columns.map((col, index) => (
                <th key={index} className="px-5 py-3.5">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-8 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : !data || data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-8">
                  <EmptyState message={emptyMessage} />
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={row._id || rowIndex}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-5 py-3.5 whitespace-nowrap">
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && onPageChange && (
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Page <strong className="text-slate-900 dark:text-white">{page}</strong> of{' '}
            <strong className="text-slate-900 dark:text-white">{totalPages}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-750 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-750 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
