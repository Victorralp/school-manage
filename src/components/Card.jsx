import React from 'react';

const Card = ({
  children,
  title,
  subtitle,
  action,
  footer,
  className = '',
  padding = true,
  hover = false,
  onClick
}) => {
  const baseClasses = 'bg-white rounded-lg shadow-md overflow-hidden';
  const hoverClasses = hover ? 'hover:shadow-lg transition-shadow duration-300 cursor-pointer' : '';
  const paddingClasses = padding ? 'p-6' : '';

  return (
    <div
      className={`${baseClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {(title || subtitle || action) && (
        <div className={`${paddingClasses} ${!padding && children ? 'px-6 pt-6' : ''} border-b border-gray-200`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {title && (
                <h3 className="text-xl font-semibold text-gray-800 mb-1">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600">{subtitle}</p>
              )}
            </div>
            {action && (
              <div className="ml-4 flex-shrink-0">
                {action}
              </div>
            )}
          </div>
        </div>
      )}

      <div className={paddingClasses}>
        {children}
      </div>

      {footer && (
        <div className={`${paddingClasses} ${!padding && 'px-6 pb-6'} bg-gray-50 border-t border-gray-200`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
