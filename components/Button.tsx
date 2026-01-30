import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyles = "font-semibold transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizes = {
    sm: "py-2.5 px-4 text-sm rounded-xl",
    md: "py-3.5 px-6 text-[15px] rounded-xl",
    lg: "py-4 px-8 text-base rounded-2xl"
  };

  const variants = {
    primary: "bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200",
    outline: "border-2 border-primary-500 text-primary-500 hover:bg-primary-50",
    ghost: "text-slate-500 hover:text-slate-900 hover:bg-slate-100",
    danger: "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100",
    accent: "bg-accent-500 text-white hover:bg-accent-600 shadow-lg shadow-accent-500/20"
  };

  return (
    <button
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
