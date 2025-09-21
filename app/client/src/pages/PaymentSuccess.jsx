import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  Calendar, 
  MapPin, 
  Plane,
  Hotel,
  CreditCard,
  ArrowRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { trip, paymentId } = location.state || {};

  useEffect(() => {
    // If no trip data, redirect to dashboard
    if (!trip) {
      navigate('/dashboard');
    }
  }, [trip, navigate]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!trip) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Success Header */}
      <Card className="text-center bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <CardHeader className="pb-4">
          <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription className="text-green-100">
            Your trip to {trip.destination} has been booked and paid for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white/10 rounded-lg p-4 inline-block">
            <p className="text-sm opacity-90">Payment ID</p>
            <p className="font-mono text-lg">{paymentId}</p>
          </div>
        </CardContent>
      </Card>

      {/* Trip Details */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Trip Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{trip.destination}</h3>
              <p className="text-gray-600 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
              </p>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-1">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">
                ${trip.bookingDetails?.totalCost?.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What&apos;s Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Booking Confirmed</p>
                  <p className="text-sm text-gray-600">Your trip has been successfully booked</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Payment Processed</p>
                  <p className="text-sm text-gray-600">Confirmation emails will be sent shortly</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <Plane className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Get Ready to Travel</p>
                  <p className="text-sm text-gray-600">Check your booking details and prepare for your trip</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Details */}
      {trip.bookingDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Booking Confirmation Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Accommodation */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center">
                  <Hotel className="h-4 w-4 mr-2" />
                  Accommodation
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">{trip.bookingDetails.accommodation.name}</p>
                  <p className="text-sm text-gray-600">
                    Check-in: {formatDate(trip.bookingDetails.accommodation.checkIn)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Check-out: {formatDate(trip.bookingDetails.accommodation.checkOut)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {trip.bookingDetails.accommodation.nights} nights
                  </p>
                  <p className="text-sm font-mono bg-white p-2 rounded mt-2">
                    Confirmation: {trip.bookingDetails.accommodation.confirmationNumber}
                  </p>
                </div>
              </div>

              {/* Flights */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center">
                  <Plane className="h-4 w-4 mr-2" />
                  Flight Details
                </h4>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">Outbound Flight</p>
                    <p className="text-sm text-gray-600">
                      {trip.bookingDetails.flights.outbound.flightNumber}
                    </p>
                    <p className="text-sm text-gray-600">
                      Departure: {formatDate(trip.bookingDetails.flights.outbound.departure)}
                    </p>
                    <p className="text-sm font-mono bg-white p-2 rounded mt-2">
                      Confirmation: {trip.bookingDetails.flights.outbound.confirmationNumber}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">Return Flight</p>
                    <p className="text-sm text-gray-600">
                      {trip.bookingDetails.flights.return.flightNumber}
                    </p>
                    <p className="text-sm text-gray-600">
                      Departure: {formatDate(trip.bookingDetails.flights.return.departure)}
                    </p>
                    <p className="text-sm font-mono bg-white p-2 rounded mt-2">
                      Confirmation: {trip.bookingDetails.flights.return.confirmationNumber}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button onClick={() => navigate('/bookings')} className="bg-primary">
          View All Bookings
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
        <Button variant="outline" onClick={() => navigate(`/trip/${trip.id}`)}>
          View Trip Details
        </Button>
      </div>

      {/* Important Notice */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <h4 className="font-medium text-yellow-800 mb-2">Important Notice</h4>
            <p className="text-sm text-yellow-700">
              Please save your confirmation numbers. You can view all your booking details 
              in the &quot;My Bookings&quot; section anytime. If you need to cancel, please note that 
              cancellation fees apply based on the timing of your cancellation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;