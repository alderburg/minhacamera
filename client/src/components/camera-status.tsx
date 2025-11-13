
interface CameraStatusProps {
  status: 'online' | 'offline' | 'error' | 'disabled';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function CameraStatus({ status, showLabel = true, size = 'md' }: CameraStatusProps) {
  const isOnline = status === 'online';
  const isDisabled = status === 'disabled';
  const isError = status === 'error';
  
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

  const getStatusColor = () => {
    if (isDisabled) return 'bg-gray-400';
    if (isError) return 'bg-yellow-500';
    return isOnline ? 'bg-green-500' : 'bg-red-500';
  };

  const getStatusText = () => {
    if (isDisabled) return 'Desativada';
    if (isError) return 'Erro';
    return isOnline ? 'Online' : 'Offline';
  };

  const getTextColor = () => {
    if (isDisabled) return 'text-gray-600';
    if (isError) return 'text-yellow-600';
    return isOnline ? 'text-green-600' : 'text-red-600';
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className={`${sizeClasses[size]} rounded-full ${getStatusColor()}`} />
        {isOnline && (
          <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-green-500 animate-ping opacity-75`} />
        )}
      </div>
      {showLabel && (
        <span className={`${textSizeClasses[size]} font-medium ${getTextColor()}`}>
          {getStatusText()}
        </span>
      )}
    </div>
  );
}
