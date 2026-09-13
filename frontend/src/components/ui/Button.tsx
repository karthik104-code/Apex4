import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle = "font-semibold rounded-lg transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  const variantStyles = {
    primary: "bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs",
    secondary: "bg-white hover:bg-slate-50 text-[#111827] border border-[#E5E7EB] shadow-xs",
    danger: "bg-[#EF4444] hover:bg-red-600 text-white shadow-xs",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-700",
    glass: "bg-white hover:bg-slate-50 text-[#111827] border border-[#E5E7EB] shadow-xs"
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : children}
    </button>
  );
};
