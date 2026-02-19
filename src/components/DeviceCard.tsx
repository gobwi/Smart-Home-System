import { Power } from 'lucide-react';
import type { Device } from '@/types/device.types';
import { cn } from '@/utils/cn';

interface DeviceCardProps {
  device: Device;
  onToggle: (deviceId: Device['id'], status: Device['status']) => void;
  isLoading?: boolean;
}

export default function DeviceCard({ device, onToggle, isLoading }: DeviceCardProps) {
  const isOn = device.status === 'on';

  const handleToggle = (): void => {
    const newStatus = isOn ? 'off' : 'on';
    onToggle(device.id, newStatus);
  };

  return (
    <div className="bg-card text-card-foreground rounded-xl border border-border p-6 shadow-lg transition-all hover:shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">{device.name}</h3>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'h-3 w-3 rounded-full transition-colors',
                isOn ? 'bg-green-500' : 'bg-gray-400'
              )}
            />
            <span className="text-sm text-muted-foreground">
              {isOn ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={cn(
            'relative h-14 w-14 rounded-full transition-all duration-300 flex items-center justify-center',
            isOn
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/50'
              : 'bg-muted text-muted-foreground hover:bg-muted/80',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Power className={cn('h-6 w-6 transition-transform', isOn && 'scale-110')} />
        </button>
      </div>
    </div>
  );
}
