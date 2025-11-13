interface CameraStatusProps {
  online: boolean | null;
  showLabel?: boolean;
}

export function CameraStatus({ online, showLabel = true }: CameraStatusProps) {
  const isOnline = online ?? false;
  
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div
          className={`h-2 w-2 rounded-full ${
            isOnline ? "bg-green-500" : "bg-red-500"
          }`}
        />
        {isOnline && (
          <div className="absolute inset-0 h-2 w-2 rounded-full bg-green-500 animate-ping opacity-75" />
        )}
      </div>
      {showLabel && (
        <span className={`text-xs font-medium ${
          isOnline ? "text-green-600" : "text-red-600"
        }`}>
          {isOnline ? "Online" : "Offline"}
        </span>
      )}
    </div>
  );
}
