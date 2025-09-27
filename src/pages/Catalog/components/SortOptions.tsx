import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiChevronDown } from 'react-icons/fi';

interface SortOptionsProps {
  category: string;
}

interface SortOption {
  id: string;
  label: string;
  description: string;
}

const sortOptions: SortOption[] = [
  { id: 'popularity', label: 'Popularity', description: 'Most popular first' },
  { id: 'release_date', label: 'Release Date', description: 'Newest first' },
  { id: 'alphabetical', label: 'A-Z', description: 'Alphabetical order' },
  { id: 'duration', label: 'Duration', description: 'Shortest first' },
];

const SortOptions: React.FC<SortOptionsProps> = ({ category: _category }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = React.useState(false);
  const currentSort = searchParams.get('sort') || 'popularity';

  const currentSortOption = sortOptions.find(option => option.id === currentSort) || sortOptions[0];

  const handleSortChange = (sortId: string) => {
    const newParams = new URLSearchParams(searchParams);

    if (sortId === 'popularity') {
      newParams.delete('sort');
    } else {
      newParams.set('sort', sortId);
    }

    // Reset to first page when changing sort
    newParams.delete('page');

    setSearchParams(newParams);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Sort: {currentSortOption.label}
        </span>
        <FiChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full mt-2 left-0 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-20">
            <div className="p-2">
              {sortOptions.map((option) => {
                const isActive = currentSort === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSortChange(option.id)}
                    className={`
                      w-full text-left px-3 py-2 rounded-md transition-colors
                      ${isActive
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }
                    `}
                  >
                    <div className="font-medium text-sm">
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {option.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SortOptions;