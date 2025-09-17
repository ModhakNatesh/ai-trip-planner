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

      // Realtime Database syntax
      const tripsRef = db.ref(`trips/${uid}`);
      const snapshot = await tripsRef.orderByChild('createdAt').once('value');
      
      const trips = [];
      snapshot.forEach((childSnapshot) => {
        trips.unshift({ // unshift to get newest first
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

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
      const { destination, startDate, endDate, budget, preferences } = req.body;

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
        status: 'planning',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Generate a new key and save to Realtime Database
      const newTripRef = db.ref(`trips/${uid}`).push();
      await newTripRef.set(tripData);

      res.status(201).json({
        success: true,
        trip: { id: newTripRef.key, ...tripData }
      });
    } catch (error) {
      console.error('Create trip error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create trip',
        details: error.message
      });
    }
  }

  static async getTripById(req, res) {
    try {
      const uid = req.user?.uid || 'anonymous';
      const { id } = req.params;

      if (!db) {
        return res.status(500).json({
          success: false,
          error: 'Database not initialized'
        });
      }

      if (uid === 'anonymous' && id.startsWith('demo-')) {
        return res.status(200).json({
          success: true,
          trip: {
            id: id,
            destination: 'Demo Destination',
            status: 'planning',
            isDemoTrip: true
          },
          message: 'Demo trip data. Please log in for full functionality.'
        });
      }

      // Get trip from Realtime Database
      const tripRef = db.ref(`trips/${uid}/${id}`);
      const snapshot = await tripRef.once('value');

      if (!snapshot.exists()) {
        return res.status(404).json({
          success: false,
          error: 'Trip not found'
        });
      }

      const tripData = snapshot.val();

      res.json({
        success: true,
        trip: { id: snapshot.key, ...tripData }
      });
    } catch (error) {
      console.error('Get trip error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get trip',
        details: error.message
      });
    }
  }

  static async updateTrip(req, res) {
    try {
      const uid = req.user?.uid || 'anonymous';
      const { id } = req.params;
      const { destination, startDate, endDate, budget, preferences, status } = req.body;

      if (uid === 'anonymous' && id.startsWith('demo-')) {
        return res.json({
          success: true,
          trip: {
            id: id,
            destination: destination || 'Demo Destination',
            status: status || 'planning',
            updatedAt: new Date().toISOString(),
            isDemoTrip: true
          },
          message: 'Demo trip updated. Please log in to save changes permanently.'
        });
      }

      if (!db) {
        return res.status(500).json({
          success: false,
          error: 'Database not initialized'
        });
      }

      const updateData = {
        ...(destination && { destination }),
        ...(startDate && { startDate: new Date(startDate).toISOString() }),
        ...(endDate && { endDate: new Date(endDate).toISOString() }),
        ...(budget && { budget }),
        ...(preferences && { preferences }),
        ...(status && { status }),
        updatedAt: new Date().toISOString()
      };

      // Update in Realtime Database
      const tripRef = db.ref(`trips/${uid}/${id}`);
      await tripRef.update(updateData);

      // Get updated trip
      const snapshot = await tripRef.once('value');
      const tripData = snapshot.val();

      res.json({
        success: true,
        trip: { id, ...tripData }
      });
    } catch (error) {
      console.error('Update trip error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update trip',
        details: error.message
      });
    }
  }

  static async deleteTrip(req, res) {
    try {
      const uid = req.user?.uid || 'anonymous';
      const { id } = req.params;

      if (uid === 'anonymous' && id.startsWith('demo-')) {
        return res.json({
          success: true,
          message: 'Demo trip deleted. Please log in to manage real trips.'
        });
      }

      if (!db) {
        return res.status(500).json({
          success: false,
          error: 'Database not initialized'
        });
      }

      // Delete from Realtime Database
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
        error: 'Failed to delete trip',
        details: error.message
      });
    }
  }

  static async generateItinerary(req, res) {
    try {
      const uid = req.user?.uid || 'anonymous';
      const { id } = req.params;
      const { preferences } = req.body;

      if (uid === 'anonymous' && id.startsWith('demo-')) {
        const demoItinerary = {
          day1: {
            activities: ['Visit local attractions', 'Try local cuisine'],
            accommodation: 'Demo Hotel'
          },
          day2: {
            activities: ['Explore city center', 'Shopping'],
            accommodation: 'Demo Hotel'
          }
        };

        return res.json({
          success: true,
          itinerary: demoItinerary,
          message: 'Demo itinerary generated. Please log in for AI-powered planning.'
        });
      }

      if (!db) {
        return res.status(500).json({
          success: false,
          error: 'Database not initialized'
        });
      }

      // Get trip from Realtime Database
      const tripRef = db.ref(`trips/${uid}/${id}`);
      const snapshot = await tripRef.once('value');

      if (!snapshot.exists()) {
        return res.status(404).json({
          success: false,
          error: 'Trip not found'
        });
      }

      const tripData = snapshot.val();

      // Generate itinerary using Vertex AI
      const prompt = `Create a detailed travel itinerary for a trip to ${tripData.destination} from ${tripData.startDate} to ${tripData.endDate} with a budget of ${tripData.budget || 'flexible'}. Consider these preferences: ${JSON.stringify({ ...tripData.preferences, ...preferences })}`;
      
      const itinerary = await callVertexAI(prompt);

      // Update trip with generated itinerary
      await tripRef.update({
        itinerary: itinerary.data || itinerary,
        status: 'planned',
        updatedAt: new Date().toISOString()
      });

      res.json({
        success: true,
        itinerary: itinerary.data || itinerary
      });
    } catch (error) {
      console.error('Generate itinerary error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate itinerary',
        details: error.message
      });
    }
  }
}