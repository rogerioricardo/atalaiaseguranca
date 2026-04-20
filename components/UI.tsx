
import React from 'react';
import { X } from 'lucide-react';

export const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-[#080808] border border-atalaia-border rounded-xl shadow-lg ${className}`}>
    {children}
  </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'outline' }> = ({ 
  className = '', 
  variant = 'primary', 
  children, 
  ...props 
}) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 touch-manipulation";
  
  const variants = {
    primary: "bg-atalaia-neon text-black hover:bg-[#33ff85] shadow-[0_0_10px_rgba(0,255,102,0.3)] hover:shadow-[0_0_20px_rgba(0,255,102,0.5)]",
    secondary: "bg-atalaia-accent text-white hover:bg-violet-700 shadow-lg",
    danger: "bg-red-600 text-white hover:bg-red-500 shadow-[0_0_10px_rgba(220,38,38,0.4)]",
    outline: "border border-atalaia-border text-gray-300 hover:border-atalaia-neon hover:text-atalaia-neon bg-transparent"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">{label}</label>}
    <input 
      className={`w-full bg-[#020202] border border-atalaia-border rounded-lg px-4 py-2.5 text-base text-white placeholder-gray-600 focus:outline-none focus:border-atalaia-neon focus:ring-1 focus:ring-atalaia-neon transition-colors ${className}`}
      {...props}
    />
  </div>
);

// Added optional className prop to allow custom styling (e.g. animations) on the Badge component
export const Badge: React.FC<{ children: React.ReactNode, color?: 'green' | 'red' | 'blue' | 'yellow' | 'purple', className?: string }> = ({ children, color = 'green', className = '' }) => {
    const colors = {
        green: "bg-atalaia-neon/10 text-atalaia-neon border-atalaia-neon/20",
        red: "bg-red-500/10 text-red-500 border-red-500/20",
        blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        yellow: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    }
    return (
        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${colors[color]} ${className}`}>
            {children}
        </span>
    )
}

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#050505] border border-atalaia-border rounded-2xl w-full max-w-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white bg-black/50 rounded-full p-1 transition-colors">
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
};
