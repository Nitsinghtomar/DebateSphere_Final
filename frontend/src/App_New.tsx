import React, { useState, useEffect } from 'react';
import { ChakraProvider, useToast, Box } from '@chakra-ui/react';
import AuthPage from './AuthPage';
import Dashboard from './Dashboard';

interface User {
  username: string;
  position: 'PRO' | 'CON';
}

interface UserProfile {
  name: string;
  level: string;
  avatar: string;
  streak: number;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>({ username: 'guest_user', position: 'PRO' });
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Guest User',
    level: 'Beginner',
    avatar: '👤',
    streak: 0
  });
  const [isInitializing, setIsInitializing] = useState(true);

  const toast = useToast();

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/verify`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            setIsAuthenticated(true);
            setCurrentUser({ username: data.user.username, position: 'PRO' });
            setUserProfile({
              name: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || data.user.username,
              level: 'Beginner',
              avatar: '👤',
              streak: 0
            });
          } else {
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Auth verification error:', error);
          localStorage.removeItem('token');
        }
      }
      setIsInitializing(false);
    };

    checkAuthStatus();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsAuthenticated(true);
        setCurrentUser({ username: data.user.username, position: 'PRO' });
        setUserProfile({
          name: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || data.user.username,
          level: 'Beginner',
          avatar: '👤',
          streak: 0
        });
        localStorage.setItem('token', data.token);
        toast({ 
          title: 'Login successful!', 
          description: `Welcome back, ${data.user.username}!`, 
          status: 'success', 
          duration: 3000 
        });
      } else {
        toast({ 
          title: 'Login failed', 
          description: data.message || 'Invalid credentials', 
          status: 'error', 
          duration: 5000 
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({ 
        title: 'Login failed', 
        description: 'Network error. Please try again.', 
        status: 'error', 
        duration: 5000 
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (userData: RegisterData) => {
    setAuthLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        setIsAuthenticated(true);
        setCurrentUser({ username: data.user.username, position: 'PRO' });
        setUserProfile({
          name: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || data.user.username,
          level: 'Beginner',
          avatar: '👤',
          streak: 0
        });
        localStorage.setItem('token', data.token);
        toast({ 
          title: 'Registration successful!', 
          description: 'Welcome to DebateSphere!', 
          status: 'success', 
          duration: 3000 
        });
      } else {
        // Handle validation errors
        if (data.errors && Array.isArray(data.errors)) {
          toast({ 
            title: 'Registration failed', 
            description: data.errors.join('. '), 
            status: 'error', 
            duration: 7000 
          });
        } else {
          toast({ 
            title: 'Registration failed', 
            description: data.message || 'Please check your information and try again.', 
            status: 'error', 
            duration: 5000 
          });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({ 
        title: 'Registration failed', 
        description: 'Network error. Please try again.', 
        status: 'error', 
        duration: 5000 
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser({ username: 'guest_user', position: 'PRO' });
    setUserProfile({
      name: 'Guest User',
      level: 'Beginner',
      avatar: '👤',
      streak: 0
    });
    localStorage.removeItem('token');
    toast({ 
      title: 'Logged out', 
      description: 'You have been successfully logged out.', 
      status: 'info', 
      duration: 3000 
    });
  };

  // Show loading spinner while checking authentication
  if (isInitializing) {
    return (
      <ChakraProvider>
        <Box 
          height="100vh" 
          display="flex" 
          alignItems="center" 
          justifyContent="center"
          bg="gray.50"
        >
          <div>Loading...</div>
        </Box>
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider>
      {isAuthenticated ? (
        <Dashboard 
          user={currentUser} 
          userProfile={userProfile} 
          onLogout={handleLogout} 
        />
      ) : (
        <AuthPage 
          onLogin={handleLogin} 
          onRegister={handleRegister} 
          isLoading={authLoading} 
        />
      )}
    </ChakraProvider>
  );
};

export default App;
