
import React, { useEffect, useState } from 'react';
import Logo from './Logo';

interface LaunchScreenProps {
  onComplete: () => void;
}

const LaunchScreen: React.FC<LaunchScreenProps> = ({ onComplete }) => {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Start fade out after 800ms
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 1100);

    // Unmount/Complete after fade finishes (approx 1s total)
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 1500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-slate-50 transition-opacity duration-500 ease-out ${isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <div className="transform scale-125">
        <Logo animate={true} />
      </div>
    </div>
  );
};

export default LaunchScreen;
