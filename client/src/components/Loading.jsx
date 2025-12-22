// Loading spinner component
export const LoadingSpinner = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-[rgb(var(--fg)/0.2)] border-t-[rgb(var(--fg))] ${sizeClasses[size]}`}></div>
  );
};

// Skeleton loader for game cards
export const GameCardSkeleton = () => (
  <div className="animate-pulse">
    <div className="aspect-video bg-[rgb(var(--fg)/0.1)] rounded-t-lg"></div>
    <div className="p-4 border border-[rgb(var(--fg)/0.1)] rounded-b-lg border-t-0">
      <div className="h-4 bg-[rgb(var(--fg)/0.1)] rounded mb-2"></div>
      <div className="h-3 bg-[rgb(var(--fg)/0.1)] rounded w-2/3"></div>
    </div>
  </div>
);

// Loading overlay
export const LoadingOverlay = ({ children, loading }) => (
  <div className="relative">
    {children}
    {loading && (
      <div className="absolute inset-0 bg-[rgb(var(--bg)/0.8)] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )}
  </div>
);
