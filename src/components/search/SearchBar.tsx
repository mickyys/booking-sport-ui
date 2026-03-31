import React from 'react';
import { Search, Filter } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onToggleFilters: () => void;
  showFilters: boolean;
  hasActiveFilters: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
  onToggleFilters,
  showFilters,
  hasActiveFilters,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-4">
      <div className="flex flex-col gap-3">
        {/* Search input (top row) */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900"
          />
        </div>

        {/* Filters button (mobile) */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={onToggleFilters}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-slate-900 font-medium"
          >
            <Filter className="w-5 h-5" />
            Filtros
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
