import React, { useState, useEffect } from 'react';

interface UserAvatarProps {
  avatar?: string | null;
  photoURL?: string | null;
  alt?: string;
  className?: string;
  fallbackEmoji?: string;
  textClassName?: string;
}

export const isImageUrl = (val?: string | null): boolean => {
  if (!val) return false;
  return /^(https?:\/\/|\/|data:image\/)/i.test(val.trim());
};

export const getAvatarEmoji = (avatar?: string | null, fallback = '🏎️'): string => {
  if (!avatar) return fallback;
  if (isImageUrl(avatar)) return fallback;
  return avatar;
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatar,
  photoURL,
  alt = 'Driver Avatar',
  className = 'w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xl shrink-0 overflow-hidden',
  fallbackEmoji = '🏎️',
  textClassName = '',
}) => {
  const [imgError, setImgError] = useState(false);

  // Determine candidate image URL
  const candidateUrl =
    (photoURL && isImageUrl(photoURL) ? photoURL : null) ||
    (avatar && isImageUrl(avatar) ? avatar : null);

  useEffect(() => {
    setImgError(false);
  }, [candidateUrl]);

  if (candidateUrl && !imgError) {
    return (
      <div className={`${className} shrink-0 overflow-hidden relative`}>
        <img
          src={candidateUrl}
          alt={alt}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const displayEmoji = avatar && !isImageUrl(avatar) ? avatar : fallbackEmoji;

  return (
    <div className={`${className} shrink-0 flex items-center justify-center select-none`}>
      <span className={textClassName}>{displayEmoji}</span>
    </div>
  );
};
