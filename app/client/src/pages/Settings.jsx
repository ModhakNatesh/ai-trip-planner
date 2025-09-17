import { useState, useEffect } from 'react';
import { User, Save, Camera } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { useAuthStore } from '../store';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, updateUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    preferences: {
      budget: '',
      travelStyle: '',
      interests: [],
    },
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.displayName || '',
        email: user.email || '',
        preferences: user.preferences || {
          budget: '',
          travelStyle: '',
          interests: [],
        },
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('preferences.')) {
      const prefKey = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefKey]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleInterestToggle = (interest) => {
    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        interests: prev.preferences.interests.includes(interest)
          ? prev.preferences.interests.filter((i) => i !== interest)
          : [...prev.preferences.interests, interest],
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiService.updateUser({
        name: formData.name,
        preferences: formData.preferences,
      });

      updateUser({
        displayName: formData.name,
        preferences: formData.preferences,
      });

      toast.success('Settings updated successfully!');
    } catch (error) {
      toast.error('Failed to update settings');
      console.error('Update settings error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const interests = [
    'Adventure',
    'Culture',
    'Food',
    'History',
    'Nature',
    'Photography',
    'Architecture',
    'Museums',
    'Beaches',
    'Mountains',
    'Cities',
    'Wildlife',
  ];

  const travelStyles = [
    { value: 'budget', label: 'Budget Traveler' },
    { value: 'mid-range', label: 'Mid-range' },
    { value: 'luxury', label: 'Luxury' },
    { value: 'backpacking', label: 'Backpacking' },
    { value: 'family', label: 'Family-friendly' },
    { value: 'solo', label: 'Solo Travel' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Page Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account and travel preferences
          </p>
        </div>

        {/* Profile Information */}
        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2 text-primary" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your basic profile information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar & Info */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative group">
                  <img
                    src={
                      user?.photoURL ||
                      `https://ui-avatars.com/api/?name=${
                        user?.displayName || user?.email
                      }&background=3b82f6&color=fff&size=80`
                    }
                    alt="Profile"
                    className="h-20 w-20 rounded-full ring-2 ring-primary/30"
                  />
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 bg-primary text-white p-1 rounded-full hover:bg-primary/90 transition-colors"
                  >
                    <Camera className="h-3 w-3" />
                  </button>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {user?.displayName || 'Anonymous'}
                  </h3>
                  <p className="text-gray-600">{user?.email}</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Full Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email Address
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-gray-100 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed
                  </p>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Travel Preferences */}
        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader>
            <CardTitle>Travel Preferences</CardTitle>
            <CardDescription>
              Help us personalize your trip recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Budget & Travel Style */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="preferences.budget"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Typical Budget (per trip)
                </label>
                <select
                  id="preferences.budget"
                  name="preferences.budget"
                  value={formData.preferences.budget}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select budget range</option>
                  <option value="under-500">Under $500</option>
                  <option value="500-1000">$500 - $1,000</option>
                  <option value="1000-2500">$1,000 - $2,500</option>
                  <option value="2500-5000">$2,500 - $5,000</option>
                  <option value="over-5000">Over $5,000</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="preferences.travelStyle"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Travel Style
                </label>
                <select
                  id="preferences.travelStyle"
                  name="preferences.travelStyle"
                  value={formData.preferences.travelStyle}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select travel style</option>
                  {travelStyles.map((style) => (
                    <option key={style.value} value={style.value}>
                      {style.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Interests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Interests
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {interests.map((interest) => (
                  <label
                    key={interest}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.preferences.interests.includes(
                        interest
                      )}
                      onChange={() => handleInterestToggle(interest)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">{interest}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full md:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
