
import React from 'react';

type BadgeStatus = 'gray' | 'black' | 'blue' | 'gold';

interface VerifiedBadgeProps {
  status: BadgeStatus;
  size?: number;
  className?: string;
}

const COLORS: Record<BadgeStatus, { fill: string; inner: string }> = {
  gray: { fill: '#9ca3af', inner: '#6b7280' },
  black: { fill: '#1f2937', inner: '#111827' },
  blue: { fill: '#2563eb', inner: '#1d4ed8' },
  gold: { fill: '#d97706', inner: '#b45309' },
};

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ status, size = 22, className = '' }) => {
  const { fill, inner } = COLORS[status];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.18))' }}
    >
      {/* Outer seal / star shape with white border */}
      <path
        d="M12 0l2.35 3.8 4.45-.6-1.1 4.35L21.5 11l-3.8 2.35.6 4.45-4.35-1.1L12 21.5l-2.35-3.8-4.45.6 1.1-4.35L2.5 11l3.8-2.35-.6-4.45 4.35 1.1L12 0z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
        transform="translate(0, 1.25) scale(1)"
      />
      {/* Inner colored seal */}
      <path
        d="M12 1.5l2.1 3.4 3.95-.53-.98 3.88L20 11l-3.4 2.1.53 3.95-3.88-.98L12 20l-2.1-3.4-3.95.53.98-3.88L4 11l3.4-2.1-.53-3.95 3.88.98L12 1.5z"
        fill={fill}
        transform="translate(0, 1.25) scale(1)"
      />
      {/* Checkmark */}
      <path
        d="M8.5 11.5l2.2 2.2 4.8-4.8"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        transform="translate(0, 1.25)"
      />
    </svg>
  );
};

export function getBadgeStatus(
  role: string | null,
  isMember: boolean | null,
  membershipVerified: boolean | null,
): BadgeStatus {
  // Role holders (non-teacher, non-union_officer) get gold
  if (role && !['teacher', 'union_officer'].includes(role)) return 'gold';
  // Verified member
  if (membershipVerified) return 'blue';
  // Member but not verified
  if (isMember) return 'black';
  // Not a member
  return 'gray';
}

export default VerifiedBadge;
