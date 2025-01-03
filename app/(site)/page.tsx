"use client";

import Image from "next/image";
import { useLanguage } from "@/app/context/LanguageContext";
import AuthForm from "./components/AuthForm";

export default function Home() {
  const { language, toggleLanguage } = useLanguage();

  const translations = {
    en: "Sign in to your account",
    hu: "Jelentkezz be a fiókodba",
  };
  

  return (
    <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8 bg-nexus-bg">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Image
          alt="logo"
          height="48"
          width="48"
          className="mx-auto w-auto"
          src="/images/logo.png"
        />
      </div>
      <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
        {translations[language]}
      </h2>
      <button
        onClick={toggleLanguage}
        className="absolute top-2 right-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-600 transition"
      >
        {language === "en" ? "HU" : "EN"}
      </button>
      <AuthForm />
    </div>
  );
}
