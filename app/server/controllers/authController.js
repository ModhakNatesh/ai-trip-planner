import { auth, db } from '../config/firebase.js';

export class AuthController {
  static async verifyToken(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Token is required'
        });
      }

      if (!auth) {
        return res.status(500).json({
          success: false,
          error: 'Firebase Auth not initialized'
        });
      }

      const decodedToken = await auth.verifyIdToken(token);
      
      res.json({
        success: true,
        user: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          emailVerified: decodedToken.email_verified,
          name: decodedToken.name,
          picture: decodedToken.picture
        }
      });
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
  }

  static async getUser(req, res) {
    try {
      const { uid } = req.user;

      if (!db) {
        return res.status(500).json({
          success: false,
          error: 'Database not initialized'
        });
      }

      // Get user from Realtime Database
      const userRef = db.ref(`users/${uid}`);
      const snapshot = await userRef.once('value');
      
      if (!snapshot.exists()) {
        // Create user document if it doesn't exist
        const userData = {
          uid: req.user.uid,
          email: req.user.email,
          name: req.user.name,
          picture: req.user.picture,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await userRef.set(userData);
        
        return res.json({
          success: true,
          user: userData
        });
      }

      res.json({
        success: true,
        user: snapshot.val()
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user'
      });
    }
  }

  static async updateUser(req, res) {
    try {
      const uid = req.user?.uid || 'anonymous';
      const { name, preferences } = req.body;

      if (uid === 'anonymous') {
        return res.json({
          success: true,
          message: 'Demo settings updated. Please log in to save settings permanently.',
          user: {
            uid: 'anonymous',
            displayName: name || 'Demo User',
            preferences: preferences || [],
            isDemoUser: true
          }
        });
      }

      if (!db) {
        return res.status(500).json({
          success: false,
          error: 'Database not initialized'
        });
      }

      const updateData = {
        ...(name && { name }),
        ...(preferences && { preferences }),
        updatedAt: new Date().toISOString()
      };

      // Update in Realtime Database
      const userRef = db.ref(`users/${uid}`);
      await userRef.update(updateData);

      res.json({
        success: true,
        message: 'User updated successfully'
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update user'
      });
    }
  }
}