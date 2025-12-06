'use client';

import axios from "axios";
import { useCallback, useState } from "react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { BsGithub, BsGoogle } from 'react-icons/bs';
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import FormInput from "@/app/components/forms/FormInput";
import ActionButton from "@/app/components/forms/ActionButton";
import SocialAuthButton from "./SocialAuthButton";
import AuthLoadingModal from "./AuthLoadingModal";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuthRedirect } from "@/app/hooks/useAuthRedirect";
import {
  cleanupUrlParameters,
  navigateToDashboard,
  mapFormDataToApi,
  type SocialProvider
} from "@/app/utils/authHelpers";

/**
 * Authentication mode type definition
 * SIGNIN - User login mode
 * SIGNUP - User registration mode
 */
type AuthMode = 'SIGNIN' | 'SIGNUP';

/**
 * Authentication state interface
 */
interface AuthenticationState {
  mode: AuthMode;
  isProcessing: boolean;
  isRedirecting: boolean;
}

/**
 * CredentialsAuthPanel Component
 *
 * Comprehensive authentication panel supporting multiple authentication methods:
 * - Email/password credentials (sign in & sign up)
 * - OAuth social providers (GitHub, Google)
 * - Bilingual interface support (EN/HU)
 *
 * Features:
 * - Form validation via react-hook-form
 * - Loading states and smooth redirects
 * - Automatic URL parameter cleanup
 * - Toast notifications for user feedback
 * - Responsive design with Tailwind CSS
 *
 * @example
 * ```tsx
 * // In app/(site)/page.tsx
 * import AuthForm from './components/AuthForm';
 *
 * export default function LoginPage() {
 *   return (
 *     <div className="flex min-h-screen items-center">
 *       <AuthForm />
 *     </div>
 *   );
 * }
 * ```
 */
