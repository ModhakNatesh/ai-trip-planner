// Weather service using OpenWeatherMap free API
import fetch from 'node-fetch';

class WeatherService {
  constructor() {
    // Using OpenWeatherMap free API - completely free up to 1000 calls/day
    this.baseURL = 'https://api.openweathermap.org/data/2.5';
    this.geocodingURL = 'https://api.openweathermap.org/geo/1.0';
    // You can get a free API key from https://openweathermap.org/api
    // For demo purposes, using a demo key - replace with your own
    this.apiKey = process.env.OPENWEATHER_API_KEY || 'demo_key_replace_with_real_one';
  }

  // Get coordinates for a destination
  async getCoordinates(destination) {
    try {
      const url = `${this.geocodingURL}/direct?q=${encodeURIComponent(destination)}&limit=1&appid=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        throw new Error('Location not found');
      }
      
      return {
        lat: data[0].lat,
        lon: data[0].lon,
        country: data[0].country,
        state: data[0].state
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  // Get current weather for a location
  async getCurrentWeather(lat, lon) {
    try {
      const url = `${this.baseURL}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        description: data.weather[0].description,
        main: data.weather[0].main,
        icon: data.weather[0].icon,
        windSpeed: data.wind.speed,
        pressure: data.main.pressure,
        visibility: data.visibility / 1000 // Convert to km
      };
    } catch (error) {
      console.error('Current weather error:', error);
      return null;
    }
  }

  // Get 5-day weather forecast
  async getWeatherForecast(lat, lon) {
    try {
      const url = `${this.baseURL}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Forecast API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Group forecasts by day
      const dailyForecasts = {};
      
      data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toISOString().split('T')[0];
        
        if (!dailyForecasts[date]) {
          dailyForecasts[date] = {
            date,
            temperatures: [],
            conditions: [],
            humidity: [],
            windSpeed: [],
            precipitation: 0
          };
        }
        
        dailyForecasts[date].temperatures.push(item.main.temp);
        dailyForecasts[date].conditions.push({
          main: item.weather[0].main,
          description: item.weather[0].description,
          icon: item.weather[0].icon
        });
        dailyForecasts[date].humidity.push(item.main.humidity);
        dailyForecasts[date].windSpeed.push(item.wind.speed);
        
        // Add precipitation if exists
        if (item.rain && item.rain['3h']) {
          dailyForecasts[date].precipitation += item.rain['3h'];
        }
        if (item.snow && item.snow['3h']) {
          dailyForecasts[date].precipitation += item.snow['3h'];
        }
      });
      
      // Process daily summaries
      return Object.values(dailyForecasts).map(day => ({
        date: day.date,
        maxTemp: Math.round(Math.max(...day.temperatures)),
        minTemp: Math.round(Math.min(...day.temperatures)),
        avgTemp: Math.round(day.temperatures.reduce((a, b) => a + b, 0) / day.temperatures.length),
        condition: this.getMostCommonCondition(day.conditions),
        humidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
        windSpeed: Math.round((day.windSpeed.reduce((a, b) => a + b, 0) / day.windSpeed.length) * 10) / 10,
        precipitation: Math.round(day.precipitation * 10) / 10
      }));
    } catch (error) {
      console.error('Forecast error:', error);
      return [];
    }
  }

  // Get most common weather condition for the day
  getMostCommonCondition(conditions) {
    const conditionCounts = {};
    
    conditions.forEach(condition => {
      const key = condition.main;
      conditionCounts[key] = (conditionCounts[key] || 0) + 1;
    });
    
    const mostCommon = Object.keys(conditionCounts).reduce((a, b) => 
      conditionCounts[a] > conditionCounts[b] ? a : b
    );
    
    const mostCommonCondition = conditions.find(c => c.main === mostCommon);
    
    return {
      main: mostCommon,
      description: mostCommonCondition.description,
      icon: mostCommonCondition.icon
    };
  }

  // Get weather for trip dates
  async getWeatherForTrip(destination, startDate, endDate) {
    try {
      const coordinates = await this.getCoordinates(destination);
      
      if (!coordinates) {
        return {
          success: false,
          error: 'Could not find location coordinates'
        };
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      const today = new Date();
      
      // If trip is more than 5 days away, we can only provide current weather
      const daysUntilTrip = Math.ceil((start - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilTrip > 5) {
        // Get current weather as reference
        const currentWeather = await this.getCurrentWeather(coordinates.lat, coordinates.lon);
        
        return {
          success: true,
          location: {
            destination,
            country: coordinates.country,
            state: coordinates.state
          },
          currentWeather,
          forecast: [],
          recommendations: this.generateWeatherRecommendations(null, currentWeather),
          note: 'Weather forecast is only available for the next 5 days. Current weather provided as reference.'
        };
      }

      // Get 5-day forecast
      const forecast = await this.getWeatherForecast(coordinates.lat, coordinates.lon);
      const currentWeather = await this.getCurrentWeather(coordinates.lat, coordinates.lon);
      
      // Filter forecast for trip dates
      const tripForecast = forecast.filter(day => {
        const forecastDate = new Date(day.date);
        return forecastDate >= start && forecastDate <= end;
      });

      return {
        success: true,
        location: {
          destination,
          country: coordinates.country,
          state: coordinates.state
        },
        currentWeather,
        forecast: tripForecast,
        recommendations: this.generateWeatherRecommendations(tripForecast, currentWeather)
      };
    } catch (error) {
      console.error('Weather service error:', error);
      return {
        success: false,
        error: 'Failed to fetch weather information'
      };
    }
  }

  // Generate weather-based recommendations
  generateWeatherRecommendations(forecast, currentWeather) {
    const recommendations = {
      clothing: [],
      accessories: [],
      activities: [],
      general: []
    };

    // Use forecast if available, otherwise use current weather
    const weatherData = forecast && forecast.length > 0 ? forecast : [currentWeather];
    
    if (!weatherData || weatherData.length === 0) {
      return recommendations;
    }

    // Analyze temperature range
    const temps = weatherData.map(day => forecast ? day.avgTemp : day.temperature);
    const maxTemp = Math.max(...temps);
    const minTemp = Math.min(...temps);

    // Temperature-based clothing recommendations
    if (maxTemp > 30) {
      recommendations.clothing.push("Light, breathable clothing (cotton/linen)");
      recommendations.clothing.push("Shorts and t-shirts");
      recommendations.clothing.push("Sun hat and sunglasses");
      recommendations.accessories.push("High SPF sunscreen");
      recommendations.general.push("Stay hydrated - carry water bottle");
    } else if (maxTemp > 20) {
      recommendations.clothing.push("Light layers - t-shirts and light jacket");
      recommendations.clothing.push("Comfortable pants or jeans");
      if (minTemp < 15) {
        recommendations.clothing.push("Warm sweater for cool evenings");
      } else {
        recommendations.clothing.push("Light sweater for evenings");
      }
    } else if (maxTemp > 10) {
      recommendations.clothing.push("Warm layers - sweaters and jackets");
      recommendations.clothing.push("Long pants and closed shoes");
      recommendations.clothing.push("Light coat or jacket");
    } else if (maxTemp > 0) {
      recommendations.clothing.push("Heavy winter clothing");
      recommendations.clothing.push("Warm coat, gloves, and scarf");
      recommendations.clothing.push("Insulated boots");
      recommendations.accessories.push("Thermal underwear");
    } else {
      recommendations.clothing.push("Arctic-level winter gear");
      recommendations.clothing.push("Heavy winter coat and thermal layers");
      recommendations.clothing.push("Winter boots with good grip");
      recommendations.accessories.push("Face protection and hand warmers");
    }

    // Weather condition-based recommendations
    const conditions = weatherData.map(day => 
      forecast ? day.condition.main : day.main
    );

    if (conditions.includes('Rain') || conditions.includes('Drizzle')) {
      recommendations.accessories.push("Waterproof jacket or raincoat");
      recommendations.accessories.push("Umbrella");
      recommendations.accessories.push("Waterproof shoes");
      recommendations.activities.push("Plan indoor activities as backup");
    }

    if (conditions.includes('Snow')) {
      recommendations.clothing.push("Waterproof winter boots");
      recommendations.accessories.push("Snow gloves and warm socks");
      recommendations.activities.push("Check for snow activities (skiing, snowboarding)");
      recommendations.general.push("Allow extra travel time due to snow");
    }

    if (conditions.includes('Thunderstorm')) {
      recommendations.general.push("Monitor weather alerts");
      recommendations.activities.push("Have indoor backup plans");
      recommendations.accessories.push("Waterproof bag for electronics");
    }

    if (conditions.includes('Clear') || conditions.includes('Clouds')) {
      recommendations.activities.push("Great weather for outdoor sightseeing");
      recommendations.activities.push("Perfect for walking tours");
    }

    // Wind recommendations
    const windSpeeds = weatherData.map(day => 
      forecast ? day.windSpeed : day.windSpeed
    );
    const maxWind = Math.max(...windSpeeds);

    if (maxWind > 10) {
      recommendations.clothing.push("Secure hat or avoid loose accessories");
      recommendations.general.push("Windy conditions expected - secure belongings");
    }

    return recommendations;
  }

  // Fallback weather info when API is not available
  getFallbackWeatherRecommendations(destination) {
    return {
      success: true,
      location: { destination },
      currentWeather: null,
      forecast: [],
      recommendations: {
        clothing: [
          "Pack layers for varying weather conditions",
          "Bring both warm and cool weather clothing",
          "Include a waterproof jacket"
        ],
        accessories: [
          "Umbrella or rain gear",
          "Comfortable walking shoes",
          "Sunscreen and sunglasses"
        ],
        activities: [
          "Check local weather before outdoor activities",
          "Have indoor backup plans"
        ],
        general: [
          "Research typical weather patterns for your destination",
          "Check weather forecast closer to travel date"
        ]
      },
      note: 'Weather service unavailable. General recommendations provided.'
    };
  }
}

// Export singleton instance
const weatherService = new WeatherService();

export { WeatherService };

export const getWeatherForTrip = (destination, startDate, endDate) => {
  return weatherService.getWeatherForTrip(destination, startDate, endDate);
};

export const getCurrentWeather = (lat, lon) => {
  return weatherService.getCurrentWeather(lat, lon);
};

export default weatherService;