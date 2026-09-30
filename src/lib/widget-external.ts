// Third-party data for the Campus widgets (weather, air quality, exchange rates). All three are free,
// key-less APIs; every call has a short timeout and is cached, and any failure just returns null so a slow or
// down provider can never hold up (or break) the Home page.

const KUNSHAN = { latitude: 31.39, longitude: 120.98 };
const TIMEOUT_MS = 2500;

async function getJson<T>(url: string, revalidateSeconds: number): Promise<T | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), next: { revalidate: revalidateSeconds } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export type WeatherCategory = "clear" | "partly" | "cloudy" | "fog" | "drizzle" | "rain" | "snow" | "showers" | "thunder";

/** WMO weather interpretation codes -> a coarse category we have words and an emoji for. */
export function weatherCategory(code: number): WeatherCategory {
  if (code === 0) return "clear";
  if (code <= 2) return "partly";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return code >= 80 ? "showers" : "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "thunder";
  return "cloudy";
}

export const WEATHER_EMOJI: Record<WeatherCategory, string> = {
  clear: "☀️",
  partly: "⛅",
  cloudy: "☁️",
  fog: "🌫️",
  drizzle: "🌦️",
  rain: "🌧️",
  snow: "❄️",
  showers: "🌦️",
  thunder: "⛈️",
};

export type KunshanWeather = { temp: number; high: number; low: number; category: WeatherCategory };

export async function fetchKunshanWeather(): Promise<KunshanWeather | null> {
  const data = await getJson<{
    current?: { temperature_2m?: number; weather_code?: number };
    daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[] };
  }>(
    `https://api.open-meteo.com/v1/forecast?latitude=${KUNSHAN.latitude}&longitude=${KUNSHAN.longitude}` +
      `&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FShanghai&forecast_days=1`,
    900,
  );
  const temp = data?.current?.temperature_2m;
  const code = data?.current?.weather_code;
  const high = data?.daily?.temperature_2m_max?.[0];
  const low = data?.daily?.temperature_2m_min?.[0];
  if (typeof temp !== "number" || typeof code !== "number" || typeof high !== "number" || typeof low !== "number") return null;
  return { temp: Math.round(temp), high: Math.round(high), low: Math.round(low), category: weatherCategory(code) };
}

export type AirQualityBand = "good" | "moderate" | "sensitive" | "unhealthy" | "veryUnhealthy" | "hazardous";

/** US EPA AQI breakpoints. */
export function aqiBand(aqi: number): AirQualityBand {
  if (aqi <= 50) return "good";
  if (aqi <= 100) return "moderate";
  if (aqi <= 150) return "sensitive";
  if (aqi <= 200) return "unhealthy";
  if (aqi <= 300) return "veryUnhealthy";
  return "hazardous";
}

export type KunshanAirQuality = { aqi: number; pm25: number | null; band: AirQualityBand };

export async function fetchKunshanAirQuality(): Promise<KunshanAirQuality | null> {
  const data = await getJson<{ current?: { us_aqi?: number; pm2_5?: number } }>(
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${KUNSHAN.latitude}&longitude=${KUNSHAN.longitude}` +
      `&current=us_aqi,pm2_5&timezone=Asia%2FShanghai`,
    900,
  );
  const aqi = data?.current?.us_aqi;
  if (typeof aqi !== "number") return null;
  const pm25 = data?.current?.pm2_5;
  return { aqi: Math.round(aqi), pm25: typeof pm25 === "number" ? Math.round(pm25) : null, band: aqiBand(aqi) };
}

/** Currencies offered in the converter's config. CNY is always the "from" side. */
export const CONVERTER_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "KRW", "CAD", "AUD", "SGD", "HKD", "INR", "THB", "MYR", "CHF", "NZD", "VND", "IDR"] as const;

/** Units of each currency per 1 CNY. */
export async function fetchCnyRates(): Promise<Record<string, number> | null> {
  const data = await getJson<{ result?: string; rates?: Record<string, number> }>("https://open.er-api.com/v6/latest/CNY", 3600);
  if (!data?.rates || data.result === "error") return null;
  const rates: Record<string, number> = {};
  for (const code of CONVERTER_CURRENCIES) {
    const rate = data.rates[code];
    if (typeof rate === "number" && rate > 0) rates[code] = rate;
  }
  return Object.keys(rates).length ? rates : null;
}
