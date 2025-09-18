import { db } from '../config/firebase.js';

export class UserService {
  static async getUsersByEmails(emails) {
    try {
      const usersRef = db.ref('users');
      const users = [];
      
      for (const email of emails) {
        const snapshot = await usersRef.orderByChild('email').equalTo(email).once('value');
        const userData = snapshot.val();
        
        if (userData) {
          const [userId, user] = Object.entries(userData)[0];
          users.push({
            id: userId,
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
          });
        } else {
          users.push({
            id: null,
            email,
            name: email.split('@')[0],
          });
        }
      }
      
      return users;
    } catch (error) {
      console.error('Error getting users by emails:', error);
      return [];
    }
  }

  static async getUserById(userId) {
    try {
      if (!userId) return null;

      console.log('Fetching user details for ID:', userId);

      // First try the direct path
      const directSnapshot = await db.ref(`users/${userId}`).once('value');
      const directData = directSnapshot.val();

      if (directData) {
        console.log('Found user data in direct path:', directData);
        return {
          id: userId,
          ...directData,
          displayName: directData.displayName || directData.email?.split('@')[0]
        };
      }

      // If not found, try searching by user ID in the users collection
      const usersRef = db.ref('users');
      const querySnapshot = await usersRef.orderByKey().equalTo(userId).once('value');
      const userData = querySnapshot.val();

      if (userData && userData[userId]) {
        console.log('Found user data in users collection:', userData[userId]);
        return {
          id: userId,
          ...userData[userId],
          displayName: userData[userId].displayName || userData[userId].email?.split('@')[0]
        };
      }

      // As a last resort, try searching by any reference to this user ID
      const allUsersSnapshot = await usersRef.once('value');
      let foundUser = null;

      allUsersSnapshot.forEach((childSnapshot) => {
        const user = childSnapshot.val();
        if (user.uid === userId || childSnapshot.key === userId) {
          foundUser = {
            id: userId,
            ...user,
            displayName: user.displayName || user.email?.split('@')[0]
          };
          return true; // Break the forEach loop
        }
      });

      if (foundUser) {
        console.log('Found user data through full search:', foundUser);
        return foundUser;
      }

      console.log('No user data found for ID:', userId);
      return null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }
}