const AuthForm = () => {
  const session = useSession();
  const router = useRouter();
  const { language, toggleLanguage } = useLanguage();

  // Consolidated authentication state
  const [authState, setAuthState] = useState<AuthenticationState>({
    mode: 'SIGNIN',
    isProcessing: false,
    isRedirecting: false,
  });

  // Translation strings for bilingual support
  const translations = {
    en: {
      signinHeading: "Sign in to your account",
      signupHeading: "Create an account",
      emailFieldLabel: "Email address",
      passwordFieldLabel: "Password",
      fullNameFieldLabel: "Name",
      signinButton: "Sign in",
      signupButton: "Register",
      toggleLoginText: "Already have an account?",
      toggleRegisterText: "New to NexusHUB?",
      continueWithText: "Or continue with",
      loginSuccess: "Logged in!",
      loginFailed: "Invalid credentials",
      registrationFailed: "Something went wrong!",
      socialLoginSuccess: "Login successful!",
      socialLoginFailed: "Login failed!",
    },
    hu: {
      signinHeading: "Jelentkezz be a fiókodba",
      signupHeading: "Hozz létre egy fiókot",
      emailFieldLabel: "Email cím",
      passwordFieldLabel: "Jelszó",
      fullNameFieldLabel: "Név",
      signinButton: "Bejelentkezés",
      signupButton: "Regisztráció",
      toggleLoginText: "Már van fiókod?",
      toggleRegisterText: "Új a NexusHUB-on?",
      continueWithText: "Vagy folytasd itt",
      loginSuccess: "Sikeres bejelentkezés!",
      loginFailed: "Hibás adatok!",
      registrationFailed: "Hiba történt a regisztráció során!",
      socialLoginSuccess: "Sikeres bejelentkezés!",
      socialLoginFailed: "Sikertelen bejelentkezés!",
    },
  };

  const t = translations[language];

  // Form configuration with react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FieldValues>({
    defaultValues: {
      fullName: '',
      emailAddress: '',
      userPassword: '',
    },
  });

  /**
   * Toggle between SIGNIN and SIGNUP modes
   */
  const switchAuthMode = useCallback(() => {
    setAuthState(prev => ({
      ...prev,
      mode: prev.mode === 'SIGNIN' ? 'SIGNUP' : 'SIGNIN'
    }));
  }, []);

  /**
   * Handles user registration flow
   * Creates new account and automatically signs in
   */
  const performUserRegistration = async (userData: { name?: string; email?: string; password?: string }) => {
    return axios
      .post('/api/register', userData)
      .then(() => {
        setAuthState(prev => ({ ...prev, isRedirecting: true }));

        return signIn('credentials', {
          email: userData.email,
          password: userData.password,
          redirect: false,
        });
      })
      .then((result) => {
        if (result?.error) {
          toast.error(t.registrationFailed);
          setAuthState(prev => ({ ...prev, isRedirecting: false }));
        }
      })
      .catch(() => {
        toast.error(t.registrationFailed);
        setAuthState(prev => ({ ...prev, isRedirecting: false }));
      });
  };

  /**
   * Handles credential-based login flow
   * Signs in user with email and password
   */
  const performCredentialLogin = async (credentials: { email?: string; password?: string }) => {
    setAuthState(prev => ({ ...prev, isRedirecting: true }));

    return signIn('credentials', {
      email: credentials.email,
      password: credentials.password,
      redirect: false,
    })
      .then((result) => {
        if (result?.error) {
          toast.error(t.loginFailed);
          setAuthState(prev => ({ ...prev, isRedirecting: false }));
        }

        if (result?.ok && !result?.error) {
          cleanupUrlParameters();
          navigateToDashboard();
        }
      })
      .catch(() => {
        toast.error(t.loginFailed);
        setAuthState(prev => ({ ...prev, isRedirecting: false }));
      });
  };

  /**
   * Main form submission handler
   * Routes to registration or login based on current mode
   */
  const handleFormSubmission: SubmitHandler<FieldValues> = (formData) => {
    setAuthState(prev => ({ ...prev, isProcessing: true }));

    // Map form field names to API field names
    const apiData = mapFormDataToApi({
      fullName: formData.fullName,
      emailAddress: formData.emailAddress,
      userPassword: formData.userPassword,
    });

    if (authState.mode === 'SIGNUP') {
      performUserRegistration(apiData)
        .finally(() => {
          setAuthState(prev => ({ ...prev, isProcessing: false }));
        });
    } else {
      performCredentialLogin(apiData)
        .finally(() => {
          setAuthState(prev => ({ ...prev, isProcessing: false }));
        });
    }
  };

  /**
   * Handles social OAuth provider authentication
   * Supports GitHub and Google sign-in
   */
  const handleSocialLogin = (provider: SocialProvider) => {
    setAuthState(prev => ({
      ...prev,
      isProcessing: true,
      isRedirecting: true
    }));

    signIn(provider, { redirect: false })
      .then((result) => {
        if (result?.error) {
          toast.error(t.socialLoginFailed);
          setAuthState(prev => ({ ...prev, isRedirecting: false }));
        }

        if (result?.ok && !result?.error) {
          cleanupUrlParameters();
          navigateToDashboard();
        }
      })
      .catch(() => {
        toast.error(t.socialLoginFailed);
        setAuthState(prev => ({ ...prev, isRedirecting: false }));
      })
      .finally(() => {
        setAuthState(prev => ({ ...prev, isProcessing: false }));
      });
  };

  /**
   * Custom hook: Automatically redirect when authenticated
   */
  useAuthRedirect(
    session?.status === 'authenticated',
    () => {
      setAuthState(prev => ({ ...prev, isRedirecting: true }));
      toast.success(t.loginSuccess);
      router.push('/dashboard');
    }
  );

  return (
    <>
      {/* Authentication Loading Overlay */}
      <AuthLoadingModal isVisible={authState.isRedirecting} />

      <div className="sm:mx-auto sm:max-w-md sm:w-full mt-8">
        <div className="px-4 py-8 bg-white shadow-md sm:px-10 sm:rounded-lg">
          {/* Language Switcher Button */}
          <button
            onClick={toggleLanguage}
            className="px-4 py-2 bg-nexus-tertiary text-white font-semibold rounded-md shadow-md hover:bg-nexus-secondary transition absolute top-2 right-2"
            aria-label={`Switch to ${language === "en" ? "Hungarian" : "English"}`}
          >
            {language === "en" ? "HU" : "EN"}
          </button>

          {/* Main Authentication Form Section */}
          <section aria-labelledby="auth-heading">
            <form className="space-y-6" onSubmit={handleSubmit(handleFormSubmission)}>
              {/* Form Header */}
              <header>
                <h2
                  id="auth-heading"
                  className="text-center text-3xl font-bold tracking-tight text-gray-900"
                >
                  {authState.mode === 'SIGNIN' ? t.signinHeading : t.signupHeading}
                </h2>
              </header>

              {/* Form Fields Group */}
              <fieldset disabled={authState.isProcessing}>
                {/* Name Field - Only visible in SIGNUP mode */}
                {authState.mode === 'SIGNUP' && (
                  <div className="mb-4">
                    <FormInput
                      id="fullName"
                      label={t.fullNameFieldLabel}
                      register={register}
                      errors={errors}
                      disabled={authState.isProcessing}
                    />
                  </div>
                )}

                {/* Email Field */}
                <div className="mb-4">
                  <FormInput
                    id="emailAddress"
                    label={t.emailFieldLabel}
                    type="email"
                    register={register}
                    errors={errors}
                    disabled={authState.isProcessing}
                  />
                </div>

                {/* Password Field */}
                <div className="mb-4">
                  <FormInput
                    id="userPassword"
                    label={t.passwordFieldLabel}
                    type="password"
                    register={register}
                    errors={errors}
                    disabled={authState.isProcessing}
                  />
                </div>

                {/* Submit Button */}
                <ActionButton
                  disabled={authState.isProcessing}
                  fullWidth
                  type="submit"
                  isLoading={authState.isProcessing}
                >
                  {authState.mode === 'SIGNIN' ? t.signinButton : t.signupButton}
                </ActionButton>
              </fieldset>
            </form>
          </section>

          {/* Social Authentication Footer */}
          <footer className="mt-6">
            {/* Divider with "Or continue with" text */}
            <div className="relative">
              <div className="flex items-center absolute inset-0">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="flex justify-center text-sm relative">
                <span className="px-2 bg-white text-gray-500">
                  {t.continueWithText}
                </span>
              </div>
            </div>

            {/* Social Provider Buttons */}
            <nav className="flex gap-2 mt-6" aria-label="Social authentication">
              <SocialAuthButton
                icon={BsGithub}
                onClick={() => handleSocialLogin('github')}
                ariaLabel="Sign in with GitHub"
                isDisabled={authState.isProcessing}
              />
              <SocialAuthButton
                icon={BsGoogle}
                onClick={() => handleSocialLogin('google')}
                ariaLabel="Sign in with Google"
                isDisabled={authState.isProcessing}
              />
            </nav>

            {/* Mode Toggle (Login/Register Switch) */}
            <div className="flex gap-2 justify-center text-sm mt-6 px-2 text-gray-500">
              <div>
                {authState.mode === 'SIGNIN' ? t.toggleRegisterText : t.toggleLoginText}
              </div>
              <button
                type="button"
                onClick={switchAuthMode}
                className="underline cursor-pointer hover:text-gray-700 transition"
              >
                {authState.mode === 'SIGNIN' ? t.signupButton : t.signinButton}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
};

export default AuthForm;
