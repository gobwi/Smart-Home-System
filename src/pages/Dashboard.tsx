import { useEffect, useState } from 'react';
import { Settings, Thermometer, Activity, AirVent, Wind, Lightbulb } from 'lucide-react';
import DeviceCard from '@/components/DeviceCard';
import SensorCard from '@/components/SensorCard';
import { useDeviceStore } from '@/store/deviceStore';
import type { DeviceId, DeviceStatus } from '@/types/device.types';

export default function Dashboard() {
  const { devices, sensors, fetchDevices, fetchSensors, toggleDevice } = useDeviceStore();
  const [isToggling, setIsToggling] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchDevices();
    fetchSensors();

    // Refresh sensors periodically
    const interval = setInterval(() => {
      fetchSensors();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchDevices, fetchSensors]);

  const handleToggleDevice = async (deviceId: DeviceId, status: DeviceStatus): Promise<void> => {
    setIsToggling((prev) => ({ ...prev, [deviceId]: true }));
    try {
      await toggleDevice(deviceId, status);
    } catch (error) {
      console.error('Failed to toggle device:', error);
      alert('Failed to toggle device. Please try again.');
    } finally {
      setIsToggling((prev) => ({ ...prev, [deviceId]: false }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Smart Home Dashboard</h1>
        <p className="text-muted-foreground">Control your IoT devices and monitor sensors</p>
      </div>

      <div className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="h-6 w-6" />
          <h2 className="text-2xl font-semibold">Device Controls</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {devices.map((device) => {
            const icon =
              device.id === 'ac' ? <AirVent className="h-6 w-6" /> :
                device.id === 'fan' ? <Wind className="h-6 w-6" /> :
                  <Lightbulb className="h-6 w-6" />;
            return (
              <DeviceCard
                key={device.id}
                device={device}
                icon={icon}
                onToggle={handleToggleDevice}
                isLoading={isToggling[device.id]}
              />
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-6">
          <Thermometer className="h-6 w-6" />
          <h2 className="text-2xl font-semibold">Sensor Monitoring</h2>
        </div>
        {sensors.length === 0 ? (
          <div className="flex items-center gap-2 text-muted-foreground p-4 bg-muted rounded-lg">
            <Activity className="h-5 w-5 animate-pulse" />
            <span>Waiting for sensor data from ESP32…</span>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {sensors.map((sensor) => (
              <SensorCard key={sensor.id} sensor={sensor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
