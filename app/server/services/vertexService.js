// Mock Vertex AI service implementation
// This can be easily replaced with real Google Cloud Vertex AI integration

class VertexAIService {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    this.location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
    this.modelId = process.env.VERTEX_AI_MODEL_ID || 'text-bison';
  }

  // Mock implementation - replace with real Vertex AI calls
  async callVertexAI(prompt, options = {}) {
    try {
      console.log('🤖 Vertex AI Request:', {
        prompt: prompt.substring(0, 100) + '...',
        options
      });

      // Simulate API delay
      await this.delay(2000 + Math.random() * 3000);

      // Mock response based on prompt content
      const mockResponse = this.generateMockResponse(prompt);

      console.log('✅ Vertex AI Response generated');
      
      return {
        success: true,
        data: mockResponse,
        usage: {
          promptTokens: Math.floor(prompt.length / 4),
          completionTokens: Math.floor(mockResponse.length / 4),
          totalTokens: Math.floor((prompt.length + mockResponse.length) / 4)
        }
      };
    } catch (error) {
      console.error('❌ Vertex AI Error:', error);
      return {
        success: false,
        error: error.message,
        fallback: this.getFallbackResponse(prompt)
      };
    }
  }

  generateMockResponse(prompt) {
    // Parse the prompt to extract trip details
    const destination = this.extractDestination(prompt);
    const duration = this.extractDuration(prompt);
    
    return this.generateTripItinerary(destination, duration);
  }

  extractDestination(prompt) {
    const match = prompt.match(/trip to ([^from,\n]+)/i);
    return match ? match[1].trim() : 'your destination';
  }

  extractDuration(prompt) {
    const startMatch = prompt.match(/from ([\d\w\s,]+) to ([\d\w\s,]+)/i);
    if (startMatch) {
      // Calculate days between dates (simplified)
      return '5-7 days';
    }
    return '5-7 days';
  }

  generateTripItinerary(destination, duration) {
    const templates = {
      'Paris': this.getParisItinerary(),
      'Tokyo': this.getTokyoItinerary(),
      'New York': this.getNewYorkItinerary(),
      'London': this.getLondonItinerary(),
    };

    // Find matching template or use generic
    const key = Object.keys(templates).find(city => 
      destination.toLowerCase().includes(city.toLowerCase())
    );

    return key ? templates[key] : this.getGenericItinerary(destination, duration);
  }

  getParisItinerary() {
    return {
      title: "Magical Paris Adventure",
      duration: "7 Days",
      overview: "Experience the romance and culture of Paris with this carefully crafted itinerary featuring iconic landmarks, world-class museums, and authentic local experiences.",
      days: [
        {
          day: 1,
          title: "Classic Paris Icons",
          activities: [
            "Morning: Visit the Eiffel Tower and Trocadéro Gardens",
            "Afternoon: Seine River cruise",
            "Evening: Dinner in the Latin Quarter"
          ],
          meals: ["Café de Flore for breakfast", "Le Comptoir du Relais for dinner"],
          transportation: "Metro Day Pass",
          budget: "$120-150"
        },
        {
          day: 2,
          title: "Art and Culture",
          activities: [
            "Morning: Louvre Museum (pre-book tickets)",
            "Afternoon: Walk through Tuileries Garden to Place Vendôme",
            "Evening: Sunset at Sacré-Cœur"
          ],
          meals: ["Angelina for hot chocolate", "Le Consulat in Montmartre"],
          transportation: "Walking + Metro",
          budget: "$100-130"
        },
        {
          day: 3,
          title: "Champs-Élysées and Arc de Triomphe",
          activities: [
            "Morning: Arc de Triomphe climb",
            "Afternoon: Shopping on Champs-Élysées",
            "Evening: Show at Moulin Rouge (optional)"
          ],
          meals: ["Ladurée for macarons", "L'Ami Jean for dinner"],
          transportation: "Metro",
          budget: "$150-200"
        }
      ],
      tips: [
        "Book museum tickets in advance to skip lines",
        "Learn basic French phrases",
        "Try the metro day passes for easy transportation",
        "Pack comfortable walking shoes"
      ],
      totalEstimatedCost: "$800-1200 per person"
    };
  }

  getTokyoItinerary() {
    return {
      title: "Tokyo Modern Meets Traditional",
      duration: "7 Days",
      overview: "Discover the fascinating blend of ultra-modern technology and ancient traditions in Japan's vibrant capital city.",
      days: [
        {
          day: 1,
          title: "Shibuya and Harajuku",
          activities: [
            "Morning: Shibuya Crossing experience",
            "Afternoon: Explore Harajuku and Takeshita Street",
            "Evening: Observation deck at Tokyo Skytree"
          ],
          meals: ["Sushi breakfast at Tsukiji Outer Market", "Ramen in Shibuya"],
          transportation: "JR Pass",
          budget: "$80-120"
        },
        {
          day: 2,
          title: "Traditional Tokyo",
          activities: [
            "Morning: Senso-ji Temple in Asakusa",
            "Afternoon: Traditional gardens in Ueno",
            "Evening: Kabuki show (optional)"
          ],
          meals: ["Traditional breakfast at ryokan", "Tempura dinner"],
          transportation: "JR Pass + walking",
          budget: "$90-130"
        }
      ],
      tips: [
        "Get a JR Pass for convenient train travel",
        "Bow when greeting people",
        "Cash is still king in many places",
        "Remove shoes when entering homes/temples"
      ],
      totalEstimatedCost: "$1000-1500 per person"
    };
  }

  getNewYorkItinerary() {
    return {
      title: "The Big Apple Experience",
      duration: "5 Days",
      overview: "Experience the energy and diversity of New York City with iconic sights, world-class dining, and Broadway shows.",
      days: [
        {
          day: 1,
          title: "Midtown Manhattan",
          activities: [
            "Morning: Empire State Building",
            "Afternoon: Times Square and Broadway",
            "Evening: Broadway show"
          ],
          meals: ["NY bagel breakfast", "Pizza at Joe's"],
          transportation: "Metro Card",
          budget: "$200-300"
        }
      ],
      tips: [
        "Book Broadway shows in advance",
        "Use the subway - it's fastest",
        "Tip 18-20% at restaurants",
        "Walk in Central Park"
      ],
      totalEstimatedCost: "$1200-1800 per person"
    };
  }

  getLondonItinerary() {
    return {
      title: "London Royal Heritage",
      duration: "6 Days",
      overview: "Explore London's rich history, royal heritage, and modern culture in this comprehensive itinerary.",
      days: [
        {
          day: 1,
          title: "Royal London",
          activities: [
            "Morning: Buckingham Palace and Changing of Guard",
            "Afternoon: Westminster Abbey and Big Ben",
            "Evening: Thames dinner cruise"
          ],
          meals: ["Traditional English breakfast", "Fish and chips"],
          transportation: "Oyster Card",
          budget: "$150-200"
        }
      ],
      tips: [
        "Get an Oyster Card for transport",
        "Many museums are free",
        "Book afternoon tea in advance",
        "Mind the gap!"
      ],
      totalEstimatedCost: "$900-1400 per person"
    };
  }

  getGenericItinerary(destination, duration) {
    return {
      title: `Discover ${destination}`,
      duration: duration,
      overview: `A carefully planned itinerary to explore the best of ${destination}, featuring local attractions, cultural experiences, and authentic cuisine.`,
      days: [
        {
          day: 1,
          title: "Arrival and Orientation",
          activities: [
            `Arrive in ${destination}`,
            "Check into accommodation",
            "Explore the main city center",
            "Welcome dinner at a local restaurant"
          ],
          meals: ["Local breakfast specialty", "Traditional dinner"],
          transportation: "Airport transfer + local transport",
          budget: "$100-150"
        },
        {
          day: 2,
          title: "Main Attractions",
          activities: [
            "Visit top-rated tourist attractions",
            "Guided city tour",
            "Local market exploration",
            "Cultural performance or museum"
          ],
          meals: ["Street food lunch", "Restaurant dinner"],
          transportation: "Public transport day pass",
          budget: "$120-180"
        },
        {
          day: 3,
          title: "Local Experiences",
          activities: [
            "Participate in local activities",
            "Visit neighborhoods off the beaten path",
            "Cooking class or cultural workshop",
            "Sunset viewing at scenic spot"
          ],
          meals: ["Cooking class meal", "Local specialties"],
          transportation: "Walking + public transport",
          budget: "$90-140"
        }
      ],
      tips: [
        "Research local customs and etiquette",
        "Learn basic phrases in the local language",
        "Keep important documents safe",
        "Try local cuisine and specialties",
        "Respect local traditions and dress codes"
      ],
      totalEstimatedCost: "$800-1500 per person"
    };
  }

  // eslint-disable-next-line no-unused-vars
  getFallbackResponse(_prompt) {
    return {
      title: "Trip Planning Assistant",
      message: "I'm currently experiencing technical difficulties, but I'd be happy to help you plan your trip! Here are some general suggestions:",
      suggestions: [
        "Research your destination's climate and pack accordingly",
        "Book accommodations and flights well in advance",
        "Check visa requirements and travel documents",
        "Create a flexible itinerary with must-see attractions",
        "Set aside budget for unexpected experiences",
        "Learn basic phrases in the local language",
        "Research local customs and etiquette"
      ],
      note: "For a detailed, personalized itinerary, please try again later when our AI service is fully operational."
    };
  }

  delay(ms) {
    return new Promise(resolve => global.setTimeout(resolve, ms));
  }

  // Method to switch to real Vertex AI implementation
  async initializeRealVertexAI() {
    if (!this.isProduction) {
      console.log('⚠️  Using mock Vertex AI service in development mode');
      return;
    }

    try {
      // Uncomment and configure when ready to use real Vertex AI
      /*
      const { VertexAI } = require('@google-cloud/aiplatform');
      
      this.vertexAI = new VertexAI({
        project: this.projectId,
        location: this.location,
      });

      this.model = this.vertexAI.preview.getGenerativeModel({
        model: this.modelId,
      });

      console.log('✅ Real Vertex AI service initialized');
      */
      
      console.log('📝 Real Vertex AI integration ready for configuration');
    } catch (error) {
      console.error('❌ Failed to initialize real Vertex AI:', error);
      throw error;
    }
  }

  // Real Vertex AI implementation (commented out for development)
  /*
  async callRealVertexAI(prompt, options = {}) {
    if (!this.model) {
      throw new Error('Vertex AI not initialized');
    }

    const request = {
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        maxOutputTokens: options.maxTokens || 2048,
        temperature: options.temperature || 0.7,
        topP: options.topP || 0.8,
        topK: options.topK || 40,
      },
    };

    const response = await this.model.generateContent(request);
    return response.response.candidates[0].content.parts[0].text;
  }
  */
}

// Export singleton instance
const vertexService = new VertexAIService();

export const callVertexAI = (prompt, options) => {
  return vertexService.callVertexAI(prompt, options);
};

export const initializeVertexAI = () => {
  return vertexService.initializeRealVertexAI();
};

export default vertexService;