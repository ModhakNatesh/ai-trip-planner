import React from 'react';
import { Cloud, CloudRain, Sun, Snowflake, Wind, Thermometer, Droplets } from 'lucide-react';

const WeatherIcon = ({ condition, className = "w-4 h-4" }) => {
  const iconProps = { className };
  
  switch (condition?.toLowerCase()) {
    case 'sunny':
    case 'clear':
      return <Sun {...iconProps} className={`${className} text-yellow-500`} />;
    case 'cloudy':
    case 'overcast':
      return <Cloud {...iconProps} className={`${className} text-gray-500`} />;
    case 'rainy':
    case 'rain':
      return <CloudRain {...iconProps} className={`${className} text-blue-500`} />;
    case 'snowy':
    case 'snow':
      return <Snowflake {...iconProps} className={`${className} text-blue-200`} />;
    case 'windy':
      return <Wind {...iconProps} className={`${className} text-gray-600`} />;
    default:
      return <Cloud {...iconProps} className={`${className} text-gray-400`} />;
  }
};

const WeatherCard = ({ weatherInfo, isCompact = false }) => {
  // Debug logging to understand the data structure
  console.log('WeatherCard received:', weatherInfo);
  
  if (!weatherInfo) {
    console.log('WeatherCard: No weather info available');
    return null;
  }

  // Handle AI-generated weather info (simpler structure)
  if (typeof weatherInfo.forecast === 'string') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <Thermometer className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Weather Information</span>
        </div>
        <p className="text-sm text-blue-700 mb-2">{weatherInfo.forecast}</p>
        {weatherInfo.packingRecommendations && weatherInfo.packingRecommendations.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-blue-800 mb-1">Packing Recommendations</h4>
            <div className="flex flex-wrap gap-1">
              {weatherInfo.packingRecommendations.map((item, index) => (
                <span
                  key={index}
                  className="inline-block bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded-full"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Handle weather service data structure (detailed forecast array)
  const { forecast, recommendations } = weatherInfo;
  
  // Ensure forecast is an array and has items
  if (!Array.isArray(forecast) || forecast.length === 0) {
    console.log('WeatherCard: Forecast is not an array or is empty:', forecast);
    return null;
  }

  const avgTemp = Math.round(forecast.reduce((sum, day) => sum + (day.temperature || 0), 0) / forecast.length);
  const rainDays = forecast.filter(day => (day.precipitation || 0) > 0).length;

  if (isCompact) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Thermometer className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Weather Forecast</span>
          </div>
          <div className="text-sm text-blue-700">
            {avgTemp}°F avg
            {rainDays > 0 && (
              <span className="ml-2 flex items-center">
                <Droplets className="w-3 h-3 mr-1" />
                {rainDays} rainy {rainDays === 1 ? 'day' : 'days'}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center space-x-2 mb-3">
        <Thermometer className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-blue-800">Weather Forecast</h3>
      </div>
      
      {/* Weather Summary */}
      <div className="bg-white rounded-lg p-3 mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Average Temperature:</span>
            <span className="ml-2 font-medium text-blue-700">{avgTemp}°F</span>
          </div>
          <div>
            <span className="text-gray-600">Rainy Days:</span>
            <span className="ml-2 font-medium text-blue-700">{rainDays}/{forecast.length}</span>
          </div>
        </div>
      </div>

      {/* Daily Forecast */}
      <div className="space-y-2 mb-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Daily Forecast</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {forecast.slice(0, 6).map((day, index) => (
            <div key={index} className="bg-white rounded-lg p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <WeatherIcon condition={day.condition || 'cloudy'} className="w-4 h-4" />
                  <span className="text-xs text-gray-600">Day {index + 1}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-800">{day.temperature || 'N/A'}°F</div>
                  {(day.precipitation || 0) > 0 && (
                    <div className="text-xs text-blue-600">{day.precipitation}% rain</div>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1 capitalize">{day.condition || 'Unknown'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Packing Recommendations */}
      {recommendations && (
        <div className="space-y-3">
          {recommendations.clothing && recommendations.clothing.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-2">Recommended Clothing</h4>
              <div className="flex flex-wrap gap-1">
                {recommendations.clothing.map((item, index) => (
                  <span
                    key={index}
                    className="inline-block bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded-full"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {recommendations.accessories && recommendations.accessories.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-2">Essential Items</h4>
              <div className="flex flex-wrap gap-1">
                {recommendations.accessories.map((item, index) => (
                  <span
                    key={index}
                    className="inline-block bg-green-200 text-green-800 text-xs px-2 py-1 rounded-full"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WeatherCard;