"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  type DeviceType,
  DEVICE_COOKIE,
  detectDeviceFromViewport,
} from "./detectDevice";

interface DeviceContextValue {
  device: DeviceType;
  setDevice: (device: DeviceType) => void;
}

const DeviceContext = createContext<DeviceContextValue | null>(null);

interface DeviceProviderProps {
  initialDevice: DeviceType;
  children: ReactNode;
}

export function DeviceProvider({ initialDevice, children }: DeviceProviderProps) {
  const [device, setDeviceState] = useState<DeviceType>(initialDevice);

  useEffect(() => {
    const viewportDevice = detectDeviceFromViewport();
    if (viewportDevice !== device) {
      setDeviceState(viewportDevice);
    }

    const handleResize = () => {
      const vd = detectDeviceFromViewport();
      setDeviceState((prev) => (prev !== vd ? vd : prev));
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setDevice = useCallback((d: DeviceType) => {
    setDeviceState(d);
    document.cookie = `${DEVICE_COOKIE}=${d}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Strict`;
  }, []);

  return (
    <DeviceContext.Provider value={{ device, setDevice }}>
      {children}
    </DeviceContext.Provider>
  );
}


export function useDevice(): DeviceContextValue {
  const ctx = useContext(DeviceContext);
  if (!ctx) {
    throw new Error("useDevice must be used inside <DeviceProvider>");
  }
  return ctx;
}
