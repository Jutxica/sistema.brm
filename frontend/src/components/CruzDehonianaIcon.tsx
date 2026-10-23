import React from 'react';

interface CruzDehonianaIconProps {
  className?: string;
  size?: number | string;
}

export const CruzDehonianaIcon: React.FC<CruzDehonianaIconProps> = ({
  className = 'w-5 h-5',
  size
}) => {
  return (
    <img
      src="/cruz-dehoniana.png"
      alt="Cruz Dehoniana SCJ"
      className={`object-contain select-none shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
      draggable={false}
    />
  );
};
