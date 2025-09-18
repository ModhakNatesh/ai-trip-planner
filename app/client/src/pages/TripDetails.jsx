import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Clock,
  Utensils,
  Car,
  Camera,
  Info,
  Star,
  Users
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const TripDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadTripDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getTripById(id);
      setTrip(response.data.trip);
      
      // Debug log to see the itinerary structure
      if (response.data.trip.itinerary) {
        console.log('Itinerary structure:', JSON.stringify(response.data.trip.itinerary, null, 2));
      }
    } catch (error) {
      toast.error('Failed to load trip details');
      console.error('Load trip details error:', error);
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadTripDetails();
  }, [loadTripDetails]);

  const handleGenerateItinerary = async () => {
    try {
      toast.loading('Generating itinerary...', { id: 'generate' });
      await apiService.generateItinerary(trip.id, {});
      toast.success('Itinerary generated successfully!', { id: 'generate' });
      loadTripDetails(); // Reload to get updated trip with itinerary
    } catch (error) {
      toast.error('Failed to generate itinerary', { id: 'generate' });
      console.error('Generate itinerary error:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
  };

  // Helper function to get day data from the itinerary
  const getDayData = (itinerary) => {
    if (!itinerary) return [];
    
    const days = [];
    
    // Look for numbered keys (0, 1, 2, etc.) which represent days
    Object.keys(itinerary).forEach(key => {
      if (!isNaN(parseInt(key)) && itinerary[key] && typeof itinerary[key] === 'object') {
        days.push({
          dayNumber: parseInt(key) + 1, // Convert 0-based to 1-based
          data: itinerary[key]
        });
      }
    });
    
    // Sort by day number
    return days.sort((a, b) => a.dayNumber - b.dayNumber);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Trip not found</h2>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const itinerary = trip.itinerary;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => navigate('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Trip Overview */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <MapPin className="h-6 w-6 mr-3" />
            {trip.destination}
          </CardTitle>
          <CardDescription className="text-blue-100">
            <span className={`inline-block px-3 py-1 rounded-full text-sm ${
              trip.status === 'planning' ? 'bg-yellow-500/20 text-yellow-100' :
              trip.status === 'planned' ? 'bg-green-500/20 text-green-100' :
              'bg-gray-500/20 text-gray-100'
            }`}>
              {trip.status}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-3" />
              <div>
                <p className="font-medium">{formatDate(trip.startDate)}</p>
                <p className="text-sm text-blue-200">to {formatDate(trip.endDate)}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-3" />
              <div>
                <p className="font-medium">{formatDateRange(trip.startDate, trip.endDate)}</p>
                <p className="text-sm text-blue-200">Duration</p>
              </div>
            </div>
            
            {trip.budget && (
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 mr-3" />
                <div>
                  <p className="font-medium">${parseInt(trip.budget).toLocaleString()}</p>
                  <p className="text-sm text-blue-200">Budget</p>
                </div>
              </div>
            )}

            <div className="flex items-center">
              <Users className="h-5 w-5 mr-3" />
              <div>
                <p className="font-medium">{(trip.participants?.length || 0) + 1} Participants</p>
                <p className="text-sm text-blue-200">Trip Members</p>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-blue-500/20">
            <h3 className="text-lg font-medium mb-3">Trip Members</h3>
            <div className="space-y-2">
              {/* Always show owner */}
              <div className="flex items-center justify-between bg-blue-500/10 rounded-lg px-3 py-2">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  <span className="font-medium">{trip.ownerName || trip.ownerEmail || 'Trip Owner'}</span>
                  {trip.ownerEmail && (
                    <span className="ml-2 text-sm text-blue-700/60">{trip.ownerEmail}</span>
                  )}
                </div>
                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">Owner</span>
              </div>

              {/* Show participants */}
              {trip.participantDetails ? (
                trip.participantDetails.map((participant) => (
                  <div key={participant.email} className="flex items-center justify-between bg-blue-500/10 rounded-lg px-3 py-2">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      <span className="font-medium">{participant.name}</span>
                      <span className="ml-2 text-sm text-blue-700/60">{participant.email}</span>
                    </div>
                    <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded">Member</span>
                  </div>
                ))
              ) : trip.participants && trip.participants.length > 0 ? (
                // Fallback to just emails if no details available
                trip.participants.map((email) => (
                  <div key={email} className="flex items-center justify-between bg-blue-500/10 rounded-lg px-3 py-2">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      <span className="font-medium">{email.split('@')[0]}</span>
                      <span className="ml-2 text-sm text-blue-700/60">{email}</span>
                    </div>
                    <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded">Member</span>
                  </div>
                ))
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Itinerary Overview */}
      {itinerary && (
        <>
          {/* Trip Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                {itinerary.title || 'Trip Overview'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{itinerary.overview}</p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Duration
                  </h4>
                  <p className="text-gray-600">{itinerary.duration}</p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Estimated Cost
                  </h4>
                  <p className="text-gray-600">{itinerary.totalEstimatedCost}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Itinerary */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Daily Itinerary</h2>
            
            {getDayData(itinerary).map(({ dayNumber, data: dayData }) => (
              <Card key={dayNumber} className="overflow-hidden">
                <CardHeader className="bg-gray-50">
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-primary" />
                    Day {dayNumber}: {dayData.title || `Day ${dayNumber}`}
                  </CardTitle>
                  {dayData.budget && (
                    <CardDescription>
                      Budget: {dayData.budget}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Activities */}
                    {dayData.activities && (
                      <div>
                        <h4 className="font-medium mb-3 flex items-center">
                          <Camera className="h-4 w-4 mr-2" />
                          Activities
                        </h4>
                        <ul className="space-y-2">
                          {(Array.isArray(dayData.activities) ? dayData.activities : Object.values(dayData.activities)).map((activity, index) => (
                            <li key={index} className="flex items-start">
                              <span className="inline-block w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                              <span className="text-gray-700">{activity}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Meals */}
                    {dayData.meals && (
                      <div>
                        <h4 className="font-medium mb-3 flex items-center">
                          <Utensils className="h-4 w-4 mr-2" />
                          Meals
                        </h4>
                        <ul className="space-y-2">
                          {(Array.isArray(dayData.meals) ? dayData.meals : Object.values(dayData.meals)).map((meal, index) => (
                            <li key={index} className="flex items-start">
                              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                              <span className="text-gray-700">{meal}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Transportation */}
                    {dayData.transportation && (
                      <div>
                        <h4 className="font-medium mb-3 flex items-center">
                          <Car className="h-4 w-4 mr-2" />
                          Transportation
                        </h4>
                        <p className="text-gray-700">{dayData.transportation}</p>
                      </div>
                    )}

                    {/* Day-specific budget */}
                    {dayData.budget && (
                      <div>
                        <h4 className="font-medium mb-3 flex items-center">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Day Budget
                        </h4>
                        <p className="text-gray-700">{dayData.budget}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Travel Tips */}
          {itinerary.tips && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2" />
                  Travel Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {(Array.isArray(itinerary.tips) ? itinerary.tips : Object.values(itinerary.tips)).map((tip, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-gray-700">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* No Itinerary */}
      {!itinerary && (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No itinerary generated yet</h3>
            <p className="text-gray-600 mb-4">Generate an itinerary to see detailed travel plans</p>
            <Button onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            {trip.status === 'planning' && (
              <Button 
                className="bg-primary"
                onClick={handleGenerateItinerary}
              >
                Generate Itinerary
              </Button>
            )}
            <Button variant="outline">
              Edit Trip
            </Button>
            <Button variant="outline" className="text-blue-600 hover:text-blue-700">
              Share Trip
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TripDetails;