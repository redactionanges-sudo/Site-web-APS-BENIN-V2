import React from 'react';
import { SocialPlatformId } from '@/lib/social';

interface SocialPlatformIconProps {
  platform: SocialPlatformId | string;
  size?: number;
  className?: string;
  disabled?: boolean;
}

export function SocialPlatformIcon({
  platform,
  size = 22,
  className = '',
  disabled = false,
}: SocialPlatformIconProps) {
  const normalizedId = platform.toLowerCase().trim();

  const iconElement = (() => {
    switch (normalizedId) {
      case 'facebook':
        return (
          <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
            aria-hidden="true"
          >
            <path
              fill="#1877F2"
              d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
            />
          </svg>
        );

      case 'twitter':
      case 'x':
        return (
          <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
            aria-hidden="true"
          >
            <rect width="24" height="24" rx="5" fill="#000000" />
            <path
              fill="#FFFFFF"
              d="M17.2 5.5h1.9l-4.15 4.75 4.88 6.45h-3.82l-3-3.92-3.42 3.92H7.68l4.44-5.08L7.4 5.5h3.92l2.71 3.58zm-.67 10.07h1.05L10.3 6.64H9.17z"
            />
          </svg>
        );

      case 'linkedin':
        return (
          <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
            aria-hidden="true"
          >
            <rect width="24" height="24" rx="5" fill="#0A66C2" />
            <path
              fill="#FFFFFF"
              d="M6.94 5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM5.5 9.5h2.88V19H5.5V9.5zm4.69 0h2.76v1.3h.04c.38-.73 1.33-1.5 2.73-1.5 2.92 0 3.46 1.92 3.46 4.42V19h-2.88v-4.63c0-1.1-.02-2.52-1.54-2.52-1.54 0-1.78 1.2-1.78 2.44V19H10.19V9.5z"
            />
          </svg>
        );

      case 'instagram':
        return (
          <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
            aria-hidden="true"
          >
            <defs>
              <radialGradient id="igAdminGradient" cx="20%" cy="105%" r="125%">
                <stop offset="0%" stopColor="#fdf497" />
                <stop offset="5%" stopColor="#fdf497" />
                <stop offset="45%" stopColor="#fd5949" />
                <stop offset="60%" stopColor="#d6249f" />
                <stop offset="90%" stopColor="#285AEB" />
              </radialGradient>
            </defs>
            <rect width="24" height="24" rx="5.5" fill="url(#igAdminGradient)" />
            <rect
              x="5"
              y="5"
              width="14"
              height="14"
              rx="4"
              stroke="#FFFFFF"
              strokeWidth="1.6"
              fill="none"
            />
            <circle cx="12" cy="12" r="3.4" stroke="#FFFFFF" strokeWidth="1.6" fill="none" />
            <circle cx="16" cy="8" r="0.85" fill="#FFFFFF" />
          </svg>
        );

      case 'tiktok':
        return (
          <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
            aria-hidden="true"
          >
            <rect width="24" height="24" rx="5" fill="#000000" />
            <g transform="translate(2, 2)">
              <path
                fill="#25F4EE"
                d="M13.8 5.6a3.6 3.6 0 0 0 2.2.7V8.5a5.5 5.5 0 0 1-2.2-.4v4.1a3.8 3.8 0 1 1-3.8-3.8c.25 0 .5.02.75.08v2.1a1.8 1.8 0 1 0 1.05 1.62V3.5h2v2.1z"
                transform="translate(-0.4, 0.3)"
              />
              <path
                fill="#FE2C55"
                d="M13.8 5.6a3.6 3.6 0 0 0 2.2.7V8.5a5.5 5.5 0 0 1-2.2-.4v4.1a3.8 3.8 0 1 1-3.8-3.8c.25 0 .5.02.75.08v2.1a1.8 1.8 0 1 0 1.05 1.62V3.5h2v2.1z"
                transform="translate(0.4, -0.3)"
              />
              <path
                fill="#FFFFFF"
                d="M13.8 5.6a3.6 3.6 0 0 0 2.2.7V8.5a5.5 5.5 0 0 1-2.2-.4v4.1a3.8 3.8 0 1 1-3.8-3.8c.25 0 .5.02.75.08v2.1a1.8 1.8 0 1 0 1.05 1.62V3.5h2v2.1z"
              />
            </g>
          </svg>
        );

      case 'youtube':
        return (
          <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
            aria-hidden="true"
          >
            <rect width="24" height="24" rx="5" fill="#FF0000" />
            <path d="M10 8.5l5.5 3.5-5.5 3.5V8.5z" fill="#FFFFFF" />
          </svg>
        );

      default:
        return (
          <div
            style={{ width: size, height: size }}
            className="rounded bg-gray-200 text-gray-700 font-bold text-[10px] flex items-center justify-center shrink-0 uppercase"
          >
            {normalizedId.slice(0, 2)}
          </div>
        );
    }
  })();

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 transition-opacity ${
        disabled ? 'opacity-70' : 'opacity-100'
      } ${className}`}
    >
      {iconElement}
    </div>
  );
}
