import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiGrid, FiList } from 'react-icons/fi';

interface ViewToggleProps {
  category: string;
}

type ViewMode = 'grid' | 'list';

const ViewToggle: React.FC<ViewToggleProps> = ({ category: _category }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = (searchParams.get('view') as ViewMode) || 'grid';

  const handleViewChange = (viewMode: ViewMode) => {
    const newParams = new URLSearchParams(searchParams);

    if (viewMode === 'grid') {
      newParams.delete('view');
    } else {
      newParams.set('view', viewMode);
    }

    setSearchParams(newParams);
  };

  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      <button
        onClick={() => handleViewChange('grid')}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all
          ${currentView === 'grid'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }
        `}
        title="Grid view"
      >
        <FiGrid className="w-4 h-4" />
        <span className="hidden sm:inline">Grid</span>
      </button>

      <button
        onClick={() => handleViewChange('list')}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all
          ${currentView === 'list'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }
        `}
        title="List view"
      >
        <FiList className="w-4 h-4" />
        <span className="hidden sm:inline">List</span>
      </button>
    </div>
  );
};

export default ViewToggle;