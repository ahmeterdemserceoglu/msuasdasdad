import { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/app/lib/utils';

export interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  maxTags?: number;
  className?: string;
}

export default function TagInput({
  value = [],
  onChange,
  placeholder = 'Etiket ekle...',
  label,
  error,
  maxTags = 10,
  className
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !value.includes(trimmedTag) && value.length < maxTags) {
      onChange([...value, trimmedTag]);
      setInputValue('');
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div
        className={cn(
          'min-h-[42px] w-full rounded-md border border-gray-300 dark:border-gray-600',
          'bg-white dark:bg-gray-800',
          'focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent',
          'transition-colors duration-200',
          'p-2',
          error && 'border-red-500 focus-within:ring-red-500',
          className
        )}
      >
        <div className="flex flex-wrap gap-2">
          {value.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {value.length < maxTags && (
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (inputValue) {
                  addTag(inputValue);
                }
              }}
              placeholder={value.length === 0 ? placeholder : ''}
              className="flex-1 min-w-[120px] bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          )}
        </div>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {value.length >= maxTags && (
        <p className="mt-1 text-sm text-gray-500">Maksimum {maxTags} etiket ekleyebilirsiniz</p>
      )}
    </div>
  );
}
