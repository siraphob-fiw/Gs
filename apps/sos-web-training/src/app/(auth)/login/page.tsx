'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button, addToast } from '@heroui/react';
import { AuthMethodSelector, AuthMethod } from '@/components/auth/AuthMethodSelector';
import { EnhancedLoginForm, LoginData } from '@/components/auth/EnhancedLoginForm';
import { RegistrationForm, RegistrationData } from '@/components/auth/RegistrationForm';
import { UserRole } from '@strengthos/shared-types';
import { useColorScheme } from '@/lib/color-utils';

const SunIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const MoonIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);

const ShieldIcon = ({ className = 'w-8 h-8' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 1L3 5v6c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V5l-9-4z" />
  </svg>
);

function LoginPageContent() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState<'method-selector' | 'login' | 'register'>(
    'method-selector',
  );
  const [selectedAuthMethod, setSelectedAuthMethod] = useState<AuthMethod>('EMAIL');

  const { loginWithMethod, state, clearError, registerWithEmail, loginWithOAuth } = useAuth();
  const availableAuthMethods = ['EMAIL', 'OAUTH'];
  // 'WHATSAPP', 'LINE',
  const { error, isAuthenticated, user } = state;
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const { currentScheme, switchScheme } = useColorScheme();

  useEffect(() => {
    if (currentScheme) {
      setIsDarkMode(currentScheme === 'dark');
    }
  }, [currentScheme]);

  // Handle OAuth errors from URL parameters
  useEffect(() => {
    const oauthError = searchParams.get('error');
    const oauthMessage = searchParams.get('message');

    if (oauthError) {
      addToast({
        title:
          oauthError === 'oauth_denied'
            ? 'Authentication Cancelled'
            : 'OAuth Authentication Failed',
        description: oauthMessage || 'An error occurred during Google authentication',
        color: 'danger',
      });
      // Clean up URL parameters
      router.replace('/login');
    }
  }, [searchParams, router]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (
        user?.role === UserRole.SUPER_ADMIN ||
        user?.role === UserRole.COACH_ADMIN ||
        user?.role === UserRole.TENANT_ADMIN
      ) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    clearError();
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    switchScheme(newTheme ? 'dark' : 'default');
  };

  const handleMethodSelect = (method: AuthMethod) => {
    setSelectedAuthMethod(method);
    setCurrentView('login');
    clearError();
  };

  const handleLogin = async (loginData: LoginData) => {
    setIsLoading(true);
    clearError();

    if (loginData.authMethod === 'OAUTH') {
      await loginWithOAuth();
    } else if (loginData.authMethod === 'EMAIL') {
      try {
        await loginWithMethod({
          identifier: loginData.identifier,
          password: loginData.password,
          authMethod: loginData.authMethod,
          verificationToken: loginData.verificationToken,
          rememberMe: false,
        }).then((result) => {
          if (result.isAuthenticated) {
            addToast({
              title: 'Login Successful',
              description: 'You have been logged in successfully',
              color: 'primary',
            });
          } else {
            if (result.message === 'This account need to be verified first') {
              addToast({
                title: 'Login Failed',
                description: 'This account need to be verified first',
                color: 'danger',
              });
            } else {
              addToast({
                title: 'Login Failed',
                description: result.message || 'You have been logged in failed',
                color: 'danger',
              });
            }
            setIsLoading(false);
          }
        });
      } catch (err) {
        console.error('Login error in component:', err);
        throw err;
      }
    }
  };

  const handleRegister = async (registrationData: RegistrationData) => {
    setIsLoading(true);
    clearError();
    try {
      if (registrationData.authMethod === 'EMAIL') {
        await registerWithEmail({
          firstName: registrationData.firstName,
          lastName: registrationData.lastName,
          email: registrationData.email!,
          password: registrationData.password!,
          role: registrationData.role!,
        }).then((result) => {
          addToast({
            title: result.success ? 'Registration Successful' : 'Registration Failed',
            description: result.message,
            color: result.success ? 'primary' : 'danger',
          });
          if (result.success) {
            setTimeout(() => {
              handleSwitchToLogin();
            }, 1000);
          }
        });
      } else {
        // TODO: Implement phone registration functionality
        console.log('Phone Registration:', registrationData);
      }
    } catch (err) {
      console.error('Registration error in component:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToMethodSelector = () => {
    setCurrentView('method-selector');
    clearError();
  };

  const handleSwitchToRegister = () => {
    setCurrentView('register');
    clearError();
  };

  const handleSwitchToLogin = () => {
    setCurrentView('login');
    clearError();
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-black' : 'bg-white'}`}
    >
      <Button
        color="default"
        variant="solid"
        onPress={() => router.push('/')}
        className="font-medium px-4 py-2 rounded shadow fixed top-2 left-2"
      >
        Go to Home
      </Button>
      <div className="absolute top-2 right-4 z-10">
        <Button
          variant="bordered"
          onPress={toggleTheme}
          className={`p-3 rounded-full transition-colors duration-200 ${isDarkMode
            ? 'bg-gray-800 hover:bg-textSecondary text-gray-300'
            : 'bg-gray-100 hover:bg-gray-200 text-textSecondary'
            }`}
          aria-label="Toggle theme"
        >
          {isDarkMode ? <SunIcon /> : <MoonIcon />}
        </Button>
      </div>

      {isLoading && (
        <div className="z-20 absolute top-0 left-0 h-screen w-screen bg-white/50 backdrop-invert backdrop-opacity-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      <div className="flex min-h-screen">
        {/* Left Side - Branding */}
        <div className={`hidden lg:flex lg:w-1/2 items-center justify-center p-12 bg-background `}>
          <div className="text-center">
            <div className="mb-8">
              {/* Logo/Icon */}
              <div
                className={`mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6 bg-surface text-text shadow-lg`}
              >
                <ShieldIcon className="w-10 h-10" />
              </div>
              <h1
                className={`text-4xl font-semibold mb-4 tracking-tight text-text`}
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                Training Program
              </h1>
              <p className={`text-xl max-w-md text-text`}>
                Elevate your strength training with intelligent programming and data-driven
                insights.
              </p>
            </div>

            <div className={`space-y-4 text-text`}>
              <div className="flex items-center justify-center space-x-2">
                <div className={`w-2 h-2 rounded-full bg-text`}></div>
                <span>AI-Powered Training Programs</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className={`w-2 h-2 rounded-full bg-text`}></div>
                <span>Real-time Performance Analytics</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className={`w-2 h-2 rounded-full bg-text`}></div>
                <span>Personalized Coaching Experience</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Authentication Forms */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-backgroundSecondary">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div
                className={`mx-auto w-16 h-16 rounded-xl flex items-center justify-center mb-4 bg-surface text-text shadow-lg`}
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V5l-9-4z" />
                </svg>
              </div>
              <h1
                className={`text-2xl font-semibold tracking-tight text-text`}
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                Training Program
              </h1>
            </div>

            {currentView !== 'method-selector' && (
              <div className="mb-8 hidden lg:block">
                <h2
                  className={`text-3xl font-semibold mb-2 tracking-tight text-text`}
                  style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                >
                  {currentView === 'login' ? 'Welcome back' : 'Get started'}
                </h2>
                <p className="text-text">
                  {currentView === 'login'
                    ? 'Sign in to access your training dashboard'
                    : 'Create your account to begin your fitness journey'}
                </p>
              </div>
            )}

            {/* Authentication Method Selector */}
            {currentView === 'method-selector' && (
              <div className="flex flex-col gap-4 justify-center items-center">
                <h2
                  className={`text-3xl font-semibold tracking-tight text-text`}
                  style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                >
                  Welcome
                </h2>

                <p className="text-text">Choose how you'd like to access your account</p>

                <AuthMethodSelector
                  onMethodSelect={handleMethodSelect}
                  isLoading={isLoading}
                  availableMethods={availableAuthMethods as AuthMethod[]}
                />

                <div className="flex justify-center items-center gap-2">
                  <p className={`text-sm text-text`}>Don't have an account? </p>
                  <Button
                    onPress={handleSwitchToRegister}
                    variant="flat"
                    size="sm"
                    className="bg-warning text-surface hover:text-surfaceHover font-medium"
                  >
                    Sign up
                  </Button>
                </div>
              </div>
            )}

            {/* Enhanced Login Form */}
            {currentView === 'login' && (
              <div>
                <EnhancedLoginForm
                  authMethod={selectedAuthMethod}
                  onSubmit={handleLogin}
                  onBack={handleBackToMethodSelector}
                  isLoading={isLoading}
                  error={error || undefined}
                />

                <div className="flex justify-center items-center gap-2 mt-4">
                  <p className={`text-sm text-textSecondary`}>Don't have an account? </p>
                  <Button
                    onPress={handleSwitchToRegister}
                    variant="flat"
                    size="sm"
                    className="bg-warning text-surface hover:text-surfaceHover font-medium"
                  >
                    Sign up
                  </Button>
                </div>

                {/* Demo Credentials for Email Login */}
                {/* {selectedAuthMethod === 'EMAIL' && (
                  <div className={`mt-8 p-4 rounded-lg border bg-background shadow-lg`}>
                    <p className={`text-sm font-medium mb-2 text-text`}>
                      Demo Credentials:
                    </p>
                    <div className={`space-y-1 text-sm text-text`}>
                      <p>
                        <span className="font-mono">admin@strengthos.com</span> /
                        <span className="font-mono"> Admin123!</span>
                      </p>
                      <p>
                        <span className="font-mono">coach1@elite-fitness.com</span> /
                        <span className="font-mono"> Coach123!</span>
                      </p>
                    </div>
                  </div>
                )} */}
              </div>
            )}

            {/* Registration Form */}
            {currentView === 'register' && (
              <div>
                <RegistrationForm
                  authMethod={selectedAuthMethod}
                  onSubmit={handleRegister}
                  onBack={handleBackToMethodSelector}
                  isLoading={isLoading}
                  error={error || undefined}
                />

                <div className="mt-4 text-center">
                  <p className={`text-sm text-text`}>
                    Already have an account?{' '}
                    <Button
                      onPress={handleSwitchToLogin}
                      variant="flat"
                      size="sm"
                      className="bg-warning text-surface hover:text-surfaceHover font-medium"
                    >
                      Sign in
                    </Button>
                  </p>
                </div>
              </div>
            )}

            {/* Footer */}
            {/* <div className={`mt-8 text-center text-sm text-text`}>
              <p>© 2025 Training Program. All rights reserved.</p>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main export with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-32 w-32 border-b-2 border-current mx-auto"
              style={{ borderColor: 'var(--color-primary)' }}
            ></div>
            <p className="mt-4 text-lg">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
