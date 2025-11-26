import React from 'react';
import { Cloud, Sun, CloudRain, CloudSun, Zap, Snowflake } from 'lucide-react';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';
import { Weather } from '../../types';

interface WeatherCardProps {
    weather: Weather | null;
    isLoading: boolean;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ weather, isLoading }) => {
    // This helper function maps OpenWeatherMap icon codes to lucide-react icons
    const getWeatherIcon = (iconCode: string) => {
        const iconMapping = {
            '01': <Sun className="w-12 h-12 text-yellow-400" />,      // clear sky
            '02': <CloudSun className="w-12 h-12 text-yellow-400" />, // few clouds
            '03': <Cloud className="w-12 h-12 text-gray-400" />,      // scattered clouds
            '04': <Cloud className="w-12 h-12 text-gray-500" />,      // broken clouds
            '09': <CloudRain className="w-12 h-12 text-blue-400" />,   // shower rain
            '10': <CloudRain className="w-12 h-12 text-blue-500" />,   // rain
            '11': <Zap className="w-12 h-12 text-yellow-500" />,     // thunderstorm
            '13': <Snowflake className="w-12 h-12 text-blue-200" />,  // snow
            '50': <Cloud className="w-12 h-12 text-gray-400" />,      // mist
        };
        // Use first two chars of icon code, e.g., '01d' -> '01'
        const key = iconCode.slice(0, 2);
        return iconMapping[key] || <Sun className="w-12 h-12" />; // Default to Sun icon
    };

    return (
        <Card>
             <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Live Weather
            </h3>
            {isLoading ? (
                <Skeleton className="h-24 w-full" />
            ) : weather ? (
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{weather.location}</p>
                        <p className="text-4xl font-bold text-gray-900 dark:text-white">
                            {weather.temperature.toFixed(2)}°C
                        </p>
                        <p className="font-semibold text-gray-700 dark:text-gray-300 capitalize">
                            {weather.condition}
                        </p>
                    </div>
                    {getWeatherIcon(weather.icon)}
                </div>
            ) : (
                 <p className="text-sm text-center text-gray-500 py-8">Weather data unavailable.</p>
            )}
        </Card>
    );
};

export default WeatherCard;