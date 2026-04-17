import React from 'react';
import './InputField.css';

export const InputField = React.forwardRef(({ label, error, ...rest }, ref) => {
  return (
    <div className="input-group">
      <input 
        className="input-field" 
        ref={ref} 
        {...rest} 
        placeholder=" "
      />
      <label className="input-label">{label}</label>
      {error && <span className="error-text">{error.message}</span>}
    </div>
  );
});

InputField.displayName = "InputField";
