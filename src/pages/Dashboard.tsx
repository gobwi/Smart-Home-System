import { useEffect } from 'react';
import {
  Thermometer, Droplets, Activity, Wind, Lightbulb,
  Wifi, WifiOff, RefreshCw,
} from 'lucide-react';
import DeviceCard from '@/components/DeviceCard';
import SensorCard from '@/components/SensorCard';
import { useDeviceStore } from '@/store/deviceStore';
import type { DeviceId, DeviceStatus } from '@/types/device.types';

const POLL_INTERVAL_MS = 2000;

export default function Dashboard() {
  const {
    devices, sensors, isLoading,
    lastUpdated, espConnected,
    fetchDevices, fetchSensors, toggleDevice,
  } = useDeviceStore();

  useEffect(() => {
    // Initial fetch
    fetchDevices();
    fetchSensors();

    // Poll every 2 s for live data
    const interval = setInterval(() => {
      fetchDevices();
      fetchSensors();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchDevices, fetchSensors]);

  const handleToggle = async (deviceId: DeviceId, status: DeviceStatus) => {
    try {
      await toggleDevice(deviceId, status);
    } catch {
      alert('Failed to toggle device. Check that the backend is running.');
    }
  };

  // ---- Helpers to pick the right icon per sensor ----
  const sensorIcon = (id: string) => {
    if (id === 'temperature') return <Thermometer className="h-5 w-5 text-orange-500" />;
    if (id === 'humidity')    return <Droplets    className="h-5 w-5 text-blue-500" />;
    if (id === 'motion')      return <Activity    className="h-5 w-5 text-green-500" />;
    return <Activity className="h-5 w-5" />;
  };

  const deviceIcon = (id: string) => {
    if (id === 'fan')    return <Wind      className="h-6 w-6" />;
    if (id === 'lights') return <Lightbulb className="h-6 w-6" />;
    return <Activity className="h-6 w-6" />;
  };

  // ---- Motion sensor state for a prominent banner ----
  const motionSensor  = sensors.find((s) => s.id === 'motion');
  const motionActive  = motionSensor?.status === 'detected';

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">

      {/* ---- Header ---- */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-1">Smart Home Dashboard</h1>
          <p className="text-muted-foreground">Real-time control and sensor monitoring</p>
        </div>

        {/* ESP connection status */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border
          ${espConnected
            ? 'bg-green-500/10 text-green-600 border-green-500/30'
            : 'bg-red-500/10 text-red-500 border-red-500/30'
          }`}
        >
          {espConnected
            ? <><Wifi className="h-4 w-4" /> ESP Connected</>
            : <><WifiOff className="h-4 w-4" /> ESP Offline</>
          }
          {lastUpdated && (
            <span className="ml-2 opacity-60">
              <RefreshCw className="h-3 w-3 inline mr-1" />
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* ---- Motion Banner ---- */}
      <div className={`mb-8 rounded-xl border px-6 py-4 flex items-center gap-3 transition-all duration-500
        ${motionActive
          ? 'bg-amber-500/10 border-amber-500/40 text-amber-600'
          : 'bg-muted border-border text-muted-foreground'
        }`}
      >
        <div className={`w-3 h-3 rounded-full flex-shrink-0
          ${motionActive ? 'bg-amber-500 animate-pulse' : 'bg-muted-foreground/40'}`}
        />
        <span className="font-medium">
          {motionActive
            ? 'Motion detected — devices will stay on for 10 seconds'
            : 'No motion detected'}
        </span>
      </div>

      {/* ---- Sensor Cards ---- */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Thermometer className="h-6 w-6" />
          Sensor Readings
        </h2>

        {sensors.length === 0 ? (
          <div className="flex items-center gap-3 p-6 bg-muted rounded-xl text-muted-foreground">
            <Activity className="h-5 w-5 animate-pulse" />
            <span>Waiting for data from ESP… make sure the sketch is uploaded and the server is running.</span>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sensors.map((sensor) => (
              <div
                key={sensor.id}
                className={`bg-card rounded-xl border p-5 shadow-sm transition-all
                  ${sensor.id === 'motion' && sensor.status === 'detected'
                    ? 'border-amber-500/50 bg-amber-500/5'
                    : 'border-border'
                  }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {sensorIcon(sensor.id)}
                    <span className="text-sm font-medium text-muted-foreground">{sensor.name}</span>
                  </div>
                  {/* Live dot */}
                  <span className={`w-2 h-2 rounded-full
                    ${sensor.status === 'inactive'
                      ? 'bg-muted-foreground/40'
                      : 'bg-green-500 animate-pulse'
                    }`}
                  />
                </div>
                <div className="text-3xl font-bold">
                  {sensor.value}
                  {sensor.unit && (
                    <span className="text-lg font-normal text-muted-foreground ml-1">
                      {sensor.unit}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---- Device Controls ---- */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Wind className="h-6 w-6" />
          Device Controls
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          Devices are controlled automatically by motion and temperature.
          You can also override them manually here.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              icon={deviceIcon(device.id)}
              onToggle={handleToggle}
              isLoading={isLoading}
            />
          ))}
        </div>
      </section>

    </div>
  );
}
