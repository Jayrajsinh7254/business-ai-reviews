import React, { useState } from 'react';

/**
 * TagInput Component
 * Allows adding and removing service tags/chips via typing + Enter or clicking "Add".
 */
export default function TagInput({ tags = [], onChange, placeholder = 'e.g. Oil Change, Haircut, Consultation...' }) {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  const handleAddTag = (textToAdd) => {
    const trimmed = (textToAdd || inputValue).trim();
    if (!trimmed) return;

    // Check for duplicate (case-insensitive)
    const exists = tags.some((t) => t.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setInputError(`"${trimmed}" is already in the services list.`);
      return;
    }

    onChange([...tags, trimmed]);
    setInputValue('');
    setInputError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (indexToRemove) => {
    const updated = tags.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  return (
    <div className="tag-input-wrapper">
      <div className="tag-input-row">
        <input
          type="text"
          className="tag-text-input"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (inputError) setInputError('');
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Add a service"
        />
        <button
          type="button"
          className="tag-add-btn"
          onClick={() => handleAddTag()}
          disabled={!inputValue.trim()}
        >
          <span className="btn-icon">+</span> Add
        </button>
      </div>

      {inputError && <div className="tag-error-msg">{inputError}</div>}

      {tags.length > 0 ? (
        <div className="tags-container" aria-label="Services list">
          {tags.map((tag, idx) => (
            <span key={idx} className="tag-chip">
              <span className="tag-name">{tag}</span>
              <button
                type="button"
                className="tag-remove-btn"
                onClick={() => handleRemoveTag(idx)}
                aria-label={`Remove service ${tag}`}
                title={`Remove ${tag}`}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      ) : (
        <div className="tag-empty-hint">
          <span>No services added yet. Add at least 1 service to continue.</span>
        </div>
      )}
    </div>
  );
}
