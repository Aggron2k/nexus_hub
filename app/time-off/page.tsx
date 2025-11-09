"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { useRouter } from "next/navigation";
import axios from "axios";
import VacationRequestsList from "./components/VacationRequestsList";
import VacationCalendar from "./components/VacationCalendar";
import TimeOffMobileSelector from "./components/TimeOffMobileSelector";
import TimeOffMobileHeader from "./components/TimeOffMobileHeader";

export default function TimeOffPage() {
  const { language } = useLanguage();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileSelector, setShowMobileSelector] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await axios.get('/api/users/me');
        setCurrentUser(userResponse.data);

        // Ha GM vagy CEO, átirányítjuk az admin oldalra (csak desktop-on)
        if ((userResponse.data.role === "GeneralManager" || userResponse.data.role === "CEO") && window.innerWidth >= 1024) {
          router.push('/time-off/admin');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const translations = {
    en: {
      loading: "Loading...",
      myTimeOff: "My Time-Off",
    },
    hu: {
      loading: "Betöltés...",
      myTimeOff: "Saját Szabadságom",
    }
  };

  const t = translations[language];
  const isAdmin = currentUser?.role === "GeneralManager" || currentUser?.role === "CEO";

  if (isLoading) {
    return (
      <>
        {/* Mobile Loading */}
        <div className="block lg:hidden h-full">
          <div className="h-full flex items-center justify-center bg-nexus-bg">
            <p className="text-gray-500">{t.loading}</p>
          </div>
        </div>

        {/* Desktop Loading */}
        <div className="hidden lg:block lg:pl-80 h-full">
          <div className="h-full flex items-center justify-center bg-nexus-bg">
            <p className="text-gray-500">{t.loading}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Mobile View */}
      <div className="block lg:hidden h-full">
        {isAdmin && showMobileSelector ? (
          // Mobile Selector (GM/CEO only)
          <TimeOffMobileSelector
            onSelectMyTimeOff={() => setShowMobileSelector(false)}
            onSelectTeamOverview={() => {
              setShowMobileSelector(false);
              router.push('/time-off/admin');
            }}
          />
        ) : (
          // Mobile Content
          <div className="h-full bg-nexus-bg overflow-y-auto pb-20">
            {isAdmin && (
              <TimeOffMobileHeader
                onBack={() => setShowMobileSelector(true)}
                title={t.myTimeOff}
              />
            )}

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Requests List */}
              <VacationRequestsList />

              {/* Calendar */}
              <VacationCalendar />
            </div>
          </div>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block lg:pl-80 h-full">
        <div className="h-full bg-nexus-bg p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Requests List */}
            <VacationRequestsList />

            {/* Calendar */}
            <VacationCalendar />
          </div>
        </div>
      </div>
    </>
  );
}
