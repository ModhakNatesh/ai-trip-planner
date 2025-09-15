import { useState, useEffect } from 'react';
import { Plus, MapPin, Calendar, DollarSign, Trash2, Edit } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useAuthStore, useTripStore } from '../store';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuthStore();
  const { trips, setTrips, addTrip, deleteTrip, isLoading, setLoading } = useTripStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    budget: ''
  });

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const loadTrips = async () => {
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
  };

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

    try {
      const response = await apiService.createTrip(formData);
      addTrip(response.data.trip);
      toast.success('Trip created successfully!');
      setFormData({ destination: '', startDate: '', endDate: '', budget: '' });
      setShowCreateForm(false);
    } catch (error) {
      toast.error('Failed to create trip');
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.displayName || user?.email}!
          </h1>
          <p className="text-gray-600 mt-2">Plan your next adventure with AI assistance</p>
        </div>

        {/* Create Trip Button */}
        <div className="mb-8">
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="h-4 w-4 mr-2" />
            {showCreateForm ? 'Cancel' : 'Create New Trip'}
          </Button>
        </div>

        {/* Create Trip Form */}
        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Trip</CardTitle>
              <CardDescription>Tell us about your next adventure</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTrip} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
                      Destination *
                    </label>
                    <Input
                      id="destination"
                      name="destination"
                      type="text"
                      required
                      placeholder="e.g., Paris, France"
                      value={formData.destination}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                      Budget (USD)
                    </label>
                    <Input
                      id="budget"
                      name="budget"
                      type="number"
                      placeholder="e.g., 2000"
                      value={formData.budget}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date *
                    </label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                      End Date *
                    </label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button type="submit">Create Trip</Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Trips Grid */}
        {trips.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No trips yet</h3>
              <p className="text-gray-600 mb-4">Create your first trip to get started</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Trip
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <Card key={trip.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-primary" />
                    {trip.destination}
                  </CardTitle>
                  <CardDescription>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                      trip.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                      trip.status === 'planned' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {trip.status}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                    </div>
                    {trip.budget && (
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 mr-2" />
                        ${trip.budget}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {trip.status === 'planning' && (
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleGenerateItinerary(trip)}
                      >
                        Generate Itinerary
                      </Button>
                    )}
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeleteTrip(trip.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;