import React from 'react';
import { useSearchParams } from 'react-router-dom';

interface GenreFilterProps {
  category: string;
}

interface GenreOption {
  id: string;
  label: string;
  query: string;
}

const genreOptions: GenreOption[] = [
  { id: 'all', label: 'All', query: '' },
  { id: 'pop', label: 'Pop', query: 'pop hits' },
  { id: 'hiphop', label: 'Hip-Hop', query: 'hip hop rap' },
  { id: 'rnb', label: 'R&B', query: 'r&b soul' },
  { id: 'electronic', label: 'Electronic', query: 'electronic dance' },
  { id: 'rock', label: 'Rock', query: 'rock alternative' },
  { id: 'country', label: 'Country', query: 'country music' },
  { id: 'jazz', label: 'Jazz', query: 'jazz smooth' },
];

const GenreFilter: React.FC<GenreFilterProps> = ({ category: _category }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentGenre = searchParams.get('genre') || 'all';

  const handleGenreChange = (genreId: string, query: string) => {
    const newParams = new URLSearchParams(searchParams);

    if (genreId === 'all') {
      newParams.delete('genre');
      newParams.delete('search');
    } else {
      newParams.set('genre', genreId);
      newParams.set('search', query);
    }

    // Reset to first page when changing genre
    newParams.delete('page');

    setSearchParams(newParams);
  };

  return (
    <div className="w-full mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Browse by Genre
        </h3>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-3">
        {genreOptions.map((genre) => {
          const isActive = currentGenre === genre.id;
          return (
            <button
              key={genre.id}
              onClick={() => handleGenreChange(genre.id, genre.query)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              {genre.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GenreFilter;