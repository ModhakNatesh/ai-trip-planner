// Google Cloud Vertex AI service implementation
import { VertexAI } from '@google-cloud/vertexai';
import admin from '../config/firebase.js';

class VertexAIService {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT_ID;
    this.location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
    this.modelId = process.env.VERTEX_AI_MODEL_ID || 'gemini-2.5-flash';
    this.vertexAI = null;
    this.model = null;
    this.initialized = false;
  }

  async initializeVertexAI() {
    if (this.initialized) return;

    try {
      if (!admin) {
        throw new Error('Firebase Admin not initialized');
      }

      console.log('🔧 Vertex AI Initialization:', {
        projectId: this.projectId,
        location: this.location,
        primaryModel: this.modelId
      });

      // Initialize Vertex AI using Google Cloud client
      this.vertexAI = new VertexAI({
        project: this.projectId,
        location: this.location,
      });

      // Try multiple models in order of preference
      const modelsToTry = [
        this.modelId, // gemini-2.5-flash from env
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-pro',
        'text-bison'
      ];

      let modelInitialized = false;
      
      for (const modelName of modelsToTry) {
        try {
          console.log(`🔍 Trying model: ${modelName}`);
          
          this.model = this.vertexAI.getGenerativeModel({
            model: modelName, // ✅ Just the model name, no project path
            generationConfig: {
              temperature: 0.7,
              topP: 0.8,
              topK: 40,
              maxOutputTokens: 8192, // Increased token limit
            }
          });
          
          // Test the model with a simple request
          const testResult = await this.model.generateContent('Hello');
          const testResponse = testResult.response;
          
          // Try to extract text to verify the model works
          let testText;
          if (typeof testResponse.text === 'function') {
            testText = testResponse.text();
          } else if (testResponse.candidates && testResponse.candidates[0]) {
            const candidate = testResponse.candidates[0];
            if (candidate.content.parts && candidate.content.parts[0]) {
              testText = candidate.content.parts[0].text;
            }
          }
          
          if (!testText) {
            throw new Error('Model test failed - no text response');
          }
          
          console.log(`✅ Successfully initialized with model: ${modelName}`);
          
          this.modelId = modelName; // Update to the working model
          modelInitialized = true;
          break;
        } catch (error) {
          console.warn(`⚠️ Model ${modelName} failed:`, error.message.substring(0, 100));
          continue;
        }
      }

      if (!modelInitialized) {
        throw new Error(`No available Vertex AI models found in region ${this.location}`);
      }

      this.initialized = true;
      console.log(`✅ Vertex AI service initialized with model: ${this.modelId}`);
    } catch (error) {
      console.error('❌ Failed to initialize Vertex AI:', error.message);
      this.initialized = false;
      throw error;
    }
  }

  // Real Vertex AI implementation
  async callVertexAI(requestData) {
    try {
      await this.initializeVertexAI();

      let prompt;
      if (typeof requestData === 'string') {
        prompt = requestData;
      } else if (requestData.trip) {
        prompt = this.buildTripPrompt(requestData.trip, requestData.preferences || {}, requestData.weather);
      } else {
        throw new Error('Invalid request data format');
      }

      console.log('🤖 Vertex AI Request:', {
        prompt: prompt.substring(0, 200) + '...',
        promptLength: prompt.length,
        hasWeatherData: !!requestData.weather,
        weatherForecastLength: requestData.weather?.forecast?.length || 0,
        model: this.modelId,
        projectId: this.projectId,
        location: this.location
      });

      // Validate prompt length (max ~30k characters to be safe)
      if (prompt.length > 30000) {
        console.warn('⚠️ Prompt is very long:', prompt.length, 'characters');
      }

      // Add retry logic for better reliability
      let result;
      let lastError;
      const maxRetries = 2;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔄 Attempt ${attempt}/${maxRetries} for Vertex AI call`);
          result = await this.model.generateContent(prompt);
          break; // Success, exit retry loop
        } catch (error) {
          lastError = error;
          console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);
          
          if (attempt < maxRetries) {
            // Wait before retry (exponential backoff)
            const waitTime = Math.pow(2, attempt - 1) * 1000; // 1s, 2s
            console.log(`⏳ Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      
      if (!result) {
        throw lastError || new Error('All retry attempts failed');
      }
      const response = result.response;
      
      // Extract text content properly from Vertex AI response
      let text;
      if (typeof response.text === 'function') {
        text = response.text();
      } else if (response.candidates && response.candidates[0] && response.candidates[0].content) {
        // Access the content from candidates array
        const candidate = response.candidates[0];
        if (candidate.content.parts && candidate.content.parts[0]) {
          text = candidate.content.parts[0].text;
        } else {
          text = candidate.content.text || candidate.content;
        }
      } else if (response.text) {
        text = response.text;
      } else {
        console.error('❌ Unexpected response structure:', JSON.stringify(response, null, 2));
        throw new Error('Unable to extract text from Vertex AI response');
      }

      console.log('✅ Vertex AI Response received:', {
        model: this.modelId,
        responseLength: text ? text.length : 0,
        success: true,
        responseStructure: Object.keys(response)
      });

      // Validate that we have text content
      if (!text || typeof text !== 'string') {
        console.error('❌ No valid text content received from Vertex AI');
        throw new Error('Empty or invalid response from Vertex AI');
      }

      // Parse the response and structure it properly
      const itineraryData = this.parseItineraryResponse(text, requestData.trip);

      return {
        success: true,
        data: itineraryData,
        usage: {
          promptTokens: Math.floor(prompt.length / 4),
          completionTokens: Math.floor(text.length / 4),
          totalTokens: Math.floor((prompt.length + text.length) / 4)
        }
      };
    } catch (error) {
      console.error('❌ Vertex AI Error:', {
        message: error.message,
        code: error.code,
        status: error.status,
        details: error.details,
        stack: error.stack?.split('\n').slice(0, 3).join('\n'), // First 3 lines of stack
        model: this.modelId,
        projectId: this.projectId,
        location: this.location,
        hasWeatherData: !!requestData.weather,
        promptLength: requestData.trip ? 'estimated' : 'unknown'
      });
      
      // Always return structured fallback data
      const fallbackData = this.getFallbackResponse(requestData);
      
      return {
        success: false,
        error: error.message,
        data: fallbackData
      };
    }
  }

  buildTripPrompt(trip, preferences = {}, weather = null) {
    const { destination, startDate, endDate, budget, participants = [], currentLocation, numberOfUsers } = trip;
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const diffTime = Math.abs(endDateObj - startDateObj);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // Use numberOfUsers if available, otherwise calculate from participants + 1 (owner)
    const numTravelers = numberOfUsers || (participants.length || 0) + 1;

    // Add current location context if available
    const locationContext = currentLocation ? 
      `Starting from: ${currentLocation.name} (${currentLocation.latitude}, ${currentLocation.longitude}). Consider travel time and transportation options from this location to ${destination}.` : 
      '';

    // Add weather context if available
    let weatherContext = '';
    if (weather && weather.forecast && Array.isArray(weather.forecast) && weather.forecast.length > 0) {
      try {
        const avgTemp = weather.forecast.reduce((sum, day) => sum + (day.temperature || 0), 0) / weather.forecast.length;
        const rainDays = weather.forecast.filter(day => (day.precipitation || 0) > 0).length;
        const weatherConditions = [...new Set(weather.forecast.map(day => day.condition || 'unknown'))].join(', ');
        
        const clothingRecs = weather.recommendations?.clothing?.length > 0 ? 
          weather.recommendations.clothing.join(', ') : 'Standard travel clothing';
        const accessoryRecs = weather.recommendations?.accessories?.length > 0 ? 
          weather.recommendations.accessories.join(', ') : 'Basic travel essentials';
        
        weatherContext = `
Weather Forecast for ${destination}:
- Average temperature: ${Math.round(avgTemp)}°F
- Expected conditions: ${weatherConditions}
- Days with precipitation: ${rainDays}/${weather.forecast.length}
- Recommended clothing: ${clothingRecs}
- Additional packing: ${accessoryRecs}

Consider the weather when suggesting activities (indoor alternatives for rainy days) and include appropriate clothing recommendations in tips.`;
      } catch (weatherError) {
        console.warn('⚠️ Error processing weather data for AI prompt:', weatherError.message);
        weatherContext = ''; // Skip weather context if there's an error
      }
    }

    // Add user preferences context if available
    let preferencesContext = '';
    if (preferences && Object.keys(preferences).length > 0) {
      let prefParts = [];
      
      if (preferences.budget) {
        const budgetMapping = {
          'under-500': 'Budget-conscious (Under ₹40,000)',
          '500-1000': 'Mid-range (₹40,000 - ₹80,000)', 
          '1000-2500': 'Comfortable (₹80,000 - ₹2,00,000)',
          '2500-5000': 'Premium (₹2,00,000 - ₹4,00,000)',
          'over-5000': 'Luxury (Over ₹4,00,000)'
        };
        prefParts.push(`Budget preference: ${budgetMapping[preferences.budget] || preferences.budget}`);
      }
      
      if (preferences.travelStyle) {
        const styleMapping = {
          'budget': 'Budget traveler - focus on affordable options and value for money',
          'mid-range': 'Mid-range traveler - balance of comfort and cost',
          'luxury': 'Luxury traveler - premium experiences and comfort',
          'backpacking': 'Backpacker - adventurous, flexible, budget-friendly',
          'family': 'Family-friendly - activities suitable for all ages',
          'solo': 'Solo traveler - safe, social, and flexible options'
        };
        prefParts.push(`Travel style: ${styleMapping[preferences.travelStyle] || preferences.travelStyle}`);
      }
      
      if (preferences.interests && Array.isArray(preferences.interests) && preferences.interests.length > 0) {
        prefParts.push(`Interests: ${preferences.interests.join(', ')}`);
      }
      
      if (prefParts.length > 0) {
        preferencesContext = `
User Preferences:
${prefParts.map(p => `- ${p}`).join('\n')}

Please tailor the itinerary to match these preferences and interests.`;
      }
    }

    return `Create a travel itinerary in JSON format for ${destination}, ${diffDays} days, ${numTravelers} traveler(s), budget: ${budget || 'moderate'}.

Group Size: ${numTravelers} ${numTravelers === 1 ? 'solo traveler' : numTravelers === 2 ? 'couple' : `group of ${numTravelers} people`}
${locationContext}
${weatherContext}
${preferencesContext}

IMPORTANT: 
- Use plain text only. Do not use markdown formatting (**bold**, *italics*) or special characters. Write in clean, readable plain text.
- All budget and cost estimates should be in Indian Rupees (INR) using ₹ symbol.
- Consider the group size of ${numTravelers} people when recommending activities, accommodations, and transportation.
- ${numTravelers === 1 ? 'Focus on solo-friendly activities and single occupancy options.' : 
   numTravelers === 2 ? 'Recommend romantic/couple activities and double occupancy accommodations.' : 
   `Plan group activities suitable for ${numTravelers} people and recommend group accommodations/transportation.`}
${weather ? '- Factor in the weather forecast when suggesting activities and include weather-appropriate clothing recommendations.' : ''}
${preferencesContext ? '- Tailor all recommendations to match the user\'s specified preferences, travel style, and interests.' : ''}

JSON format (be concise):
{
  "title": "Trip title",
  "duration": "${diffDays} Days", 
  "overview": "Brief overview in plain text${weather ? ' including weather considerations' : ''}",
  "days": [
    {
      "day": 1,
      "title": "Day title in plain text",
      "activities": ["Activity 1 description in plain text", "Activity 2 description in plain text", "Activity 3 description in plain text"],
      "meals": ["Breakfast suggestion in plain text", "Dinner suggestion in plain text"],
      "transportation": "Transport method in plain text",
      "budget": "Daily budget estimate in INR with ₹ symbol"
    }
  ],
  "tips": ["Tip 1 in plain text without markdown", "Tip 2 in plain text without markdown", "Tip 3 in plain text without markdown"${weather ? ', "Weather-appropriate clothing and packing suggestions based on forecast"' : ''}],
  "totalEstimatedCost": "Total cost estimate in INR with ₹ symbol"${weather ? ',\n  "weatherInfo": {\n    "forecast": "Brief weather summary for trip dates",\n    "packingRecommendations": ["Essential items for the weather conditions"]\n  }' : ''}
}

Include specific places, restaurants, attractions for ${destination}. Focus on popular attractions and practical details.
Use plain text descriptions without any markdown formatting like asterisks or bold text.
Consider group size of ${numTravelers} ${numTravelers === 1 ? 'solo traveler' : 'travelers'} for all recommendations (activities, restaurants, accommodations).
All budget estimates and costs should be in Indian Rupees (INR) with proper ₹ symbol formatting.
${weather ? 'Include indoor and outdoor activity options based on the weather forecast. Suggest appropriate clothing and gear in the tips section.' : ''}
${preferencesContext ? 'Ensure all activities, accommodations, and recommendations align with the user\'s stated preferences and interests.' : ''}
${preferences.excludedPlaces ? `Exclude: ${preferences.excludedPlaces.join(', ')}` : ''}
${currentLocation ? `Consider transportation from ${currentLocation.name} and include travel recommendations.` : ''}

Return only valid JSON with plain text content, no markdown formatting, no extra text.`;
  }

  parseItineraryResponse(text, trip) {
    try {
      console.log('🔍 Parsing response text length:', text.length);
      
      // Remove markdown code block markers if present
      let cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Check if the response was truncated
      const wasTruncated = !cleanedText.endsWith('}') && !cleanedText.endsWith(']');
      
      if (wasTruncated) {
        console.warn('⚠️ Response appears to be truncated, attempting to fix...');
        
        // Try to find a valid ending point for the JSON
        const lastValidDay = cleanedText.lastIndexOf('},');
        if (lastValidDay > 0) {
          // Find the start of the days array
          const daysStart = cleanedText.indexOf('"days": [');
          if (daysStart > 0) {
            // Extract everything up to the last complete day
            const beforeDays = cleanedText.substring(0, daysStart);
            const daysSection = cleanedText.substring(daysStart, lastValidDay + 1);
            
            // Reconstruct a valid JSON
            cleanedText = beforeDays + daysSection + '],"tips":["Research local customs and etiquette","Book major attractions in advance","Try local cuisine and specialties"],"totalEstimatedCost":"Contact for detailed pricing"}';
          }
        }
      }

      // Try to extract JSON from the response
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          
          // Validate the structure
          if (parsed.days && Array.isArray(parsed.days)) {
            console.log(`✅ Successfully parsed itinerary with ${parsed.days.length} days`);
            // Clean markdown formatting from the parsed JSON
            const cleanedItinerary = this.cleanMarkdownFromItinerary(parsed);
            return cleanedItinerary;
          }
        } catch (parseError) {
          console.warn('🔧 Initial JSON parse failed, trying to repair...', parseError.message);
          
          // Try to repair common JSON issues
          let repairedJson = jsonMatch[0];
          
          // Fix common truncation issues
          if (!repairedJson.endsWith('}')) {
            // Try to close unclosed structures
            const openBraces = (repairedJson.match(/\{/g) || []).length;
            const closeBraces = (repairedJson.match(/\}/g) || []).length;
            const openArrays = (repairedJson.match(/\[/g) || []).length;
            const closeArrays = (repairedJson.match(/\]/g) || []).length;
            
            // Add missing closing brackets
            for (let i = 0; i < openArrays - closeArrays; i++) {
              repairedJson += ']';
            }
            for (let i = 0; i < openBraces - closeBraces; i++) {
              repairedJson += '}';
            }
          }
          
          try {
            const repairedParsed = JSON.parse(repairedJson);
            if (repairedParsed.days && Array.isArray(repairedParsed.days)) {
              console.log(`✅ Successfully repaired and parsed itinerary with ${repairedParsed.days.length} days`);
              // Clean markdown formatting from the repaired JSON
              const cleanedItinerary = this.cleanMarkdownFromItinerary(repairedParsed);
              return cleanedItinerary;
            }
          } catch (repairError) {
            console.warn('🔧 JSON repair also failed:', repairError.message);
          }
        }
      }

      // If parsing fails, return a structured fallback based on the trip
      console.warn('Failed to parse Vertex AI JSON response, using structured fallback');
      return this.createStructuredItinerary(trip, text);
    } catch (error) {
      console.error('Error parsing Vertex AI response:', error);
      return this.createStructuredItinerary(trip, text);
    }
  }

  createStructuredItinerary(trip) {
    const { destination, startDate, endDate } = trip;
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const diffTime = Math.abs(endDateObj - startDateObj);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Create a basic structure even if AI response is malformed
    const days = [];
    for (let i = 1; i <= Math.min(diffDays, 7); i++) {
      days.push({
        day: i,
        title: `Day ${i} in ${destination}`,
        activities: [
          `Explore main attractions in ${destination}`,
          `Visit local markets and cultural sites`,
          `Enjoy authentic local cuisine`,
          `Evening leisure activities`
        ],
        meals: [
          "Local breakfast specialties",
          "Traditional dinner at recommended restaurant"
        ],
        transportation: "Local transport and walking",
        budget: "₹8,000-12,000"
      });
    }

    return {
      title: `${destination} Adventure`,
      duration: `${diffDays} Days`,
      overview: `A wonderful ${diffDays}-day journey through ${destination}, featuring the best attractions, local experiences, and cultural highlights.`,
      days: days,
      tips: [
        `Research local customs and etiquette in ${destination}`,
        "Book major attractions in advance",
        "Try local cuisine and specialties",
        "Keep important documents safe",
        "Learn basic phrases in the local language"
      ],
      totalEstimatedCost: `₹${40000 + (diffDays * 8000)}-${65000 + (diffDays * 12000)} per person`
    };
  }

  getFallbackResponse(requestData) {
    const trip = requestData?.trip || requestData;
    if (trip && trip.destination) {
      return this.createStructuredItinerary(trip);
    }

    // Generic fallback for other cases
    return {
      title: "Trip Planning Assistant",
      duration: "5-7 Days",
      overview: "I'm currently experiencing technical difficulties, but I'd be happy to help you plan your trip! Here are some general suggestions:",
      days: [
        {
          day: 1,
          title: "Arrival and Orientation",
          activities: [
            "Arrive at destination",
            "Check into accommodation",
            "Explore the main city center",
            "Welcome dinner at a local restaurant"
          ],
          meals: ["Local breakfast specialty", "Traditional dinner"],
          transportation: "Airport transfer + local transport",
          budget: "₹8,000-12,000"
        }
      ],
      tips: [
        "Research your destination's climate and pack accordingly",
        "Book accommodations and flights well in advance",
        "Check visa requirements and travel documents",
        "Create a flexible itinerary with must-see attractions",
        "Set aside budget for unexpected experiences",
        "Learn basic phrases in the local language",
        "Research local customs and etiquette"
      ],
      totalEstimatedCost: "₹65,000-1,25,000 per person",
      note: "For a detailed, personalized itinerary, please try again later when our AI service is fully operational."
    };
  }

  delay(ms) {
    return new Promise(resolve => global.setTimeout(resolve, ms));
  }

  cleanMarkdownFromItinerary(itinerary) {
    // Helper function to clean markdown formatting from text
    const cleanText = (text) => {
      if (typeof text !== 'string') return text;
      
      return text
        // Remove bold formatting **text**
        .replace(/\*\*(.*?)\*\*/g, '$1')
        // Remove italic formatting *text*
        .replace(/\*(.*?)\*/g, '$1')
        // Remove other markdown patterns
        .replace(/__(.*?)__/g, '$1')
        .replace(/_(.*?)_/g, '$1')
        // Clean up any remaining asterisks that might be standalone
        .replace(/\*+/g, '')
        .trim();
    };

    // Deep clean the itinerary object
    const cleanObject = (obj) => {
      if (Array.isArray(obj)) {
        return obj.map(item => cleanObject(item));
      } else if (obj && typeof obj === 'object') {
        const cleaned = {};
        for (const [key, value] of Object.entries(obj)) {
          cleaned[key] = cleanObject(value);
        }
        return cleaned;
      } else if (typeof obj === 'string') {
        return cleanText(obj);
      }
      return obj;
    };

    return cleanObject(itinerary);
  }
}

// Export singleton instance
const vertexService = new VertexAIService();

export const callVertexAI = (requestData) => {
  return vertexService.callVertexAI(requestData);
};

export const initializeVertexAI = () => {
  return vertexService.initializeVertexAI();
};

export default vertexService;