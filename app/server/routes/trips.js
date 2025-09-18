import express from 'express';
import { TripController } from '../controllers/tripController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Apply optional auth middleware to all trip routes
router.use(optionalAuth);

// Trip routes
router.get('/', TripController.getUserTrips);
router.post('/', TripController.createTrip);
router.get('/:id', TripController.getTripById);
router.put('/:id', TripController.updateTrip);
router.delete('/:id', TripController.deleteTrip);
router.post('/:id/generate-itinerary', TripController.generateItinerary);

// Participant management routes
router.post('/:tripId/participants', TripController.addParticipants);
router.delete('/:tripId/participants/:email', TripController.removeParticipant);
router.get('/:tripId/participants', TripController.getParticipants);

export default router;