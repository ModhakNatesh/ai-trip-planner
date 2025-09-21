import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MapPin, Calendar, DollarSign, Trash2, Edit, Eye, Plane, Globe, Clock, Star, Navigation, Sparkles, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useAuthStore, useTripStore } from '../store';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { trips, setTrips, addTrip, deleteTrip, isLoading, setLoading } = useTripStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [formData, setFormData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    numberOfUsers: 1,
    participants: []
  });

  const getStatusGradient = (status) => {
    switch (status) {
      case 'planning':
        return 'from-amber-400 to-orange-500';
      case 'planned':
        return 'from-emerald-400 to-green-500';
      default:
        return 'from-slate-400 to-slate-500';
    }
  };

  const getBookingStatusBadge = (trip) => {
    if (trip.cancellationStatus === 'cancelled') {
      return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 font-medium">Cancelled</span>;
    } else if (trip.paymentStatus === 'paid') {
      return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 font-medium">✓ Paid</span>;
    } else if (trip.bookingStatus === 'booked') {
      return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 font-medium animate-pulse">Pay Now</span>;
    } else if (trip.itinerary) {
      return <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 font-medium">Ready</span>;
    }
    return null;
  };

  const loadTrips = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.getTrips();
      setTrips(response.data.trips);
    } catch (error) {
      toast.error('Failed to load trips');
      console.error('Load trips error:', error);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setTrips]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();

    if (!formData.destination || !formData.startDate || !formData.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate participant emails if there are any
    if (formData.numberOfUsers > 1) {
      if (formData.participants.length !== formData.numberOfUsers - 1) {
        toast.error('Please add all participant emails');
        return;
      }

      // Check if all participant emails are valid
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = formData.participants.filter(email => !emailRegex.test(email));
      if (invalidEmails.length > 0) {
        toast.error('Please enter valid email addresses for all participants');
        return;
      }

      // Check for duplicate emails
      const uniqueEmails = new Set(formData.participants);
      if (uniqueEmails.size !== formData.participants.length) {
        toast.error('Each participant must have a unique email address');
        return;
      }
    }

    try {
      const response = await apiService.createTrip(formData);
      addTrip(response.data.trip);
      toast.success('Trip created successfully!');
      setFormData({ destination: '', startDate: '', endDate: '', budget: '', numberOfUsers: 1, participants: [] });
      setShowCreateForm(false);
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        toast.error('Request timed out. The server may be busy. Please try again.');
      } else if (error.response?.status === 500) {
        toast.error('Server error occurred. Please try again later.');
      } else {
        toast.error('Failed to create trip. Please check your connection and try again.');
      }
      console.error('Create trip error:', error);
    }
  };

  const handleDeleteTrip = async (tripId) => {
    if (!confirm('Are you sure you want to delete this trip?')) return;

    try {
      await apiService.deleteTrip(tripId);
      deleteTrip(tripId);
      toast.success('Trip deleted successfully');
    } catch (error) {
      toast.error('Failed to delete trip');
      console.error('Delete trip error:', error);
    }
  };

  const handleGenerateItinerary = async (trip) => {
    try {
      toast.loading('Generating itinerary...', { id: 'generate' });
      await apiService.generateItinerary(trip.id, {});
      toast.success('Itinerary generated successfully!', { id: 'generate' });
      loadTrips(); // Reload to get updated trip
    } catch (error) {
      toast.error('Failed to generate itinerary', { id: 'generate' });
      console.error('Generate itinerary error:', error);
    }
  };

  const handleEditTrip = (trip) => {
    setEditingTrip(trip);
    setFormData({
      destination: trip.destination || '',
      startDate: trip.startDate || '',
      endDate: trip.endDate || '',
      budget: trip.budget || '',
      numberOfUsers: (trip.participants?.length || 0) + 1,
      participants: trip.participants || []
    });
    setShowCreateForm(true);
  };

  const handleUpdateTrip = async () => {
    // Validation
    if (!formData.destination || !formData.startDate || !formData.endDate) {
      toast.error('Please fill in all required fields (destination, start date, end date)');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.numberOfUsers > 1) {
      if (formData.participants.length !== formData.numberOfUsers - 1) {
        toast.error(`Please add exactly ${formData.numberOfUsers - 1} participant email(s)`);
        return;
      }

      const invalidEmails = formData.participants.filter(email => !emailRegex.test(email));
      if (invalidEmails.length > 0) {
        toast.error('Please enter valid email addresses for all participants');
        return;
      }

      const uniqueEmails = new Set(formData.participants);
      if (uniqueEmails.size !== formData.participants.length) {
        toast.error('Each participant must have a unique email address');
        return;
      }
    }

    try {
      await apiService.updateTrip(editingTrip.id, formData);
      toast.success('Trip updated successfully!');
      setFormData({ destination: '', startDate: '', endDate: '', budget: '', numberOfUsers: 1, participants: [] });
      setShowCreateForm(false);
      setEditingTrip(null);
      loadTrips(); // Reload to get updated trips
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        toast.error('Request timed out. The server may be busy. Please try again.');
      } else if (error.response?.status === 500) {
        toast.error('Server error occurred. Please try again later.');
      } else {
        toast.error('Failed to update trip. Please check your connection and try again.');
      }
      console.error('Update trip error:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingTrip(null);
    setShowCreateForm(false);
    setFormData({ destination: '', startDate: '', endDate: '', budget: '', numberOfUsers: 1, participants: [] });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (editingTrip) {
      handleUpdateTrip();
    } else {
      handleCreateTrip(e);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-b-pink-500 border-l-cyan-500 rounded-full animate-spin opacity-75" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-indigo-600 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-cyan-200 to-blue-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg">
              <Globe className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2">
              Welcome back, {user?.displayName || user?.email?.split('@')[0]}!
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Your AI-powered travel companion is ready to craft extraordinary adventures
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Trips</p>
                  <p className="text-3xl font-bold text-slate-800">{trips.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                  <Plane className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Confirmed</p>
                  <p className="text-3xl font-bold text-emerald-600">{trips.filter(t => t.paymentStatus === 'paid').length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">In Planning</p>
                  <p className="text-3xl font-bold text-amber-600">{trips.filter(t => t.status === 'planning').length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer"
                 onClick={() => navigate('/bookings')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Bookings</p>
                  <p className="text-3xl font-bold text-purple-600">{trips.filter(t => t.bookingStatus || t.paymentStatus === 'paid').length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Create Trip Button - Only show when trips exist */}
          {trips.length > 0 && (
            <div className="mb-8 flex justify-center">
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                {showCreateForm ? 'Cancel' : 'Create New Adventure'}
              </Button>
            </div>
          )}

          {/* Create Trip Form */}
          {showCreateForm && (
            <div className="mb-12 max-w-4xl mx-auto">
              <Card className="bg-white/80 backdrop-blur-md border-0 shadow-2xl rounded-3xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
                  <CardTitle className="text-white text-2xl font-bold flex items-center">
                    <Navigation className="mr-3 h-6 w-6" />
                    {editingTrip ? 'Edit Your Adventure' : 'Create Your Next Adventure'}
                  </CardTitle>
                  <CardDescription className="text-blue-100 mt-2">
                    {editingTrip ? 'Update your trip details and preferences' : 'Let AI craft the perfect itinerary for your dream destination'}
                  </CardDescription>
                </div>
                <CardContent className="p-8">
                  <form onSubmit={handleFormSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="destination" className="block text-sm font-semibold text-slate-700">
                          Destination *
                        </label>
                        <Input
                          id="destination"
                          name="destination"
                          type="text"
                          required
                          placeholder="e.g., Tokyo, Japan"
                          value={formData.destination}
                          onChange={handleInputChange}
                          className="border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="budget" className="block text-sm font-semibold text-slate-700">
                          Budget (USD)
                        </label>
                        <Input
                          id="budget"
                          name="budget"
                          type="number"
                          placeholder="e.g., 2000"
                          value={formData.budget}
                          onChange={handleInputChange}
                          className="border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="startDate" className="block text-sm font-semibold text-slate-700">
                          Start Date *
                        </label>
                        <Input
                          id="startDate"
                          name="startDate"
                          type="date"
                          required
                          value={formData.startDate}
                          onChange={handleInputChange}
                          min={new Date().toISOString().split("T")[0]} // ✅ prevents past dates
                          className="border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="endDate" className="block text-sm font-semibold text-slate-700">
                          End Date *
                        </label>
                        <Input
                          id="endDate"
                          name="endDate"
                          type="date"
                          required
                          value={formData.endDate}
                          onChange={handleInputChange}
                          min={formData.startDate || new Date().toISOString().split("T")[0]}
                          // ✅ ensures end date is same or after start date
                          className="border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 h-12"
                        />
                      </div>

                      <div className="space-y-2 col-span-2">
                        <label htmlFor="numberOfUsers" className="block text-sm font-semibold text-slate-700">
                          Number of Participants (including you)
                        </label>
                        <Input
                          id="numberOfUsers"
                          name="numberOfUsers"
                          type="number"
                          min="1"
                          value={formData.numberOfUsers}
                          onChange={(e) => {
                            const newValue = Math.max(1, parseInt(e.target.value) || 1);
                            setFormData(prev => ({
                              ...prev,
                              numberOfUsers: newValue,
                              participants: prev.participants.slice(0, newValue - 1)
                            }));
                          }}
                          className="border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 h-12"
                        />
                      </div>

                      {formData.numberOfUsers > 1 && (
                        <div className="col-span-2 space-y-4">
                          <label className="block text-sm font-semibold text-slate-700">
                            Participant Emails
                          </label>
                          {Array.from({ length: formData.numberOfUsers - 1 }).map((_, index) => (
                            <Input
                              key={index}
                              type="email"
                              placeholder={`Participant ${index + 1} email`}
                              value={formData.participants[index] || ''}
                              onChange={(e) => {
                                const newParticipants = [...formData.participants];
                                newParticipants[index] = e.target.value;
                                setFormData(prev => ({
                                  ...prev,
                                  participants: newParticipants
                                }));
                              }}
                              className="border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 h-12"
                            />
                          ))}
                        </div>
                      )}

                    </div>
                    <div className="flex space-x-4 pt-4">
                      <Button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {editingTrip ? 'Update Trip' : 'Create Trip'}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={editingTrip ? handleCancelEdit : () => setShowCreateForm(false)}
                        className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50 py-3 rounded-xl transition-all duration-300"
                      >
                        Cancel
                      </Button>
                    </div>

                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Trips Grid */}
          {trips.length === 0 ? (
            <div className="max-w-md mx-auto">
              <Card className="bg-white/80 backdrop-blur-md border-0 shadow-2xl rounded-3xl overflow-hidden">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MapPin className="h-10 w-10 text-slate-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Ready for Your First Adventure?</h3>
                  <p className="text-slate-600 mb-8 max-w-sm mx-auto">
                    Create your first AI-powered trip and discover personalized itineraries crafted just for you
                  </p>
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Trip
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-12">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                  <Plane className="h-6 w-6 mr-2 text-blue-500" />
                  Your Trips
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {trips.filter(trip => trip.role === 'owner').map((trip, index) => (
                    <Card
                      key={trip.id}
                      className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group cursor-pointer"
                      style={{
                        animationDelay: `${index * 100}ms`
                      }}
                    >
                      <div className={`h-2 bg-gradient-to-r ${getStatusGradient(trip.status)}`}></div>
                      <div onClick={() => navigate(`/trip/${trip.id}`)}>
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center justify-between text-slate-800 group-hover:text-blue-600 transition-colors duration-300">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                                <MapPin className="h-4 w-4 text-white" />
                              </div>
                              {trip.destination}
                            </div>
                            {getBookingStatusBadge(trip)}
                          </CardTitle>
                          <CardDescription className="flex items-center mt-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${getStatusGradient(trip.status)} text-white shadow-md`}>
                              <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse inline-block"></span>
                              {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                            </span>
                            <span className="ml-2 text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">Owner</span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3 mb-6">
                            <div className="flex items-center text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                              <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                              <span className="font-medium">{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
                            </div>
                            {trip.budget && (
                              <div className="flex items-center text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                                <DollarSign className="h-4 w-4 mr-2 text-emerald-500" />
                                <span className="font-medium">${parseInt(trip.budget).toLocaleString()}</span>
                              </div>
                            )}
                            {trip.participants && trip.participants.length > 0 && (
                              <div className="flex items-center text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                                <Users className="h-4 w-4 mr-2 text-blue-500" />
                                <span className="font-medium">{trip.participants.length + 1} Participants</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </div>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {trip.status === 'planning' && !trip.itinerary && (
                            <Button
                              size="sm"
                              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateItinerary(trip);
                              }}
                            >
                              <Sparkles className="h-4 w-4 mr-2" />
                              Generate AI Itinerary
                            </Button>
                          )}
                          
                          {/* Book Now Button */}
                          {trip.itinerary && !trip.bookingStatus && trip.paymentStatus !== 'paid' && trip.cancellationStatus !== 'cancelled' && (
                            <Button
                              size="sm"
                              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/trip/${trip.id}`);
                              }}
                            >
                              <Star className="h-4 w-4 mr-2" />
                              Book This Trip
                            </Button>
                          )}

                          {/* Complete Payment Button */}
                          {trip.bookingStatus === 'booked' && trip.paymentStatus !== 'paid' && (
                            <Button
                              size="sm"
                              className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 animate-pulse"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/payment/${trip.id}`);
                              }}
                            >
                              💳 Complete Payment
                            </Button>
                          )}

                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 rounded-lg transition-all duration-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/trip/${trip.id}`);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            
                            {trip.paymentStatus !== 'paid' && trip.cancellationStatus !== 'cancelled' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 rounded-lg transition-all duration-300"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditTrip(trip);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            )}
                            
                            {trip.paymentStatus !== 'paid' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTrip(trip.id);
                                }}
                                className="border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-300 hover:text-red-600 rounded-lg transition-all duration-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Participated Trips Section */}
              {trips.some(trip => trip.role === 'participant') && (
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                    <Users className="h-6 w-6 mr-2 text-purple-500" />
                    Trips You are Part Of
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {trips.filter(trip => trip.role === 'participant').map((trip, index) => (
                      <Card
                        key={trip.id}
                        className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group cursor-pointer"
                        style={{
                          animationDelay: `${index * 100}ms`
                        }}
                      >
                        <div className={`h-2 bg-gradient-to-r ${getStatusGradient(trip.status)}`}></div>
                        <div onClick={() => navigate(`/trip/${trip.id}`)}>
                          <CardHeader className="pb-4">
                            <CardTitle className="flex items-center text-slate-800 group-hover:text-blue-600 transition-colors duration-300">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                                <MapPin className="h-4 w-4 text-white" />
                              </div>
                              {trip.destination}
                            </CardTitle>
                            <CardDescription className="flex items-center mt-2">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${getStatusGradient(trip.status)} text-white shadow-md`}>
                                <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse inline-block"></span>
                                {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                              </span>
                              <span className="ml-2 text-xs text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded">Participant</span>
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex items-center text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                                <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                                <span className="font-medium">{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
                              </div>
                              {trip.budget && (
                                <div className="flex items-center text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                                  <DollarSign className="h-4 w-4 mr-2 text-emerald-500" />
                                  <span className="font-medium">${parseInt(trip.budget).toLocaleString()}</span>
                                </div>
                              )}
                              {trip.participants && trip.participants.length > 0 && (
                                <div className="flex items-center text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                                  <Users className="h-4 w-4 mr-2 text-purple-500" />
                                  <span className="font-medium">{trip.participants.length + 1} Participants</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </div>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 rounded-lg transition-all duration-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/trip/${trip.id}`);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Trip Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;