export type DeviceType = "pc" | "phone";

const PHONE_UA_REGEX =
  /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;

export function detectDeviceFromUA(userAgent: string): DeviceType {
  return PHONE_UA_REGEX.test(userAgent) ? "phone" : "pc";
}

export function detectDeviceFromViewport(): DeviceType {
  if (typeof window === "undefined") return "pc";
  return window.innerWidth < 1024 ? "phone" : "pc";
}

export const DEVICE_COOKIE = "device_type";
