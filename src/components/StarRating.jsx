import React, { useState } from 'react';

/**
 * StarRating Component
 * Can be interactive (rating picker) or read-only (displaying reviews).
 */
export default function StarRating({
  rating = 5,
  onChange,
  readOnly = false,
  size = 'md', // 'sm' | 'md' | 'lg'
  showScore = false,
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const currentScore = hoverRating || rating;

  const getRatingLabel = (score) => {
    switch (score) {
      case 1:
        return 'Disappointing';
      case 2:
        return 'Needs Work';
      case 3:
        return 'Average';
      case 4:
        return 'Very Good';
      case 5:
        return 'Outstanding!';
      default:
        return '';
    }
  };

  return (
    <div className={`star-rating-container size-${size} ${readOnly ? 'readonly' : 'interactive'}`}>
      <div className="stars-row" role={readOnly ? 'img' : 'radiogroup'} aria-label={`Rating: ${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((starValue) => {
          const isFilled = starValue <= currentScore;

          return (
            <button
              key={starValue}
              type="button"
              className={`star-btn ${isFilled ? 'filled' : 'empty'}`}
              disabled={readOnly}
              onClick={() => !readOnly && onChange && onChange(starValue)}
              onMouseEnter={() => !readOnly && setHoverRating(starValue)}
              onMouseLeave={() => !readOnly && setHoverRating(0)}
              aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
              title={readOnly ? undefined : `${starValue} Stars - ${getRatingLabel(starValue)}`}
            >
              <svg
                viewBox="0 0 24 24"
                fill={isFilled ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={isFilled ? '0' : '2'}
                className="star-svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </button>
          );
        })}
      </div>

      {!readOnly && (
        <span className="rating-label-text">
          {getRatingLabel(currentScore)}
        </span>
      )}

      {readOnly && showScore && (
        <span className="rating-score-num">{Number(rating).toFixed(1)}</span>
      )}
    </div>
  );
}
