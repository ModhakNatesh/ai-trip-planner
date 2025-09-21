import { db } from '../config/firebase.js';
import { callVertexAI } from '../services/vertexService.js';
import { UserService } from '../services/userService.js';

export class TripController {
  static async getUserTrips(req, res) {
    try {
      const uid = req.user?.uid || 'anonymous';

      if (!db) {
        return res.status(500).json({
          success: false,
          error: 'Database not initialized'
        });
      }

      if (uid === 'anonymous') {
        return res.json({
          success: true,
          trips: [],
          message: 'Please log in to view your trips'
        });
      }

      // Fetch all trips from the database
      const allTripsRef = db.ref('trips');
      const snapshot = await allTripsRef.once('value');
      
      const trips = [];
      const userEmail = req.user?.email;

      // Iterate through all users' trips
      snapshot.forEach((userSnapshot) => {
        userSnapshot.forEach((tripSnapshot) => {
          const trip = {
            id: tripSnapshot.key,
            ...tripSnapshot.val()
          };

          // Add trip if user is the owner
          if (trip.userId === uid) {
            trips.unshift({
              ...trip,
              role: 'owner'
            });
          }
          // Add trip if user is a participant
          else if (userEmail && trip.participants && trip.participants.includes(userEmail)) {
            trips.unshift({
              ...trip,
              role: 'participant'
            });
          }
        });
      });

      // Sort by creation date
      trips.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      res.json({
        success: true,
        trips
      });
    } catch (error) {
      console.error('Get trips error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get trips'
      });
    }
  }

  static async createTrip(req, res) {
    try {
      const uid = req.user?.uid || 'anonymous';
      const { destination, startDate, endDate, budget, preferences, participants } = req.body;

      if (!destination || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'Destination, start date, and end date are required'
        });
      }

      if (!db) {
        return res.status(500).json({
          success: false,
          error: 'Database not initialized'
        });
      }

      if (uid === 'anonymous') {
        const demoTrip = {
          id: 'demo-' + Date.now(),
          userId: 'anonymous',
          destination,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          budget,
          preferences: preferences || {},
          participants: participants || [],
          status: 'planning',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDemoTrip: true
        };

        return res.status(201).json({
          success: true,
          trip: demoTrip,
          message: 'Demo trip created. Please log in to save trips permanently.'
        });
      }

      const tripData = {
        userId: uid,
        userEmail: req.user.email, // Store owner's email
        userName: req.user.displayName || req.user.email.split('@')[0], // Store owner's name
        destination,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        budget,
        preferences: preferences || {},
        participants: participants || [],
        status: 'planning',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const newTripRef = db.ref(`trips/${uid}`).push();
      await newTripRef.set(tripData);

      // Send notifications to participants if any
      if (participants && participants.length > 0) {
        for (const email of participants) {
          // TODO: Implement email notification service
          console.log(`Notification sent to ${email} for trip to ${destination}`);
        }
      }

      res.status(201).json({
        success: true,
        trip: {
          id: newTripRef.key,
          ...tripData
        }
      });
    } catch (error) {
      console.error('Create trip error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create trip'
      });
    }
  }

  static async getTripById(req, res) {
    try {
      const uid = req.user?.uid || 'anonymous';
      const userEmail = req.user?.email;
      const { id } = req.params;

      if (!db) {
        return res.status(500).json({
          success: false,
          error: 'Database not initialized'
        });
      }

      // First try to find the trip in the user's own trips
      const tripRef = db.ref(`trips/${uid}/${id}`);
      const snapshot = await tripRef.once('value');
      let trip = snapshot.val();
      let role = 'owner';

      // If not found in own trips, search in all trips
      if (!trip && userEmail) {
        const allTripsRef = db.ref('trips');
        const allTripsSnapshot = await allTripsRef.once('value');

        allTripsSnapshot.forEach((userSnapshot) => {
          const ownerId = userSnapshot.key; // Get the owner's user ID
          userSnapshot.forEach((tripSnapshot) => {
            if (tripSnapshot.key === id) {
              const potentialTrip = tripSnapshot.val();
              if (potentialTrip.participants && potentialTrip.participants.includes(userEmail)) {
                trip = potentialTrip;
                trip.id = tripSnapshot.key;
                trip.ownerId = ownerId; // Store the owner's ID
                role = 'participant';
              }
            }
          });
        });
      }

      if (!trip) {
        return res.status(404).json({
          success: false,
          error: 'Trip not found'
        });
      }

      // Determine owner details
      let ownerName, ownerEmail;
      
      if (role === 'owner') {
        // If current user is owner, use their details from the request
        ownerName = req.user.displayName || req.user.email.split('@')[0];
        ownerEmail = req.user.email;
      } else {
        // For participants, use the stored trip owner details
        ownerName = trip.userName || trip.userEmail?.split('@')[0];
        ownerEmail = trip.userEmail;

        // If stored details are missing, try to fetch from users collection
        if (!ownerName || !ownerEmail) {
          const owner = await UserService.getUserById(trip.userId);
          if (owner) {
            ownerName = owner.displayName || owner.email?.split('@')[0];
            ownerEmail = owner.email;
          }
        }
      }
      
      // Get participant details
      const participantDetails = await UserService.getUsersByEmails(trip.participants || []);

      // For debugging
      console.log('Owner details:', {
        ownerName,
        ownerEmail,
        role,
        userId: trip.userId,
        storedUserName: trip.userName,
        storedUserEmail: trip.userEmail
      });

      res.json({
        success: true,
        trip: {
          id,
          ...trip,
          role,
          ownerName: ownerName || 'Unknown',
          ownerEmail: ownerEmail || 'unknown@email.com',
          participantDetails
        }
      });
    } catch (error) {
      console.error('Get trip error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get trip'
      });
    }
  }

  static async updateTrip(req, res) {
    try {
      const uid = req.user?.uid;
      const { id } = req.params;
      const updates = req.body;

      if (uid === 'anonymous') {
        return res.status(401).json({
          success: false,
          error: 'Please log in to update trips'
        });
      }

      const tripRef = db.ref(`trips/${uid}/${id}`);
      const snapshot = await tripRef.once('value');
      const trip = snapshot.val();

      if (!trip) {
        return res.status(404).json({
          success: false,
          error: 'Trip not found'
        });
      }

      // Prevent editing if payment is made
      if (trip.paymentStatus === 'paid') {
        return res.status(400).json({
          success: false,
          error: 'Cannot edit trip after payment has been made'
        });
      }

      const updatedTrip = {
        ...trip,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // If trip was booked but not paid, reset booking status when edited
      if (trip.bookingStatus === 'booked' && trip.paymentStatus !== 'paid') {
        updatedTrip.bookingStatus = null;
        updatedTrip.paymentStatus = null;
        updatedTrip.bookingDetails = null;
        updatedTrip.bookedAt = null;
      }

      await tripRef.update(updatedTrip);

      res.json({
        success: true,
        trip: {
          id,
          ...updatedTrip
        }
      });
    } catch (error) {
      console.error('Update trip error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update trip'
      });
    }
  }

  static async deleteTrip(req, res) {
    try {
      const uid = req.user?.uid;
      const { id } = req.params;

      if (uid === 'anonymous') {
        return res.status(401).json({
          success: false,
          error: 'Please log in to delete trips'
        });
      }

      const tripRef = db.ref(`trips/${uid}/${id}`);
      await tripRef.remove();

      res.json({
        success: true,
        message: 'Trip deleted successfully'
      });
    } catch (error) {
      console.error('Delete trip error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete trip'
      });
    }
  }

  static async generateItinerary(req, res) {
    try {
      const uid = req.user?.uid;
      const { id } = req.params;
      const { preferences } = req.body;

      if (uid === 'anonymous') {
        return res.status(401).json({
          success: false,
          error: 'Please log in to generate itinerary'
        });
      }

      const tripRef = db.ref(`trips/${uid}/${id}`);
      const snapshot = await tripRef.once('value');
      const trip = snapshot.val();

      if (!trip) {
        return res.status(404).json({
          success: false,
          error: 'Trip not found'
        });
      }

      console.log('🎯 Generating itinerary for trip:', {
        tripId: id,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        budget: trip.budget
      });

      // Generate itinerary using VertexAI
      const response = await callVertexAI({
        trip: { id, ...trip },
        preferences
      });

      console.log('📝 Vertex AI response:', {
        success: response.success,
        fallback: response.fallback,
        hasData: !!response.data,
        dataStructure: response.data ? Object.keys(response.data) : null
      });

      if (!response.success && !response.fallback) {
        console.error('❌ Vertex AI failed completely:', response.error);
        return res.status(500).json({
          success: false,
          error: 'Failed to generate itinerary',
          details: response.error
        });
      }

      const itinerary = response.data;

      // Validate itinerary structure
      if (!itinerary || typeof itinerary !== 'object') {
        console.error('❌ Invalid itinerary structure:', itinerary);
        return res.status(500).json({
          success: false,
          error: 'Generated itinerary has invalid structure'
        });
      }

      console.log('✅ Valid itinerary generated, updating trip...');

      // Update trip with generated itinerary
      await tripRef.update({
        itinerary,
        status: 'planned',
        updatedAt: new Date().toISOString()
      });

      console.log('🎉 Trip updated successfully with itinerary');

      const responseData = {
        success: true,
        trip: {
          id,
          ...trip,
          itinerary,
          status: 'planned'
        },
        message: response.fallback ? 'Itinerary generated using fallback content' : 'Itinerary generated successfully'
      };

      // Log response size for debugging
      console.log('📤 Sending response with itinerary size:', JSON.stringify(responseData).length, 'characters');

      res.json(responseData);
    } catch (error) {
      console.error('Generate itinerary error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate itinerary'
      });
    }
  }

  static async addParticipants(req, res) {
    try {
      const uid = req.user?.uid;
      const { tripId } = req.params;
      const { participants } = req.body;

      if (!Array.isArray(participants)) {
        return res.status(400).json({
          success: false,
          error: 'Participants must be an array'
        });
      }

      if (uid === 'anonymous') {
        return res.status(401).json({
          success: false,
          error: 'Please log in to manage participants'
        });
      }

      const tripRef = db.ref(`trips/${uid}/${tripId}`);
      const snapshot = await tripRef.once('value');
      const trip = snapshot.val();

      if (!trip) {
        return res.status(404).json({
          success: false,
          error: 'Trip not found'
        });
      }

      const currentParticipants = trip.participants || [];
      const newParticipants = [...new Set([...currentParticipants, ...participants])];

      await tripRef.update({
        participants: newParticipants,
        updatedAt: new Date().toISOString()
      });

      // Send notifications to new participants
      for (const email of participants) {
        // TODO: Implement email notification service
        console.log(`Notification sent to ${email} for trip to ${trip.destination}`);
      }

      res.json({
        success: true,
        message: 'Participants added successfully',
        participants: newParticipants
      });
    } catch (error) {
      console.error('Add participants error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add participants'
      });
    }
  }

  static async removeParticipant(req, res) {
    try {
      const uid = req.user?.uid;
      const { tripId, email } = req.params;

      if (uid === 'anonymous') {
        return res.status(401).json({
          success: false,
          error: 'Please log in to manage participants'
        });
      }

      const tripRef = db.ref(`trips/${uid}/${tripId}`);
      const snapshot = await tripRef.once('value');
      const trip = snapshot.val();

      if (!trip) {
        return res.status(404).json({
          success: false,
          error: 'Trip not found'
        });
      }

      const currentParticipants = trip.participants || [];
      const updatedParticipants = currentParticipants.filter(p => p !== email);

      await tripRef.update({
        participants: updatedParticipants,
        updatedAt: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Participant removed successfully',
        participants: updatedParticipants
      });
    } catch (error) {
      console.error('Remove participant error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove participant'
      });
    }
  }

  static async getParticipants(req, res) {
    try {
      const uid = req.user?.uid;
      const { tripId } = req.params;

      if (uid === 'anonymous') {
        return res.status(401).json({
          success: false,
          error: 'Please log in to view participants'
        });
      }

      const tripRef = db.ref(`trips/${uid}/${tripId}`);
      const snapshot = await tripRef.once('value');
      const trip = snapshot.val();

      if (!trip) {
        return res.status(404).json({
          success: false,
          error: 'Trip not found'
        });
      }

      res.json({
        success: true,
        participants: trip.participants || []
      });
    } catch (error) {
      console.error('Get participants error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get participants'
      });
    }
  }

  static async bookTrip(req, res) {
    try {
      const uid = req.user?.uid;
      const { id } = req.params;

      if (uid === 'anonymous') {
        return res.status(401).json({
          success: false,
          error: 'Please log in to book trips'
        });
      }

      const tripRef = db.ref(`trips/${uid}/${id}`);
      const snapshot = await tripRef.once('value');
      const trip = snapshot.val();

      if (!trip) {
        return res.status(404).json({
          success: false,
          error: 'Trip not found'
        });
      }

      if (!trip.itinerary) {
        return res.status(400).json({
          success: false,
          error: 'Cannot book trip without itinerary. Please generate itinerary first.'
        });
      }

      if (trip.bookingStatus === 'paid') {
        return res.status(400).json({
          success: false,
          error: 'Trip is already booked and paid for'
        });
      }

      // Generate dummy booking details
      const bookingDetails = TripController.generateBookingDetails(trip);

      const bookingData = {
        bookingStatus: 'booked',
        paymentStatus: 'pending',
        bookingDetails,
        bookedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await tripRef.update(bookingData);

      res.json({
        success: true,
        message: 'Trip booked successfully! Proceed to payment.',
        trip: {
          id,
          ...trip,
          ...bookingData
        }
      });
    } catch (error) {
      console.error('Book trip error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to book trip'
      });
    }
  }

  static async processPayment(req, res) {
    try {
      const uid = req.user?.uid;
      const { id } = req.params;

      if (uid === 'anonymous') {
        return res.status(401).json({
          success: false,
          error: 'Please log in to process payment'
        });
      }

      const tripRef = db.ref(`trips/${uid}/${id}`);
      const snapshot = await tripRef.once('value');
      const trip = snapshot.val();

      if (!trip) {
        return res.status(404).json({
          success: false,
          error: 'Trip not found'
        });
      }

      if (trip.bookingStatus !== 'booked') {
        return res.status(400).json({
          success: false,
          error: 'Trip must be booked before payment'
        });
      }

      if (trip.paymentStatus === 'paid') {
        return res.status(400).json({
          success: false,
          error: 'Payment already processed'
        });
      }

      // Simulate payment processing
      const paymentData = {
        paymentStatus: 'paid',
        paidAt: new Date().toISOString(),
        paymentId: 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        updatedAt: new Date().toISOString()
      };

      await tripRef.update(paymentData);

      res.json({
        success: true,
        message: 'Payment processed successfully!',
        trip: {
          id,
          ...trip,
          ...paymentData
        }
      });
    } catch (error) {
      console.error('Process payment error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process payment'
      });
    }
  }

  static async cancelBooking(req, res) {
    try {
      const uid = req.user?.uid;
      const { id } = req.params;

      if (uid === 'anonymous') {
        return res.status(401).json({
          success: false,
          error: 'Please log in to cancel booking'
        });
      }

      const tripRef = db.ref(`trips/${uid}/${id}`);
      const snapshot = await tripRef.once('value');
      const trip = snapshot.val();

      if (!trip) {
        return res.status(404).json({
          success: false,
          error: 'Trip not found'
        });
      }

      if (trip.paymentStatus !== 'paid') {
        return res.status(400).json({
          success: false,
          error: 'Can only cancel paid bookings'
        });
      }

      if (trip.cancellationStatus === 'cancelled') {
        return res.status(400).json({
          success: false,
          error: 'Booking is already cancelled'
        });
      }

      // Calculate refund based on days until trip
      const refundInfo = TripController.calculateRefund(trip);

      const cancellationData = {
        cancellationStatus: 'cancelled',
        cancelledAt: new Date().toISOString(),
        refundInfo,
        updatedAt: new Date().toISOString()
      };

      await tripRef.update(cancellationData);

      res.json({
        success: true,
        message: 'Booking cancelled successfully',
        refundInfo,
        trip: {
          id,
          ...trip,
          ...cancellationData
        }
      });
    } catch (error) {
      console.error('Cancel booking error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel booking'
      });
    }
  }

  static async regenerateItinerary(req, res) {
    try {
      const uid = req.user?.uid;
      const { id } = req.params;
      const { excludedPlaces, preferences } = req.body;

      if (uid === 'anonymous') {
        return res.status(401).json({
          success: false,
          error: 'Please log in to regenerate itinerary'
        });
      }

      const tripRef = db.ref(`trips/${uid}/${id}`);
      const snapshot = await tripRef.once('value');
      const trip = snapshot.val();

      if (!trip) {
        return res.status(404).json({
          success: false,
          error: 'Trip not found'
        });
      }

      if (trip.paymentStatus === 'paid') {
        return res.status(400).json({
          success: false,
          error: 'Cannot modify itinerary after payment has been made'
        });
      }

      // Generate new itinerary with excluded places
      const response = await callVertexAI({
        trip: { id, ...trip },
        preferences: { ...preferences, excludedPlaces }
      });

      if (!response.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to regenerate itinerary',
          details: response.error
        });
      }

      const itinerary = response.data;

      // Reset booking status if itinerary changes after booking
      const updateData = {
        itinerary,
        status: 'planned',
        updatedAt: new Date().toISOString()
      };

      // If trip was booked but not paid, reset booking status
      if (trip.bookingStatus === 'booked' && trip.paymentStatus !== 'paid') {
        updateData.bookingStatus = null;
        updateData.paymentStatus = null;
        updateData.bookingDetails = null;
        updateData.bookedAt = null;
      }

      await tripRef.update(updateData);

      res.json({
        success: true,
        message: 'Itinerary regenerated successfully!',
        trip: {
          id,
          ...trip,
          ...updateData
        }
      });
    } catch (error) {
      console.error('Regenerate itinerary error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to regenerate itinerary'
      });
    }
  }

  // Helper method to generate dummy booking details
  static generateBookingDetails(trip) {
    const hotels = [
      'Grand Plaza Hotel', 'City Center Inn', 'Luxury Resort & Spa', 
      'Boutique Hotel', 'Mountain View Lodge', 'Seaside Resort'
    ];
    
    const flights = [
      'Flight AA123', 'Flight DL456', 'Flight UA789', 
      'Flight SW101', 'Flight JB202', 'Flight AS303'
    ];

    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    return {
      accommodation: {
        name: hotels[Math.floor(Math.random() * hotels.length)],
        checkIn: trip.startDate,
        checkOut: trip.endDate,
        nights: nights,
        confirmationNumber: 'HTL' + Date.now().toString().slice(-6)
      },
      flights: {
        outbound: {
          flightNumber: flights[Math.floor(Math.random() * flights.length)],
          departure: trip.startDate,
          confirmationNumber: 'FLT' + Date.now().toString().slice(-6)
        },
        return: {
          flightNumber: flights[Math.floor(Math.random() * flights.length)],
          departure: trip.endDate,
          confirmationNumber: 'FLT' + (Date.now() + 1).toString().slice(-6)
        }
      },
      totalCost: trip.budget || Math.floor(Math.random() * 5000) + 1000
    };
  }

  // Helper method to calculate refund based on cancellation timing
  static calculateRefund(trip) {
    const tripStartDate = new Date(trip.startDate);
    const currentDate = new Date();
    const daysUntilTrip = Math.ceil((tripStartDate - currentDate) / (1000 * 60 * 60 * 24));
    
    let refundPercentage;
    let cancellationFee;

    if (daysUntilTrip >= 30) {
      refundPercentage = 70; // 30% cancellation fee
      cancellationFee = 30;
    } else if (daysUntilTrip >= 14) {
      refundPercentage = 60; // 40% cancellation fee
      cancellationFee = 40;
    } else if (daysUntilTrip >= 7) {
      refundPercentage = 50; // 50% cancellation fee
      cancellationFee = 50;
    } else {
      refundPercentage = 0; // No refund
      cancellationFee = 100;
    }

    const totalCost = trip.bookingDetails?.totalCost || trip.budget || 0;
    const refundAmount = Math.floor((totalCost * refundPercentage) / 100);

    return {
      daysUntilTrip,
      cancellationFeePercentage: cancellationFee,
      refundPercentage,
      totalCost,
      refundAmount,
      cancellationFeeAmount: totalCost - refundAmount
    };
  }
}