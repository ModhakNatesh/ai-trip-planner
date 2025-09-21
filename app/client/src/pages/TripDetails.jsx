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
  Users,
  CreditCard,
  Edit,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Share2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import WeatherCard from '../components/ui/WeatherCard';
import GoogleMap from '../components/ui/GoogleMap';
import { apiService } from '../services/api';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';

const TripDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [trip, setTrip] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [excludedPlaces, setExcludedPlaces] = useState(new Set());
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    numberOfUsers: 1,
    participants: []
  });

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
      setIsGenerating(true);
      toast.loading('🤖 AI is generating your personalized itinerary...', { id: 'generate' });
      
      // Get user preferences
      const userPreferences = user?.preferences || {};
      
      const response = await apiService.generateItinerary(trip.id, userPreferences);
      
      if (response.data.success) {
        const message = response.data.message || 'Itinerary generated successfully!';
        if (message.includes('fallback')) {
          toast.success('✨ Itinerary created! (Using smart fallback)', { id: 'generate' });
        } else {
          toast.success('🎉 AI Itinerary generated successfully!', { id: 'generate' });
        }
        loadTripDetails(); // Reload to get updated trip with itinerary
      } else {
        throw new Error(response.data.error || 'Failed to generate itinerary');
      }
    } catch (error) {
      console.error('Generate itinerary error:', error);
      
      // Show more helpful error messages
      if (error.response?.status === 401) {
        toast.error('Please log in to generate itinerary', { id: 'generate' });
      } else if (error.response?.status === 404) {
        toast.error('Trip not found', { id: 'generate' });
      } else if (error.response?.data?.details && error.response.data.details.includes('billing')) {
        toast.error('AI service temporarily unavailable. Using fallback content.', { id: 'generate' });
        // Still reload to get fallback content
        loadTripDetails();
      } else {
        toast.error('Failed to generate itinerary. Please try again.', { id: 'generate' });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBookTrip = async () => {
    try {
      if (!trip.itinerary) {
        toast.error('Please generate an itinerary first');
        return;
      }
      
      toast.loading('Booking trip...', { id: 'book' });
      await apiService.bookTrip(trip.id);
      toast.success('Trip booked successfully! Proceed to payment.', { id: 'book' });
      loadTripDetails(); // Reload to get updated trip with booking status
    } catch (error) {
      toast.error('Failed to book trip', { id: 'book' });
      console.error('Book trip error:', error);
    }
  };

  const handleUpdateTrip = async () => {
    // Validation
    if (!editFormData.destination || !editFormData.startDate || !editFormData.endDate) {
      toast.error('Please fill in all required fields (destination, start date, end date)');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (editFormData.numberOfUsers > 1) {
      if (editFormData.participants.length !== editFormData.numberOfUsers - 1) {
        toast.error(`Please add exactly ${editFormData.numberOfUsers - 1} participant email(s)`);
        return;
      }

      const invalidEmails = editFormData.participants.filter(email => !emailRegex.test(email));
      if (invalidEmails.length > 0) {
        toast.error('Please enter valid email addresses for all participants');
        return;
      }

      const uniqueEmails = new Set(editFormData.participants);
      if (uniqueEmails.size !== editFormData.participants.length) {
        toast.error('Each participant must have a unique email address');
        return;
      }
    }

    try {
      toast.loading('Updating trip...', { id: 'update' });
      
      // Check if significant fields changed that would affect itinerary
      const significantFields = ['destination', 'startDate', 'endDate', 'budget', 'numberOfUsers', 'participants'];
      const hasSignificantChange = significantFields.some(field => 
        editFormData[field] !== undefined && 
        JSON.stringify(editFormData[field]) !== JSON.stringify(trip[field])
      );
      
      await apiService.updateTrip(trip.id, editFormData);
      
      if (hasSignificantChange && trip.itinerary) {
        toast.success('Trip updated! Your itinerary has been cleared due to significant changes. Please regenerate it.', { 
          id: 'update',
          duration: 5000
        });
      } else {
        toast.success('Trip updated successfully!', { id: 'update' });
      }
      
      setShowEditForm(false);
      setEditFormData({ destination: '', startDate: '', endDate: '', budget: '', numberOfUsers: 1, participants: [] });
      loadTripDetails(); // Reload to get updated trip
    } catch (error) {
      toast.error('Failed to update trip', { id: 'update' });
      console.error('Update trip error:', error);
    }
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
    setEditFormData({ destination: '', startDate: '', endDate: '', budget: '', numberOfUsers: 1, participants: [] });
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRegenerateItinerary = async () => {
    try {
      setIsRegenerating(true);
      toast.loading('Regenerating itinerary...', { id: 'regenerate' });
      
      // Get user preferences
      const userPreferences = user?.preferences || {};
      
      const excludedPlacesArray = Array.from(excludedPlaces);
      await apiService.regenerateItinerary(trip.id, {
        excludedPlaces: excludedPlacesArray,
        preferences: userPreferences
      });
      
      toast.success('Itinerary regenerated successfully!', { id: 'regenerate' });
      setExcludedPlaces(new Set()); // Reset excluded places
      setIsEditing(false); // Exit edit mode
      loadTripDetails(); // Reload to get updated trip
    } catch (error) {
      toast.error('Failed to regenerate itinerary', { id: 'regenerate' });
      console.error('Regenerate itinerary error:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/trip/${trip.id}`;
      const shareTitle = `Check out my ${trip.destination} trip!`;
      const shareText = `I'm planning an amazing ${formatDateRange(trip.startDate, trip.endDate)} trip to ${trip.destination}. Want to see the itinerary?`;
      
      // Check if Web Share API is supported
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
        toast.success('Trip shared successfully!');
      } else {
        // Fallback to clipboard copy
        const shareContent = `${shareTitle}\n\n${shareText}\n\n${shareUrl}`;
        await navigator.clipboard.writeText(shareContent);
        toast.success('Trip link copied to clipboard!');
      }
    } catch (error) {
      // Handle user cancellation or other errors
      if (error.name !== 'AbortError') {
        console.error('Share error:', error);
        toast.error('Failed to share trip');
      }
    }
  };

  const togglePlaceExclusion = (place) => {
    const newExcluded = new Set(excludedPlaces);
    if (newExcluded.has(place)) {
      newExcluded.delete(place);
    } else {
      newExcluded.add(place);
    }
    setExcludedPlaces(newExcluded);
  };

  const getBookingStatusBadge = () => {
    if (trip.cancellationStatus === 'cancelled') {
      return <span className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">Cancelled</span>;
    } else if (trip.paymentStatus === 'paid') {
      return <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">Paid & Confirmed</span>;
    } else if (trip.bookingStatus === 'booked') {
      return <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">Booked (Payment Pending)</span>;
    } else if (trip.status === 'planned') {
      return <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">Ready to Book</span>;
    } else {
      return <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">Planning</span>;
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
    
    // Handle new structured format with days array
    if (itinerary.days && Array.isArray(itinerary.days)) {
      return itinerary.days.map(day => ({
        dayNumber: day.day,
        data: day
      }));
    }
    
    // Fallback for old format with numbered keys (0, 1, 2, etc.)
    const days = [];
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-b-pink-500 border-l-cyan-500 rounded-full animate-spin opacity-75" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          <RefreshCw className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-indigo-600 animate-pulse" />
        </div>
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
          <CardTitle className="flex items-center justify-between text-2xl">
            <div className="flex items-center">
              <MapPin className="h-6 w-6 mr-3" />
              {trip.destination}
            </div>
            {getBookingStatusBadge()}
          </CardTitle>
          <CardDescription className="text-blue-100">
            <span className={`inline-block px-3 py-1 rounded-full text-sm ${
              trip.status === 'planning' ? 'bg-yellow-500/20 text-yellow-100' :
              trip.status === 'draft' ? 'bg-purple-500/20 text-purple-100' :
              trip.status === 'planned' ? 'bg-green-500/20 text-green-100' :
              'bg-gray-500/20 text-gray-100'
            }`}>
              {trip.status}
            </span>
            {trip.paymentStatus === 'paid' && (
              <span className="ml-2 text-sm">
                🎉 Your amazing trip is confirmed!
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Trip Details - 65% width (3/5) */}
            <div className="lg:col-span-3 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
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
                      <p className="font-medium">₹{parseInt(trip.budget).toLocaleString()}</p>
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
              
              <div className="pt-6 border-t border-blue-500/20">
                <h3 className="text-lg font-medium mb-3">Trip Members</h3>
                <div className="space-y-2">
                  {/* Always show owner */}
                  <div className="flex items-center justify-between bg-blue-500/10 rounded-lg px-3 py-2">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      <span className="font-medium">{trip.ownerName || trip.ownerEmail || 'Trip Owner'}</span>
                      {trip.ownerEmail && (
                        <span className="ml-2 text-sm text-white/70">{trip.ownerEmail}</span>
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
                          <span className="ml-2 text-sm text-white/70">{participant.email}</span>
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
                          <span className="ml-2 text-sm text-white/70">{email}</span>
                        </div>
                        <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded">Member</span>
                      </div>
                    ))
                  ) : null}
                </div>
              </div>
            </div>

            {/* Map - 35% width (2/5) */}
            <div className="lg:col-span-2">
              <GoogleMap 
                destination={trip.destination}
                height="400px"
                zoom={4}
                showLocationInfo={false}
                showBoundaries={true}
                className="w-full h-full rounded-lg overflow-hidden border border-blue-400/30"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Trip Form */}
      {showEditForm && (
        <Card className="bg-white/80 backdrop-blur-md border-0 shadow-2xl rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
            <CardTitle className="text-white text-2xl font-bold flex items-center">
              <Edit className="mr-3 h-6 w-6" />
              Edit Your Adventure
            </CardTitle>
            <CardDescription className="text-blue-100 mt-2">
              Update your trip details and preferences
            </CardDescription>
          </div>
          <CardContent className="p-8">
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateTrip(); }} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Destination</label>
                  <Input
                    type="text"
                    placeholder="Where would you like to go?"
                    value={editFormData.destination}
                    onChange={(e) => handleEditFormChange('destination', e.target.value)}
                    className="bg-white/50 border-slate-200 focus:border-blue-400 rounded-xl"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Budget (Optional)</label>
                  <Input
                    type="number"
                    placeholder="Budget in INR"
                    value={editFormData.budget}
                    onChange={(e) => handleEditFormChange('budget', e.target.value)}
                    className="bg-white/50 border-slate-200 focus:border-blue-400 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Start Date</label>
                  <Input
                    type="date"
                    value={editFormData.startDate}
                    onChange={(e) => handleEditFormChange('startDate', e.target.value)}
                    className="bg-white/50 border-slate-200 focus:border-blue-400 rounded-xl"
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">End Date</label>
                  <Input
                    type="date"
                    value={editFormData.endDate}
                    onChange={(e) => handleEditFormChange('endDate', e.target.value)}
                    className="bg-white/50 border-slate-200 focus:border-blue-400 rounded-xl"
                    min={editFormData.startDate || new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Number of Travelers</label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={editFormData.numberOfUsers}
                    onChange={(e) => {
                      const num = parseInt(e.target.value);
                      handleEditFormChange('numberOfUsers', num);
                      if (num === 1) {
                        handleEditFormChange('participants', []);
                      }
                    }}
                    className="bg-white/50 border-slate-200 focus:border-blue-400 rounded-xl"
                  />
                </div>
              </div>

              {editFormData.numberOfUsers > 1 && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Participant Emails ({editFormData.numberOfUsers - 1} needed)
                  </label>
                  <div className="space-y-2">
                    {Array.from({ length: editFormData.numberOfUsers - 1 }, (_, index) => (
                      <Input
                        key={index}
                        type="email"
                        placeholder={`Participant ${index + 1} email`}
                        value={editFormData.participants[index] || ''}
                        onChange={(e) => {
                          const newParticipants = [...editFormData.participants];
                          newParticipants[index] = e.target.value;
                          handleEditFormChange('participants', newParticipants);
                        }}
                        className="bg-white/50 border-slate-200 focus:border-blue-400 rounded-xl"
                        required
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Update Trip
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50 py-3 rounded-xl transition-all duration-300"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Itinerary Overview */}
      {itinerary && (
        <div className="relative">
          {/* Loading Overlay for Regeneration */}
          {isRegenerating && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="relative mb-4">
                  <div className="w-16 h-16 border-4 border-transparent border-t-orange-500 border-r-purple-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-pink-500 border-l-cyan-500 rounded-full animate-spin opacity-75" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                  <RefreshCw className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-orange-600 animate-pulse" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">🔄 Regenerating Your Itinerary...</h3>
                <p className="text-gray-600 text-sm">Creating a new personalized plan based on your preferences</p>
              </div>
            </div>
          )}
          
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
              
              {/* Weather Information */}
              {itinerary.weatherInfo && (
                <WeatherCard weatherInfo={itinerary.weatherInfo} isCompact={true} />
              )}
              
              <div className="grid md:grid-cols-2 gap-6 mt-6">
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
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Daily Itinerary</h2>
              {trip.itinerary && trip.paymentStatus !== 'paid' && (
                <div className="flex gap-2">
                  {isEditing && (
                    <>
                      <Button 
                        onClick={handleRegenerateItinerary} 
                        disabled={isRegenerating}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        {isRegenerating ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Regenerating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Regenerate {excludedPlaces.size > 0 ? `(${excludedPlaces.size} excluded)` : 'Itinerary'}
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setExcludedPlaces(new Set());
                          setIsEditing(false);
                        }}
                        className="text-gray-600 hover:text-gray-700"
                      >
                        Cancel Edit
                      </Button>
                    </>
                  )}
                  {!isEditing && excludedPlaces.size > 0 && (
                    <Button 
                      variant="outline"
                      onClick={() => setExcludedPlaces(new Set())}
                      disabled={excludedPlaces.size === 0}
                    >
                      Clear Exclusions
                    </Button>
                  )}
                </div>
              )}
            </div>

            {trip.paymentStatus !== 'paid' && isEditing && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800 font-medium">
                  🎯 Edit Mode Active: Click on activities below to exclude them from your itinerary, then click &quot;Regenerate&quot; to create an updated plan!
                </p>
              </div>
            )}

            {trip.paymentStatus !== 'paid' && !isEditing && excludedPlaces.size === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 Click &quot;Edit Trip&quot; above to customize your itinerary by excluding activities you don&apos;t want!
                </p>
              </div>
            )}
            
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
                          {trip.paymentStatus !== 'paid' && isEditing && (
                            <span className="text-xs text-orange-600 ml-2 font-normal">(click to exclude)</span>
                          )}
                        </h4>
                        <ul className="space-y-2">
                          {(Array.isArray(dayData.activities) ? dayData.activities : Object.values(dayData.activities)).map((activity, index) => (
                            <li 
                              key={index} 
                              className={`flex items-start transition-all duration-200 ${
                                trip.paymentStatus !== 'paid' && isEditing ? 'cursor-pointer hover:bg-gray-50 rounded p-2' : 'p-2'
                              } ${
                                excludedPlaces.has(activity) ? 'opacity-50 line-through bg-red-50' : ''
                              }`}
                              onClick={() => trip.paymentStatus !== 'paid' && isEditing && togglePlaceExclusion(activity)}
                            >
                              <span className={`inline-block w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0 ${
                                excludedPlaces.has(activity) ? 'bg-red-500' : 'bg-primary'
                              }`}></span>
                              <span className="text-gray-700 flex-1">{activity}</span>
                              {trip.paymentStatus !== 'paid' && isEditing && (
                                <button className="text-xs text-gray-400 hover:text-gray-600">
                                  {excludedPlaces.has(activity) ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                </button>
                              )}
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
        </div>
      )}

      {/* No Itinerary */}
      {!itinerary && !isGenerating && (
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

      {/* Loading Itinerary */}
      {isGenerating && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="flex flex-col items-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-b-pink-500 border-l-cyan-500 rounded-full animate-spin opacity-75" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                <RefreshCw className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-indigo-600 animate-pulse" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">🤖 AI is crafting your perfect itinerary...</h3>
              <p className="text-gray-600 mb-4">This may take a few moments while we generate personalized recommendations</p>
              <div className="flex items-center text-sm text-gray-500">
                <div className="flex space-x-1 mr-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                Processing your travel preferences...
              </div>
            </div>
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
            
            {/* Generate Itinerary Button */}
            {(trip.status === 'planning' || trip.status === 'draft') && !trip.itinerary && (
              <Button 
                className="bg-primary"
                onClick={handleGenerateItinerary}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating AI Itinerary...
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 mr-2" />
                    Generate AI Itinerary
                  </>
                )}
              </Button>
            )}

            {/* Book Now Button - Show when itinerary exists and not booked yet */}
            {trip.itinerary && !trip.bookingStatus && trip.paymentStatus !== 'paid' && trip.cancellationStatus !== 'cancelled' && (
              <Button 
                onClick={handleBookTrip}
                className="bg-green-600 hover:bg-green-700"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Book Now
              </Button>
            )}

            {/* Complete Payment Button - Show when booked but not paid */}
            {trip.bookingStatus === 'booked' && trip.paymentStatus !== 'paid' && (
              <Button 
                onClick={() => navigate(`/payment/${trip.id}`)}
                className="bg-orange-600 hover:bg-orange-700 animate-pulse"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Complete Payment
              </Button>
            )}

            {/* View Bookings Button - Show when paid */}
            {trip.paymentStatus === 'paid' && (
              <Button 
                onClick={() => navigate('/bookings')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                View Booking Details
              </Button>
            )}

            {/* Share Trip Button */}
            <Button 
              variant="outline" 
              className="text-blue-600 hover:text-blue-700"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Trip
            </Button>

            {/* Status Information */}
            {trip.cancellationStatus === 'cancelled' && (
              <div className="w-full mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center text-red-800">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  <span className="font-medium">This trip has been cancelled</span>
                </div>
                {trip.refundInfo && (
                  <p className="text-sm text-red-700 mt-1">
                    Refund amount: ${trip.refundInfo.refundAmount} has been processed to your original payment method.
                  </p>
                )}
              </div>
            )}

            {trip.paymentStatus === 'paid' && trip.cancellationStatus !== 'cancelled' && (
              <div className="w-full mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center text-green-800">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="font-medium">Trip confirmed and paid!</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Your booking is confirmed. Check your email for detailed confirmation and travel documents.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TripDetails;