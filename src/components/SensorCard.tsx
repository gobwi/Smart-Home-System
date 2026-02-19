import { Activity } from 'lucide-react';
import type { Sensor } from '@/types/device.types';
import { cn } from '@/utils/cn';

interface SensorCardProps {
  sensor: Sensor;
}

export default function SensorCard({ sensor }: SensorCardProps) {
  const isActive = sensor.status === 'active' || sensor.status === 'detected';
  const displayValue = sensor.unit ? `${sensor.value}${sensor.unit}` : sensor.value;

  return (
    <div className="bg-card text-card-foreground rounded-xl border border-border p-6 shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">{sensor.name}</h3>
          <div className="flex items-center gap-3">
            <Activity
              className={cn(
                'h-5 w-5 transition-colors',
                isActive ? 'text-green-500' : 'text-gray-400'
              )}
            />
            <div>
              <p className="text-2xl font-bold">{displayValue}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {sensor.status === 'detected' && 'Motion Detected'}
                {sensor.status === 'not_detected' && 'No Motion'}
                {sensor.status === 'active' && 'Active'}
                {sensor.status === 'inactive' && 'Inactive'}
              </p>
            </div>
          </div>
        </div>
        <div
          className={cn(
            'h-3 w-3 rounded-full transition-colors',
            isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
          )}
        />
      </div>
    </div>
  );
}
