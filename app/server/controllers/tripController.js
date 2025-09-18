import { db } from '../config/firebase.js';
import { callVertexAI } from '../services/vertexService.js';

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
          userSnapshot.forEach((tripSnapshot) => {
            if (tripSnapshot.key === id) {
              const potentialTrip = tripSnapshot.val();
              if (potentialTrip.participants && potentialTrip.participants.includes(userEmail)) {
                trip = potentialTrip;
                trip.id = tripSnapshot.key;
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

      res.json({
        success: true,
        trip: {
          id,
          ...trip,
          role // Include the role in the response
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

      const updatedTrip = {
        ...trip,
        ...updates,
        updatedAt: new Date().toISOString()
      };

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

      // Generate itinerary using VertexAI
      const itinerary = await callVertexAI({
        trip: { id, ...trip },
        preferences
      });

      // Update trip with generated itinerary
      await tripRef.update({
        itinerary,
        status: 'planned',
        updatedAt: new Date().toISOString()
      });

      res.json({
        success: true,
        trip: {
          id,
          ...trip,
          itinerary,
          status: 'planned'
        }
      });
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
}