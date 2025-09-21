# AI Trip Planner

A full-stack web application that uses AI to help users plan their perfect trips. Built with React, Node.js, Firebase, and Google Cloud Vertex AI.

![AI Trip Planner](https://img.shields.io/badge/React-18.2.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Firebase](https://img.shields.io/badge/Firebase-10.7.1-orange)
![TypeScript](https://img.shields.io/badge/Vertex%20AI-Google%20Cloud-yellow)

## 🚀 Features

- **AI-Powered Trip Planning**: Generate personalized itineraries using Google Cloud Vertex AI
- **User Authentication**: Secure authentication with Firebase Auth (Email/Password and Google OAuth)
- **Trip Management**: Create, edit, and manage multiple trips
- **Real-time Updates**: Live synchronization of trip data across devices
- **Responsive Design**: Beautiful, mobile-first UI built with Tailwind CSS and shadcn/ui
- **Modern Architecture**: Monorepo structure with shared utilities

## 🏗️ Architecture

```
app/
├── client/          # React frontend (Vite + Tailwind + shadcn/ui)
├── server/          # Node.js backend (Express + Firebase Admin)
├── shared/          # Shared utilities and constants
├── package.json     # Root package.json with workspace scripts
└── README.md        # This file
```

### Tech Stack

**Frontend:**
- React 18 with Vite
- Tailwind CSS + shadcn/ui components
- React Router for navigation
- Zustand for state management
- Axios for API calls
- Firebase SDK for authentication

**Backend:**
- Node.js with Express
- Firebase Admin SDK
- Google Cloud Vertex AI
- CORS, Helmet, Rate limiting
- Express validation

**Database & Auth:**
- Firebase Auth for user authentication
- Firestore for data storage
- Firebase Admin SDK for server-side operations

**Development:**
- ESLint + Prettier for code formatting
- Concurrently for running multiple processes
- Environment-based configuration

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (version 18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Git](https://git-scm.com/)

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ai-trip-planner.git
cd ai-trip-planner/app
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run install-all
```

### 3. Firebase Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication and Firestore

2. **Enable Authentication Providers**
   - In Firebase Console → Authentication → Sign-in method
   - Enable Email/Password and Google

3. **Generate Service Account Key**
   - Go to Project Settings → Service Accounts
   - Generate a new private key (JSON file)
   - Save it securely (don't commit to version control)

4. **Get Web App Configuration**
   - In Project Settings → General
   - Add a web app and copy the configuration

### 4. Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` file with your Firebase and Google Cloud credentials:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...

# Frontend Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Google Cloud (Optional - for real Vertex AI)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
```

### 5. Google Cloud Setup (Optional)

For real Vertex AI integration:

1. **Enable Vertex AI API**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Vertex AI API for your project

2. **Set up Authentication**
   - Create a service account with Vertex AI permissions
   - Download the JSON key file
   - Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable

### 6. Start Development Servers

```bash
# Start both frontend and backend concurrently
npm run dev

# Or start them separately:
npm run client  # Frontend only (http://localhost:5173)
npm run server  # Backend only (http://localhost:5000)
```

## 🎯 Usage

### For Users

1. **Sign Up/Sign In**
   - Create an account or sign in with Google
   - Your authentication state is preserved across sessions

2. **Create a Trip**
   - Go to Dashboard
   - Click "Create New Trip"
   - Fill in destination, dates, and budget

3. **Generate Itinerary**
   - Click "Generate Itinerary" on any planning trip
   - AI will create a personalized itinerary based on your preferences

4. **Manage Trips**
   - View all your trips on the dashboard
   - Edit or delete trips as needed

### For Developers

#### API Endpoints

**Authentication:**
- `POST /api/auth/verify-token` - Verify Firebase token
- `GET /api/auth/user` - Get current user
- `PUT /api/auth/user` - Update user profile

**Trips:**
- `GET /api/trips` - Get user's trips
- `POST /api/trips` - Create new trip
- `GET /api/trips/:id` - Get specific trip
- `PUT /api/trips/:id` - Update trip
- `DELETE /api/trips/:id` - Delete trip
- `POST /api/trips/:id/generate-itinerary` - Generate AI itinerary

**General:**
- `GET /api/hello` - Test endpoint
- `GET /api/status` - Server status
- `GET /health` - Health check

#### Shared Utilities

The `shared/` folder contains utilities used by both client and server:

```javascript
import { validateTripData, formatDate, TRIP_STATUSES } from '../shared';
```

## 🧪 Development

### Code Formatting

```bash
# Format all code
npm run format

# Check formatting
npm run format:check

# Lint code
npm run lint

# Fix lint issues
npm run lint:fix
```

### Project Structure

```
client/
├── src/
│   ├── components/     # React components
│   ├── pages/         # Page components
│   ├── services/      # API services
│   ├── store/         # Zustand stores
│   ├── config/        # Configuration files
│   ├── hooks/         # Custom React hooks
│   └── lib/           # Utility functions
├── public/            # Static assets
└── package.json

server/
├── routes/            # Express routes
├── controllers/       # Route handlers
├── middleware/        # Express middleware
├── services/          # Business logic
├── config/            # Server configuration
├── models/            # Data models (future)
└── package.json

shared/
├── validation.js      # Validation utilities
├── dateUtils.js       # Date helper functions
├── constants.js       # Shared constants
└── index.js           # Main export
```

## 🚢 Deployment

### Frontend (Vercel/Netlify)

1. Build the client:
   ```bash
   cd client && npm run build
   ```

2. Deploy the `client/dist` folder to your hosting platform

3. Set environment variables in your hosting platform

### Backend (Railway/Heroku/Google Cloud)

1. Set up environment variables on your hosting platform

2. Deploy the `server/` folder

3. Ensure Firebase service account credentials are properly configured

### Environment Variables for Production

```env
NODE_ENV=production
CLIENT_URL=https://your-frontend-domain.com
# ... other Firebase and Google Cloud variables
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests and linting: `npm run lint`
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

### Code Style

- Use ES6+ features
- Follow the existing code style
- Add JSDoc comments for functions
- Use meaningful variable and function names
- Keep functions small and focused

## 🔧 Troubleshooting

### Common Issues

1. **Firebase Connection Issues**
   - Verify all Firebase environment variables are correct
   - Check that Firebase project has Authentication and Firestore enabled
   - Ensure service account has proper permissions

2. **CORS Errors**
   - Check that `CLIENT_URL` is set correctly in server environment
   - Verify frontend URL matches the CORS configuration

3. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check that all environment variables are set

4. **Vertex AI Issues**
   - The app uses mock data by default in development
   - For real Vertex AI, ensure Google Cloud credentials are configured
   - Check that Vertex AI API is enabled in Google Cloud Console

### Getting Help

- Check the [Issues](https://github.com/your-username/ai-trip-planner/issues) page
- Create a new issue with detailed description
- Include error messages and steps to reproduce

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - Frontend framework
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Firebase](https://firebase.google.com/) - Backend services
- [Google Cloud Vertex AI](https://cloud.google.com/vertex-ai) - AI services
- [Express.js](https://expressjs.com/) - Backend framework

## 📞 Support

For questions and support:
- Email: your-email@example.com
- GitHub Issues: [Create an issue](https://github.com/your-username/ai-trip-planner/issues)

---

**Happy Trip Planning! ✈️🗺️**