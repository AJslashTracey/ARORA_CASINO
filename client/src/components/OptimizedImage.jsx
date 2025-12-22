import { useState, useRef, useEffect } from 'react';

const OptimizedImage = ({ src, alt, className, placeholder, ...props }) => {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-[rgb(var(--fg)/0.1)] animate-pulse flex items-center justify-center">
          {placeholder || <span className="text-2xl">🖼️</span>}
        </div>
      )}
      {inView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
          loading="lazy"
          {...props}
        />
      )}
    </div>
  );
};

export default OptimizedImage;
