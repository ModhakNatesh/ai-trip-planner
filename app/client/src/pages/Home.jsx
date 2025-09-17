import { useNavigate } from 'react-router-dom'; // Add this import
import { Sparkles, Globe, Clock, Plane, Users, Star, ArrowRight, Zap, Shield, Heart } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuthStore } from '../store';
import { useEffect, useState } from 'react';
import { apiService } from '../services/api';

const Home = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate(); // Add this line to use navigation
  const [serverStatus, setServerStatus] = useState(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Move testimonials array before the useEffect that uses it
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Digital Nomad",
      content: "This AI planner created the most amazing 2-week Europe itinerary. Every recommendation was spot-on!",
      rating: 5
    },
    {
      name: "Marcus Johnson",
      role: "Adventure Traveler",
      content: "The real-time updates saved my trip when weather changed. Absolutely incredible technology.",
      rating: 5
    },
    {
      name: "Elena Rodriguez",
      role: "Family Traveler",
      content: "Planning our family vacation has never been easier. The AI understood our needs perfectly.",
      rating: 5
    }
  ];

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

  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const features = [
    {
      icon: <Sparkles className="h-8 w-8 text-white" />,
      title: "AI-Powered Planning",
      description: "Let our advanced AI create personalized itineraries based on your preferences, budget, and travel style.",
      gradient: "from-purple-500 to-pink-600"
    },
    {
      icon: <Globe className="h-8 w-8 text-white" />,
      title: "Global Destinations",
      description: "Discover amazing places around the world with local insights, hidden gems, and authentic recommendations.",
      gradient: "from-blue-500 to-cyan-600"
    },
    {
      icon: <Clock className="h-8 w-8 text-white" />,
      title: "Real-time Updates",
      description: "Get live updates on weather, events, and travel conditions to keep your trip perfectly timed.",
      gradient: "from-emerald-500 to-teal-600"
    },
    {
      icon: <Shield className="h-8 w-8 text-white" />,
      title: "Smart Recommendations",
      description: "Receive intelligent suggestions for accommodations, activities, and dining based on traveler reviews.",
      gradient: "from-orange-500 to-red-600"
    },
    {
      icon: <Heart className="h-8 w-8 text-white" />,
      title: "Personalized Experience",
      description: "Every itinerary is tailored to your interests, making each journey uniquely yours.",
      gradient: "from-rose-500 to-pink-600"
    },
    {
      icon: <Zap className="h-8 w-8 text-white" />,
      title: "Instant Planning",
      description: "Generate comprehensive travel plans in seconds, not hours of research.",
      gradient: "from-indigo-500 to-purple-600"
    }
  ];

  const stats = [
    { number: "50K+", label: "Happy Travelers", icon: <Users className="h-6 w-6" /> },
    { number: "180+", label: "Countries Covered", icon: <Globe className="h-6 w-6" /> },
    { number: "1M+", label: "Trips Planned", icon: <Plane className="h-6 w-6" /> },
    { number: "4.9", label: "User Rating", icon: <Star className="h-6 w-6" /> }
  ];

  const destinations = [
    { name: "Tokyo", image: "🏙️", travelers: "15K+" },
    { name: "Paris", image: "🗼", travelers: "22K+" },
    { name: "Bali", image: "🏖️", travelers: "18K+" },
    { name: "New York", image: "🌆", travelers: "25K+" },
    { name: "London", image: "🎡", travelers: "20K+" },
    { name: "Dubai", image: "🏗️", travelers: "12K+" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-cyan-200 to-blue-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-gradient-to-br from-emerald-200 to-cyan-200 rounded-full opacity-15 animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Hero Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-6xl mx-auto">
          {/* Floating Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-8 shadow-2xl animate-bounce">
            <Plane className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
              Plan Your Perfect Trip with{' '}
            </span>
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
              AI Magic
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            Discover amazing destinations, create personalized itineraries, and make unforgettable memories
            with our cutting-edge AI-powered trip planning assistant.
          </p>

          {/* API Status Indicator */}
          <div className="mb-12">
            <div className={`inline-flex items-center px-6 py-3 rounded-full text-sm font-semibold backdrop-blur-md shadow-lg transition-all duration-300 ${serverStatus === 'connected'
              ? 'bg-emerald-100/80 text-emerald-800 border border-emerald-200'
              : serverStatus === 'disconnected'
                ? 'bg-red-100/80 text-red-800 border border-red-200'
                : 'bg-slate-100/80 text-slate-800 border border-slate-200'
              }`}>
              <div className={`w-3 h-3 rounded-full mr-3 animate-pulse ${serverStatus === 'connected'
                ? 'bg-emerald-400'
                : serverStatus === 'disconnected'
                  ? 'bg-red-400'
                  : 'bg-slate-400'
                }`}></div>
              {serverStatus === 'connected' && '✨ AI System Online & Ready'}
              {serverStatus === 'disconnected' && '⚠️ System Temporarily Offline'}
              {!serverStatus && '🔄 Initializing AI Systems...'}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            {isAuthenticated ? (
              <Button
                size="lg"
                className="px-12 py-4 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                onClick={() => navigate('/dashboard')} // <-- Added this
              >
                <ArrowRight className="mr-2 h-5 w-5" />
                Go to Dashboard
              </Button>
            ) : (
              <>
                {/* Start Your Journey → Login Page */}
                <Button
                  size="lg"
                  className="px-12 py-4 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  onClick={() => navigate('/login')}
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Your Journey
                </Button>

                {/* Learn More → Scroll to Why Choose AI Trip Planner */}
                <Button
                  variant="outline"
                  size="lg"
                  className="px-12 py-4 text-lg font-semibold border-2 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  onClick={() => {
                    const section = document.getElementById('why-choose'); // Make sure this id exists
                    section?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Globe className="mr-2 h-5 w-5" />
                  Learn More
                </Button>
              </>
            )}
          </div>


          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-center mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-800 mb-1">{stat.number}</div>
                <div className="text-sm text-slate-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="why-choose" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent mb-6">
              Why Choose AI Trip Planner?
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Discover the future of travel planning with smart, intuitive features crafted for the modern explorer—powered by EaseMyTrip.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="text-center pb-4">
                  <div className={`mx-auto mb-6 p-4 bg-gradient-to-br ${feature.gradient} rounded-2xl w-fit shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-slate-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent mb-6">
              Popular Destinations
            </h2>
            <p className="text-xl text-slate-600">
              Discover where fellow travelers are heading with AI-crafted itineraries
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {destinations.map((dest, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-md rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group"
              >
                <div className="text-4xl mb-3 group-hover:scale-125 transition-transform duration-300">{dest.image}</div>
                <h3 className="font-bold text-slate-800 mb-1">{dest.name}</h3>
                <p className="text-sm text-slate-500">{dest.travelers} travelers</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent mb-6">
              What Travelers Say
            </h2>
          </div>

          <div className="relative">
            <Card className="bg-white/80 backdrop-blur-md border-0 shadow-2xl rounded-3xl overflow-hidden">
              <CardContent className="p-12 text-center">
                <div className="flex justify-center mb-6">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-xl md:text-2xl text-slate-700 italic mb-8 leading-relaxed">
                  &quot;{testimonials[currentTestimonial].content}&quot;
                </blockquote>
                <div>
                  <div className="font-bold text-slate-800 text-lg">{testimonials[currentTestimonial].name}</div>
                  <div className="text-slate-500">{testimonials[currentTestimonial].role}</div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${currentTestimonial === index ? 'bg-blue-500 w-8' : 'bg-slate-300'
                    }`}
                  onClick={() => setCurrentTestimonial(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }} />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Explore the World?</h2>
          <p className="text-xl mb-8">
            Start planning your next adventure with AI Trip Planner and turn your dream vacations into reality!
          </p>
          <Button
            size="lg"
            className="px-12 py-4 text-lg font-semibold bg-white text-blue-600 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:bg-blue-600 hover:text-white"
            onClick={() => navigate('/login')}
          >
            <Plane className="mr-2 h-5 w-5" />
            Get Started
          </Button>

        </div>
      </section>
    </div>
  );
};

export default Home;