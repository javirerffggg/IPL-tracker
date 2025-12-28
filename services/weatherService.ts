import { WeatherData } from "../types";

export const fetchWeatherData = async (lat: number, lon: number): Promise<WeatherData | null> => {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=uv_index_max&timezone=auto&forecast_days=1`
    );
    const data = await response.json();
    
    return {
      uvIndex: data.daily.uv_index_max[0],
      temperature: data.current.temperature_2m,
      code: data.current.weather_code
    };
  } catch (error) {
    console.error("Weather Intel Failed", error);
    return null;
  }
};