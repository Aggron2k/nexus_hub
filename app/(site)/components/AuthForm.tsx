'use client';

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { BsGithub, BsGoogle } from 'react-icons/bs';

import Input from "../../components/inputs/Input";
import Button from "@/app/components/Button";
import AuthSocialButton from "./AuthSocialButton";
import AuthLoadingModal from "./AuthLoadingModal"; // Új import
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/app/context/LanguageContext";

type Variant = 'LOGIN' | 'REGISTER';

const AuthForm = () => {
  const session = useSession();
  const router = useRouter();
  const [variant, setVariant] = useState<Variant>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false); // Új state a loading modal-hoz

  const translations = {
    en: {
      signInTitle: "Sign in to your account",
      registerTitle: "Create an account",
      emailLabel: "Email address",
      passwordLabel: "Password",
      nameLabel: "Name",
      signInButton: "Sign in",
      registerButton: "Register",
      toggleLoginText: "Already have an account?",
      toggleRegisterText: "New to NexusHUB?",
      orContinueWith: "Or continue with",
      loginSuccess: "Logged in!",
      loginError: "Invalid credentials",
      registerError: "Something went wrong!",
      socialLoginSuccess: "Login successful!",
      socialLoginError: "Login failed!",
    },
    hu: {
      signInTitle: "Jelentkezz be a fiókodba",
      registerTitle: "Hozz létre egy fiókot",
      emailLabel: "Email cím",
      passwordLabel: "Jelszó",
      nameLabel: "Név",
      signInButton: "Bejelentkezés",
      registerButton: "Regisztráció",
      toggleLoginText: "Már van fiókod?",
      toggleRegisterText: "Új a NexusHUB-on?",
      orContinueWith: "Vagy folytasd itt",
      loginSuccess: "Sikeres bejelentkezés!",
      loginError: "Hibás adatok!",
      registerError: "Hiba történt a regisztráció során!",
      socialLoginSuccess: "Sikeres bejelentkezés!",
      socialLoginError: "Sikertelen bejelentkezés!",
    },
  };

  const { language, toggleLanguage } = useLanguage();
  const t = translations[language];

  const [hasNotified, setHasNotified] = useState(false);

  useEffect(() => {
    if (session?.status === 'authenticated' && !hasNotified) {
      setHasNotified(true);
      setIsAuthenticating(true); // Loading screen megjelenítése

      // Kis késleltetés a smooth transition érdekében
      setTimeout(() => {
        toast.success(t.loginSuccess);
        router.push('/dashboard');
      }, 1500); // 1.5 másodperc várakozás
    }
  }, [session?.status, router, t, hasNotified]);

  const toggleVariant = useCallback(() => {
    if (variant === 'LOGIN') {
      setVariant('REGISTER');
    } else {
      setVariant('LOGIN');
    }
  }, [variant]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FieldValues>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit: SubmitHandler<FieldValues> = async (data) => {
    setIsLoading(true);

    if (variant === 'REGISTER') {
      try {
        await axios.post('/api/register', data);
        setIsAuthenticating(true);

        const result = await signIn('credentials', {
          email: data.email,
          password: data.password,
          redirect: false,
        });

        if (result?.error) {
          toast.error(t.registerError);
          setIsAuthenticating(false);
        }
      } catch (error) {
        toast.error(t.registerError);
        setIsAuthenticating(false);
      } finally {
        setIsLoading(false);
      }
    }

    if (variant === 'LOGIN') {
      setIsAuthenticating(true);

      try {
        const result = await signIn('credentials', {
          email: data.email,
          password: data.password,
          redirect: false, // Ez a kulcs!
        });

        if (result?.error) {
          toast.error(t.loginError);
          setIsAuthenticating(false);
        }

        if (result?.ok && !result?.error) {
          // URL tisztítása AZONNAL
          window.history.replaceState({}, '', '/');

          // Majd átirányítás
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 100);
        }
      } catch (error) {
        toast.error(t.loginError);
        setIsAuthenticating(false);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const socialAction = async (action: string) => {
    setIsLoading(true);
    setIsAuthenticating(true);

    try {
      const result = await signIn(action, {
        redirect: false,
      });

      if (result?.error) {
        toast.error(t.socialLoginError);
        setIsAuthenticating(false);
      }

      if (result?.ok && !result?.error) {
        // URL tisztítása
        window.history.replaceState({}, '', '/');

        // Átirányítás
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 100);
      }
    } catch (error) {
      toast.error(t.socialLoginError);
      setIsAuthenticating(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Auth Loading Modal */}
      <AuthLoadingModal isVisible={isAuthenticating} />

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <button
            onClick={toggleLanguage}
            className="absolute top-2 right-2 px-4 py-2 bg-nexus-tertiary text-white font-semibold rounded-md shadow-md hover:bg-nexus-secondary transition"
          >
            {language === "en" ? "HU" : "EN"}
          </button>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
                {variant === 'LOGIN' ? t.signInTitle : t.registerTitle}
              </h2>
            </div>

            {variant === 'REGISTER' && (
              <Input
                id="name"
                label={t.nameLabel}
                register={register}
                errors={errors}
                disabled={isLoading}
              />
            )}

            <Input
              id="email"
              label={t.emailLabel}
              type="email"
              register={register}
              errors={errors}
              disabled={isLoading}
            />

            <Input
              id="password"
              label={t.passwordLabel}
              type="password"
              register={register}
              errors={errors}
              disabled={isLoading}
            />

            <div>
              <Button disabled={isLoading} fullWidth type="submit">
                {variant === 'LOGIN' ? t.signInButton : t.registerButton}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">
                  {t.orContinueWith}
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <AuthSocialButton
                icon={BsGithub}
                onClick={() => socialAction('github')}
              />
              <AuthSocialButton
                icon={BsGoogle}
                onClick={() => socialAction('google')}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-center text-sm mt-6 px-2 text-gray-500">
            <div>
              {variant === 'LOGIN' ? t.toggleRegisterText : t.toggleLoginText}
            </div>
            <div onClick={toggleVariant} className="underline cursor-pointer">
              {variant === 'LOGIN' ? t.registerButton : t.signInButton}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthForm;