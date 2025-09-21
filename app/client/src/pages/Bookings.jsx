import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Hotel, 
  Plane, 
  Calendar, 
  CreditCard,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const Bookings = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBookedTrips();
  }, []);

  const loadBookedTrips = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getTrips();
      // Filter for trips with booking status
      const bookedTrips = response.data.trips.filter(
        trip => trip.bookingStatus === 'booked' || trip.paymentStatus === 'paid' || trip.cancellationStatus === 'cancelled'
      );
      setTrips(bookedTrips);
    } catch (error) {
      toast.error('Failed to load bookings');
      console.error('Load bookings error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (tripId) => {
    try {
      const confirmCancel = window.confirm(
        'Are you sure you want to cancel this booking? Cancellation fees may apply based on the timing.'
      );
      
      if (!confirmCancel) return;

      toast.loading('Processing cancellation...', { id: 'cancel' });
      const response = await apiService.cancelBooking(tripId);
      toast.success('Booking cancelled successfully', { id: 'cancel' });
      
      // Show refund information
      if (response.data.refundInfo) {
        const { refundAmount, cancellationFeePercentage } = response.data.refundInfo;
        toast.success(
          `Refund of $${refundAmount} will be processed. Cancellation fee: ${cancellationFeePercentage}%`,
          { duration: 6000 }
        );
      }
      
      loadBookedTrips(); // Reload bookings
    } catch (error) {
      toast.error('Failed to cancel booking', { id: 'cancel' });
      console.error('Cancel booking error:', error);
    }
  };

  const getStatusBadge = (trip) => {
    if (trip.cancellationStatus === 'cancelled') {
      return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Cancelled</span>;
    } else if (trip.paymentStatus === 'paid') {
      return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Paid</span>;
    } else if (trip.bookingStatus === 'booked') {
      return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Payment Pending</span>;
    }
    return null;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600">Manage your travel bookings and view details</p>
        </div>
        <Button onClick={loadBookedTrips} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Bookings List */}
      {trips.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-4">You haven't made any bookings yet</p>
            <Button onClick={() => navigate('/dashboard')}>
              Browse Trips
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {trips.map((trip) => (
            <Card key={trip.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      {trip.destination}
                      {getStatusBadge(trip)}
                    </CardTitle>
                    <CardDescription>
                      {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      ${trip.bookingDetails?.totalCost?.toLocaleString() || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">Total Cost</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {trip.bookingDetails && (
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Accommodation */}
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center">
                        <Hotel className="h-4 w-4 mr-2" />
                        Accommodation
                      </h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="font-medium">{trip.bookingDetails.accommodation.name}</p>
                        <p className="text-sm text-gray-600">
                          {trip.bookingDetails.accommodation.nights} nights
                        </p>
                        <p className="text-sm text-gray-600">
                          Confirmation: {trip.bookingDetails.accommodation.confirmationNumber}
                        </p>
                      </div>
                    </div>

                    {/* Flights */}
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center">
                        <Plane className="h-4 w-4 mr-2" />
                        Flights
                      </h4>
                      <div className="space-y-2">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="font-medium">Outbound: {trip.bookingDetails.flights.outbound.flightNumber}</p>
                          <p className="text-sm text-gray-600">
                            Confirmation: {trip.bookingDetails.flights.outbound.confirmationNumber}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="font-medium">Return: {trip.bookingDetails.flights.return.flightNumber}</p>
                          <p className="text-sm text-gray-600">
                            Confirmation: {trip.bookingDetails.flights.return.confirmationNumber}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cancellation Information */}
                {trip.cancellationStatus === 'cancelled' && trip.refundInfo && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-red-800 flex items-center mb-2">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Cancellation Details
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>Cancelled on:</strong> {formatDate(trip.cancelledAt)}</p>
                        <p><strong>Days until trip:</strong> {trip.refundInfo.daysUntilTrip}</p>
                      </div>
                      <div>
                        <p><strong>Cancellation fee:</strong> {trip.refundInfo.cancellationFeePercentage}% (${trip.refundInfo.cancellationFeeAmount})</p>
                        <p><strong>Refund amount:</strong> ${trip.refundInfo.refundAmount}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/trip/${trip.id}`)}
                  >
                    View Trip Details
                  </Button>
                  
                  {trip.paymentStatus === 'paid' && trip.cancellationStatus !== 'cancelled' && (
                    <Button 
                      variant="destructive" 
                      onClick={() => handleCancelBooking(trip.id)}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Cancel Booking
                    </Button>
                  )}

                  {trip.bookingStatus === 'booked' && trip.paymentStatus !== 'paid' && (
                    <Button 
                      onClick={() => navigate(`/payment/${trip.id}`)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Complete Payment
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookings;