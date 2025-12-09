
import React, { useEffect, useRef } from 'react';

interface StarfieldBackgroundProps {
    theme?: 'dark' | 'light';
}

export const StarfieldBackground: React.FC<StarfieldBackgroundProps> = ({ theme = 'dark' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let stars: { x: number; y: number; size: number; speed: number; opacity: number }[] = [];

    const initStars = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      // Density: approx 1 star per 8000px^2
      const starCount = Math.floor((width * height) / 8000);
      
      stars = [];
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.5 + 0.5, // 0.5px to 2px
          speed: Math.random() * 0.4 + 0.1, // Slow drift
          opacity: Math.random() * 0.7 + 0.1,
        });
      }
    };

    const animate = () => {
      if (!canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      stars.forEach(star => {
        // Star Color logic
        // Dark Mode: White (255,255,255)
        // Light Mode: Purple (168, 85, 247) -> Tailwind Purple-500
        const baseColor = theme === 'dark' ? '255, 255, 255' : '168, 85, 247';
        
        ctx.fillStyle = `rgba(${baseColor}, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Move star (upwards)
        star.y -= star.speed;

        // Reset if out of bounds
        if (star.y < 0) {
          star.y = canvas.height;
          star.x = Math.random() * canvas.width;
        }
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
        initStars();
    };

    window.addEventListener('resize', handleResize);
    initStars();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]); // Re-init when theme changes

  return (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-nexus-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px]" />
    </div>
  );
};
