import { useState } from 'react';
import { FiEye, FiEyeOff, FiAlertTriangle } from 'react-icons/fi';

const PasswordInput = ({
  label,
  error,
  className = '',
  onBlur: externalOnBlur,
  onFocus: externalOnFocus,
  onKeyDown: externalOnKeyDown,
  ...rest
}) => {
  const [show, setShow] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleKeyDown = (e) => {
    setCapsLock(e.getModifierState('CapsLock'));
    externalOnKeyDown?.(e);
  };

  const handleFocus = (e) => {
    setFocused(true);
    externalOnFocus?.(e);
  };

  const handleBlur = (e) => {
    setFocused(false);
    setCapsLock(false);
    externalOnBlur?.(e);
  };

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      )}
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          className={`input-field pr-10 ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none"
        >
          {show ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
        </button>
      </div>
      {focused && capsLock && (
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <FiAlertTriangle className="w-3 h-3 flex-shrink-0" />
          Caps Lock is ON
        </p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default PasswordInput;
