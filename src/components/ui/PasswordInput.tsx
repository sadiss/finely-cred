import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  wrapperClassName?: string;
  toggleClassName?: string;
};

export function PasswordInput({
  className = '',
  wrapperClassName = '',
  toggleClassName = '',
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`relative ${wrapperClassName}`.trim()}>
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={`${className} pr-12`.trim()}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className={
          toggleClassName ||
          'absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/45 hover:text-white/80 hover:bg-white/5 transition-colors touch-manipulation'
        }
        aria-label={visible ? 'Hide password' : 'Show password'}
        title={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
      </button>
    </div>
  );
}
