
interface CameraStatusProps {
  online: boolean | null;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function CameraStatus({ online, showLabel = true, size = 'md' }: CameraStatusProps) {
  const isOnline = online ?? false;
  
  const sizeClasses = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-3 w-3',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm',
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div
          className={`${sizeClasses[size]} rounded-full ${
            isOnline ? "bg-green-500" : "bg-red-500"
          }`}
        />
        {isOnline && (
          <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-green-500 animate-ping opacity-75`} />
        )}
      </div>
      {showLabel && (
        <span className={`${textSizeClasses[size]} font-medium ${
          isOnline ? "text-green-600" : "text-red-600"
        }`}>
          {isOnline ? "Online" : "Offline"}
        </span>
      )}
    </div>
  );
}
