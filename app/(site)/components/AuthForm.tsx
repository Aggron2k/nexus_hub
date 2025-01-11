'use client';

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { 
  FieldValues, 
  SubmitHandler, 
  useForm
} from "react-hook-form";
import { BsGithub, BsGoogle } from 'react-icons/bs';

import Input from "../../components/inputs/Input";
import Button from "@/app/components/Button";
import AuthSocialButton from "./AuthSocialButton";
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
    },
  };

  const { language, toggleLanguage } = useLanguage();
  const t = translations[language];


  useEffect(() => {
    if (session?.status === 'authenticated') {
      toast.success('Logged in!');
      router.push('/dashboard');
    }
  }, [session?.status, router]);

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
    formState: {
      errors
    }
  } = useForm<FieldValues>({
    defaultValues: {
      name: '',
      email: '',
      password: ''
    }
  });

  const onSubmit: SubmitHandler<FieldValues> = (data) => {
    setIsLoading(true);

    if (variant === 'REGISTER') {
      axios.post('/api/register', data)
      .then(() => signIn('credentials', data))
      .catch(() => toast.error('Something went wrong!'))
      .finally(() => setIsLoading(false))
    }

    if (variant === 'LOGIN') {
      signIn('credentials', {
        ...data,
        redirect: false
      })
      .then((callback) => {
        if (callback?.error) {
          toast.error('Invalid credentials');
        }

        if (callback?.ok && !callback?.error) {
          toast.success('Logged in!');
          router.push('/dashboard');
        }
      })
      .finally(() => setIsLoading(false));
    }
  }

  const socialAction = (action: string) => {
    setIsLoading(true);

    signIn(action, {
        redirect:false
    }).then((callback) => {
        if (callback?.error) {
            toast.error('Login failed!');
        }
        if (callback?.ok && !callback?.error) {
            toast.success('Login successful!');
        }
    })
    .finally(() => setIsLoading(false));
  }

  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
        <button
          onClick={toggleLanguage}
          className="absolute top-2 right-2 px-4 py-2 bg-nexus-tertiary text-white font-semibold rounded-md shadow-md hover:bg-nexus-secondary transition"
        >
          {language === "en" ? "HU" : "EN"}
        </button>
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {variant === "REGISTER" && (
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
              {variant === "LOGIN" ? t.signInButton : t.registerButton}
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
            {variant === "LOGIN" ? t.toggleRegisterText : t.toggleLoginText}
          </div>
          <div
            onClick={toggleVariant}
            className="underline cursor-pointer"
          >
            {variant === "LOGIN" ? t.registerTitle : t.signInTitle}
          </div>
        </div>
      </div>
    </div>
  );
};
 
export default AuthForm;