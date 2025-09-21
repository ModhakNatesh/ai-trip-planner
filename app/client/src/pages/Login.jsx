import { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  User,
  Sparkles,
  Plane,
  Globe,
  Eye,
  EyeOff,
  CheckCircle,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../store';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    confirmPassword: '',
  });

  // <-- restored to your original hooks
  const { signUp, signIn, signInWithGoogle } = useAuth();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match');
          setIsLoading(false);
          return;
        }

        const result = await signUp(formData.email, formData.password, formData.displayName);
        if (result && result.success) {
          toast.success('Account created successfully!');
          navigate('/dashboard');
        } else {
          toast.error((result && result.error) || 'Sign up failed');
        }
      } else {
        const result = await signIn(formData.email, formData.password);
        if (result && result.success) {
          toast.success('Signed in successfully!');
          navigate('/dashboard');
        } else {
          toast.error((result && result.error) || 'Sign in failed');
        }
      }
    } catch (error) {
      toast.error(error?.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result && result.success) {
        toast.success('Signed in with Google successfully!');
        navigate('/dashboard');
      } else {
        toast.error((result && result.error) || 'Google sign-in failed');
      }
    } catch (error) {
      toast.error('Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-cyan-200 to-blue-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/4 left-1/5 w-32 h-32 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/4 right-1/5 w-24 h-24 bg-gradient-to-br from-emerald-200 to-cyan-200 rounded-full opacity-15 animate-pulse" style={{ animationDelay: '3s' }}></div>

        {/* Floating Icons */}
        <div className="absolute top-20 left-20 opacity-10 animate-bounce" style={{ animationDelay: '0.5s' }}>
          <Plane className="w-8 h-8 text-blue-500" />
        </div>
        <div className="absolute top-40 right-32 opacity-10 animate-bounce" style={{ animationDelay: '1.5s' }}>
          <Globe className="w-6 h-6 text-purple-500" />
        </div>
        <div className="absolute bottom-32 left-32 opacity-10 animate-bounce" style={{ animationDelay: '2.5s' }}>
          <Sparkles className="w-7 h-7 text-indigo-500" />
        </div>
      </div>

      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-md w-full space-y-8">
          {/* Header Section */}
          <div className="text-center">
            {/* Floating Brand Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6 shadow-2xl animate-pulse">
              <Plane className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                {isSignUp ? 'Join Our Journey' : 'Welcome Back'}
              </span>
            </h2>
            <p className="text-lg text-slate-600 max-w-sm mx-auto leading-relaxed">
              {isSignUp ? 'Start planning your perfect trip with AI-powered assistance' : 'Continue your adventure with AI Trip Planner'}
            </p>
          </div>

          <Card className="bg-white/80 backdrop-blur-md border-0 shadow-2xl rounded-3xl overflow-hidden transform hover:shadow-3xl transition-all duration-500">
            <CardHeader className="text-center pb-6 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent">
                {isSignUp ? 'Create Account' : 'Sign In'}
              </CardTitle>
              <CardDescription className="text-base text-slate-600">
                {isSignUp ? 'Enter your details to start your journey' : 'Enter your credentials to continue your adventure'}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {isSignUp && (
                  <div className="space-y-2">
                    <label htmlFor="displayName" className="block text-sm font-semibold text-slate-700">
                      Full Name
                    </label>
                    <div className="relative">
                      {/* User Icon */}
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200 z-10" />
                      {/* Input Field */}
                      <input
                        id="displayName"
                        name="displayName"
                        type="text"
                        required={isSignUp}
                        placeholder="Enter your full name"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        className="pl-12 pr-4 py-3 h-12 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-0 bg-white/70 backdrop-blur-sm text-slate-700 placeholder-slate-400 font-medium transition-all duration-300 hover:bg-white/90 focus:bg-white w-full"
                      />
                    </div>
                  </div>
                )}


                <div className="space-y-4">
                  {/* Email Input */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                      Email Address
                    </label>
                    <div className="relative">
                      {/* Email Icon */}
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200 z-10" />
                      {/* Input Field */}
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-12 pr-4 py-3 h-12 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-0 bg-white/70 backdrop-blur-sm text-slate-700 placeholder-slate-400 font-medium transition-all duration-300 hover:bg-white/90 focus:bg-white w-full"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                      Password
                    </label>
                    <div className="relative">
                      {/* Password Icon */}
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200 z-10" />
                      {/* Input Field */}
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pl-12 pr-12 py-3 h-12 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-0 bg-white/70 backdrop-blur-sm text-slate-700 placeholder-slate-400 font-medium transition-all duration-300 hover:bg-white/90 focus:bg-white w-full"
                      />
                      {/* Toggle Show/Hide Password */}
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors duration-200 z-10"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {isSignUp && (
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700">
                      Confirm Password
                    </label>
                    <div className="relative">
                      {/* Lock Icon */}
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200 z-10" />
                      {/* Input Field */}
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required={isSignUp}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="pl-12 pr-12 py-3 h-12 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-0 bg-white/70 backdrop-blur-sm text-slate-700 placeholder-slate-400 font-medium transition-all duration-300 hover:bg-white/90 focus:bg-white w-full"
                      />
                      {/* Show/Hide Password */}
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors duration-200 z-10"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                )}


                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Please wait...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Sparkles className="mr-2 h-5 w-5" />
                      {isSignUp ? 'Create Account' : 'Sign In'}
                    </div>
                  )}
                </Button>
              </form>

              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-slate-500 font-medium">Or continue with</span>
                  </div>
                </div>

                <div className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 text-lg font-semibold border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none bg-white/70 backdrop-blur-sm"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    {/* Google SVG Icon */}
                    <svg
                      className="h-5 w-5 mr-3"
                      viewBox="0 0 533.5 544.3"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M533.5 278.4c0-17.7-1.5-34.8-4.4-51.4H272v97.3h146.9c-6.3 33.8-25.1 62.4-53.5 81.6v67h86.5c50.5-46.4 81.6-115.2 81.6-194.5z"
                        fill="#4285F4"
                      />
                      <path
                        d="M272 544.3c72.9 0 134-24.2 178.6-65.6l-86.5-67c-24.1 16.1-55 25.7-92.1 25.7-70.9 0-131-47.8-152.4-111.8H31.3v69.8C76.1 488 169 544.3 272 544.3z"
                        fill="#34A853"
                      />
                      <path
                        d="M119.6 332.4c-9.4-27.7-9.4-57.6 0-85.3v-69.8H31.3c-40.7 81.5-40.7 177.4 0 258.9l88.3-69.8z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M272 107.7c39.6-.6 77.4 14 106.3 40.6l79.7-79.7C405.4 24.2 344.3 0 272 0 169 0 76.1 56.3 31.3 139.4l88.3 69.8c21.4-64 81.5-111.5 152.4-101.5z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continue with Google
                  </Button>
                </div>
              </div>

              <div className="mt-8 text-center">
                <button
                  type="button"
                  className="text-base font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 hover:underline"
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>

              {/* Trust Indicators */}
              {isSignUp && (
                <div className="mt-6 flex justify-center items-center space-x-6 text-slate-500 text-sm">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
                    <span>No spam</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
                    <span>Secure</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer Text */}
          <p className="text-center text-sm text-slate-500">
            By continuing, you agree to our{' '}
            <button className="text-blue-600 hover:text-blue-700 hover:underline transition-colors duration-200">
              Terms of Service
            </button>{' '}
            and{' '}
            <button className="text-blue-600 hover:text-blue-700 hover:underline transition-colors duration-200">
              Privacy Policy
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
