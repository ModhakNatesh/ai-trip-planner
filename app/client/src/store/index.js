import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const useAuthStore = create(
  devtools(
    (set, _get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => set({
        user,
        isAuthenticated: !!user,
        isLoading: false
      }),

      setLoading: (isLoading) => set({ isLoading }),

      clearUser: () => set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      }),

      updateUser: (userData) => set((state) => ({
        user: { ...state.user, ...userData }
      }))
    }),
    { name: 'auth-store' }
  )
);

export const useTripStore = create(
  devtools(
    (set, _get) => ({
      trips: [],
      currentTrip: null,
      isLoading: false,
      error: null,

      setTrips: (trips) => set({ trips }),

      addTrip: (trip) => set((state) => ({
        trips: [trip, ...state.trips]
      })),

      updateTrip: (updatedTrip) => set((state) => ({
        trips: state.trips.map(trip =>
          trip.id === updatedTrip.id ? updatedTrip : trip
        ),
        currentTrip: state.currentTrip?.id === updatedTrip.id ? updatedTrip : state.currentTrip
      })),

      deleteTrip: (tripId) => set((state) => ({
        trips: state.trips.filter(trip => trip.id !== tripId),
        currentTrip: state.currentTrip?.id === tripId ? null : state.currentTrip
      })),

      setCurrentTrip: (trip) => set({ currentTrip: trip }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      // Participant management
      addParticipants: (tripId, participants) => set((state) => ({
        trips: state.trips.map(trip =>
          trip.id === tripId
            ? {
                ...trip,
                participants: [...(trip.participants || []), ...participants]
              }
            : trip
        ),
        currentTrip: state.currentTrip?.id === tripId
          ? {
              ...state.currentTrip,
              participants: [...(state.currentTrip.participants || []), ...participants]
            }
          : state.currentTrip
      })),

      removeParticipant: (tripId, email) => set((state) => ({
        trips: state.trips.map(trip =>
          trip.id === tripId
            ? {
                ...trip,
                participants: (trip.participants || []).filter(p => p !== email)
              }
            : trip
        ),
        currentTrip: state.currentTrip?.id === tripId
          ? {
              ...state.currentTrip,
              participants: (state.currentTrip.participants || []).filter(p => p !== email)
            }
          : state.currentTrip
      }))
    }),
    { name: 'trip-store' }
  )
);