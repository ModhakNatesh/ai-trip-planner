import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Lock, 
  CheckCircle, 
  ArrowLeft,
  DollarSign,
  Calendar,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const Payment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: ''
  });

  useEffect(() => {
    loadTripDetails();
  }, [id]);

  const loadTripDetails = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getTripById(id);
      const tripData = response.data.trip;
      
      if (tripData.paymentStatus === 'paid') {
        toast.error('Payment already completed for this trip');
        navigate('/bookings');
        return;
      }
      
      if (tripData.bookingStatus !== 'booked') {
        toast.error('Trip must be booked before payment');
        navigate(`/trip/${id}`);
        return;
      }

      setTrip(tripData);
    } catch (error) {
      toast.error('Failed to load trip details');
      console.error('Load trip details error:', error);
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      const formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      setPaymentData(prev => ({ ...prev, [name]: formattedValue }));
    } 
    // Format expiry date
    else if (name === 'expiryDate') {
      const formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
      setPaymentData(prev => ({ ...prev, [name]: formattedValue }));
    }
    // Format CVV (3-4 digits only)
    else if (name === 'cvv') {
      const formattedValue = value.replace(/\D/g, '').slice(0, 4);
      setPaymentData(prev => ({ ...prev, [name]: formattedValue }));
    }
    else {
      setPaymentData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv || !paymentData.nameOnCard) {
      toast.error('Please fill in all payment details');
      return;
    }

    try {
      setIsProcessing(true);
      toast.loading('Processing payment...', { id: 'payment' });
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await apiService.processPayment(id);
      
      toast.success('Payment successful!', { id: 'payment' });
      
      // Navigate to success page
      navigate('/payment-success', { 
        state: { 
          trip: response.data.trip,
          paymentId: response.data.trip.paymentId 
        } 
      });
      
    } catch (error) {
      toast.error('Payment failed. Please try again.', { id: 'payment' });
      console.error('Payment error:', error);
    } finally {
      setIsProcessing(false);
    }
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => navigate(`/trip/${id}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Trip
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Trip Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Trip Summary
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
            
            {trip.bookingDetails && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex justify-between">
                  <span>Accommodation</span>
                  <span className="font-medium">{trip.bookingDetails.accommodation.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Flights</span>
                  <span className="font-medium">Included</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total Amount</span>
                  <span className="text-primary">
                    ${trip.bookingDetails.totalCost?.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Payment Details
            </CardTitle>
            <CardDescription>
              <div className="flex items-center text-green-600">
                <Lock className="h-4 w-4 mr-1" />
                Your payment information is secure
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name on Card</label>
                <Input
                  type="text"
                  name="nameOnCard"
                  value={paymentData.nameOnCard}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Card Number</label>
                <Input
                  type="text"
                  name="cardNumber"
                  value={paymentData.cardNumber}
                  onChange={handleInputChange}
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Expiry Date</label>
                  <Input
                    type="text"
                    name="expiryDate"
                    value={paymentData.expiryDate}
                    onChange={handleInputChange}
                    placeholder="MM/YY"
                    maxLength="5"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CVV</label>
                  <Input
                    type="text"
                    name="cvv"
                    value={paymentData.cvv}
                    onChange={handleInputChange}
                    placeholder="123"
                    maxLength="4"
                    required
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Payment Information</p>
                    <p>This is a demo payment system. No real charges will be made.</p>
                  </div>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Pay ${trip.bookingDetails?.totalCost?.toLocaleString() || '0'}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Payment;