import { db } from '../config/firebase.js';
import { callVertexAI } from '../services/vertexService.js';

export class TripController {
  static async getUserTrips(req, res) {
    try {
      // Temporary: Allow unauthenticated access for testing
      const uid = req.user?.uid || 'anonymous';

      if (!db) {
        return res.status(500).json({
          success: false,
          error: 'Database not initialized'
        });
      }

      // For unauthenticated users, return empty array
      if (uid === 'anonymous') {
        return res.json({
          success: true,
          trips: [],
          message: 'Please log in to view your trips'
        });
      }

      const tripsSnapshot = await db
        .collection('trips')
        .where('userId', '==', uid)
        .orderBy('createdAt', 'desc')
        .get();

      const trips = [];
      tripsSnapshot.forEach(doc => {
        trips.push({ id: doc.id, ...doc.data() });
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
      // Temporary: Allow unauthenticated access for testing
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

      // For unauthenticated users, return a demo response
      if (uid === 'anonymous') {
        const demoTrip = {
          id: 'demo-' + Date.now(),
          userId: 'anonymous',
          destination,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          budget,
          preferences: preferences || {},
          status: 'planning',
          createdAt: new Date(),
          updatedAt: new Date(),
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
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        budget,
        preferences: preferences || {},
        status: 'planning',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const tripRef = await db.collection('trips').add(tripData);

      res.status(201).json({
        success: true,
        trip: { id: tripRef.id, ...tripData }
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
      // Temporary: Allow unauthenticated access for testing
      const uid = req.user?.uid || 'anonymous';
      const { id } = req.params;

      if (!db) {
        return res.status(500).json({
          success: false,
          error: 'Database not initialized'
        });
      }

      // For unauthenticated users with demo trips
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

      const tripDoc = await db.collection('trips').doc(id).get();

      if (!tripDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Trip not found'
        });
      }

      const tripData = tripDoc.data();

      // Check if user owns this trip (skip for anonymous)
      if (uid !== 'anonymous' && tripData.userId !== uid) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      res.json({
        success: true,
        trip: { id: tripDoc.id, ...tripData }
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
      // Temporary: Allow unauthenticated access for testing
      const uid = req.user?.uid || 'anonymous';
      const { id } = req.params;
      const { destination, startDate, endDate, budget, preferences, status } = req.body;

      // For demo trips, return a demo response
      if (uid === 'anonymous' && id.startsWith('demo-')) {
        return res.json({
          success: true,
          trip: {
            id: id,
            destination: destination || 'Demo Destination',
            status: status || 'planning',
            updatedAt: new Date(),
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

      const tripDoc = await db.collection('trips').doc(id).get();

      if (!tripDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Trip not found'
        });
      }

      const tripData = tripDoc.data();

      // Check if user owns this trip (skip for anonymous)
      if (uid !== 'anonymous' && tripData.userId !== uid) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      const updateData = {
        ...(destination && { destination }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(budget && { budget }),
        ...(preferences && { preferences }),
        ...(status && { status }),
        updatedAt: new Date()
      };

      await db.collection('trips').doc(id).update(updateData);

      res.json({
        success: true,
        trip: { id, ...tripData, ...updateData }
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
      // Temporary: Allow unauthenticated access for testing
      const uid = req.user?.uid || 'anonymous';
      const { id } = req.params;

      // For demo trips, return a demo response
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

      const tripDoc = await db.collection('trips').doc(id).get();

      if (!tripDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Trip not found'
        });
      }

      const tripData = tripDoc.data();

      // Check if user owns this trip (skip for anonymous)
      if (uid !== 'anonymous' && tripData.userId !== uid) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      await db.collection('trips').doc(id).delete();

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
      // Temporary: Allow unauthenticated access for testing
      const uid = req.user?.uid || 'anonymous';
      const { id } = req.params;
      const { preferences } = req.body;

      // For demo trips, return a demo itinerary
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

      const tripDoc = await db.collection('trips').doc(id).get();

      if (!tripDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Trip not found'
        });
      }

      const tripData = tripDoc.data();

      // Check if user owns this trip (skip for anonymous)
      if (uid !== 'anonymous' && tripData.userId !== uid) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Generate itinerary using Vertex AI
      const itinerary = await callVertexAI({
        destination: tripData.destination,
        startDate: tripData.startDate,
        endDate: tripData.endDate,
        budget: tripData.budget,
        preferences: { ...tripData.preferences, ...preferences }
      });

      // Update trip with generated itinerary
      await db.collection('trips').doc(id).update({
        itinerary,
        status: 'planned',
        updatedAt: new Date()
      });

      res.json({
        success: true,
        itinerary
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