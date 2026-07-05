import { useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import useDebounce from '../../hooks/useDebounce';
import { useEffect } from 'react';

const SearchBox = ({ onSearch, placeholder = 'Search...', className = '' }) => {
  const [value, setValue] = useState('');
  const debounced = useDebounce(value, 350);

  useEffect(() => { onSearch(debounced); }, [debounced]);

  return (
    <div className={`relative ${className}`}>
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="input-field pl-9 pr-8"
      />
      {value && (
        <button onClick={() => setValue('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          <FiX className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default SearchBox;
