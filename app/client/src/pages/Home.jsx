import { Link } from 'react-router-dom';
import { MapPin, Sparkles, Globe, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuthStore } from '../store';
import { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const Home = () => {
  const { isAuthenticated } = useAuthStore();
  const [serverStatus, setServerStatus] = useState(null);

  useEffect(() => {
    // Test API connection
    const testAPI = async () => {
      try {
        const response = await apiService.hello();
        setServerStatus('connected');
        console.log('API Response:', response.data);
      } catch (error) {
        setServerStatus('disconnected');
        console.error('API Error:', error);
      }
    };

    testAPI();
  }, []);

  const features = [
    {
      icon: <Sparkles className="h-6 w-6 text-primary" />,
      title: "AI-Powered Planning",
      description: "Let our AI create personalized itineraries based on your preferences and budget."
    },
    {
      icon: <Globe className="h-6 w-6 text-primary" />,
      title: "Global Destinations",
      description: "Discover amazing places around the world with local insights and recommendations."
    },
    {
      icon: <Clock className="h-6 w-6 text-primary" />,
      title: "Real-time Updates",
      description: "Get live updates on weather, events, and travel conditions for your destinations."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Plan Your Perfect Trip with{' '}
            <span className="text-primary">AI</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Discover amazing destinations, create personalized itineraries, and make unforgettable memories 
            with our AI-powered trip planning assistant.
          </p>
          
          {/* API Status Indicator */}
          <div className="mb-8">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
              serverStatus === 'connected' 
                ? 'bg-green-100 text-green-800' 
                : serverStatus === 'disconnected'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                serverStatus === 'connected' 
                  ? 'bg-green-400' 
                  : serverStatus === 'disconnected'
                  ? 'bg-red-400'
                  : 'bg-gray-400'
              }`}></div>
              {serverStatus === 'connected' && 'API Connected'}
              {serverStatus === 'disconnected' && 'API Disconnected'}
              {!serverStatus && 'Checking API...'}
            </div>
          </div>

          <div className="space-x-4">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button size="lg" className="px-8 py-3 text-lg">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button size="lg" className="px-8 py-3 text-lg">
                    Start Planning
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
                  Learn More
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose AI Trip Planner?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the future of travel planning with our intelligent features
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your Adventure?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of travelers who trust AI Trip Planner for their journeys
          </p>
          {!isAuthenticated && (
            <Link to="/login">
              <Button variant="secondary" size="lg" className="px-8 py-3 text-lg">
                Get Started for Free
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;