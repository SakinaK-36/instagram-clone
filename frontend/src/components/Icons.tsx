import React from 'react';

interface IconProps {
  size?: number;
  filled?: boolean;
  className?: string;
}

const Svg: React.FC<{ size?: number; className?: string; children: React.ReactNode }> = ({
  size = 24,
  className,
  children,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const HomeIcon: React.FC<IconProps> = ({ size, filled, className }) => (
  <Svg size={size} className={className}>
    <path
      d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"
      fill={filled ? 'currentColor' : 'none'}
    />
  </Svg>
);

export const SearchIcon: React.FC<IconProps> = ({ size, className }) => (
  <Svg size={size} className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Svg>
);

export const MessageIcon: React.FC<IconProps> = ({ size, filled, className }) => (
  <Svg size={size} className={className}>
    <path d="M22 3 2 10.5l7.5 3L12.5 21z" fill={filled ? 'currentColor' : 'none'} />
    <path d="m22 3-12.5 10.5" />
  </Svg>
);

export const HeartIcon: React.FC<IconProps> = ({ size, filled, className }) => (
  <Svg size={size} className={className}>
    <path
      d="M12 21s-7.5-4.6-9.6-9.3C.9 8.4 2.7 4.5 6.4 4.5c2.1 0 3.9 1.2 5.6 3.4 1.7-2.2 3.5-3.4 5.6-3.4 3.7 0 5.5 3.9 4 7.2C19.5 16.4 12 21 12 21z"
      fill={filled ? 'currentColor' : 'none'}
    />
  </Svg>
);

export const CommentIcon: React.FC<IconProps> = ({ size, className }) => (
  <Svg size={size} className={className}>
    <path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 20.5l1.4-4.9A8.5 8.5 0 1 1 21 11.5z" />
  </Svg>
);

export const SaveIcon: React.FC<IconProps> = ({ size, filled, className }) => (
  <Svg size={size} className={className}>
    <path d="M6 3h12v18l-6-4.5L6 21z" fill={filled ? 'currentColor' : 'none'} />
  </Svg>
);

export const PlusSquareIcon: React.FC<IconProps> = ({ size, className }) => (
  <Svg size={size} className={className}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <path d="M12 8v8M8 12h8" />
  </Svg>
);

export const MoreIcon: React.FC<IconProps> = ({ size, className }) => (
  <Svg size={size} className={className}>
    <circle cx="5" cy="12" r="1" fill="currentColor" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="19" cy="12" r="1" fill="currentColor" />
  </Svg>
);

export const NotificationIcon: React.FC<{ size?: number }> = ({ size = 26 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export const LogoutIcon: React.FC<IconProps> = ({ size, className }) => (
  <Svg size={size} className={className}>
    <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" />
    <path d="m16 8 4 4-4 4M20 12H9" />
  </Svg>
);

export const CloseIcon: React.FC<IconProps> = ({ size, className }) => (
  <Svg size={size} className={className}>
    <path d="M5 5l14 14M19 5 5 19" />
  </Svg>
);

export const ImageIcon: React.FC<IconProps> = ({ size, className }) => (
  <Svg size={size} className={className}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="9" cy="9" r="1.5" />
    <path d="m21 15-5-5L5 21" />
  </Svg>
);

export const EyeIcon: React.FC<IconProps> = ({ size, className }) => (
  <Svg size={size} className={className}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const EyeOffIcon: React.FC<IconProps> = ({ size, className }) => (
  <Svg size={size} className={className}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </Svg>
);