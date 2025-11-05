"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { HiCalendar, HiCheckCircle, HiClock, HiExclamationTriangle } from "react-icons/hi2";

interface VacationBalance {
  annualVacationDays: number;
  usedVacationDays: number;
  pendingDays: number;
  remainingDays: number;
  availableDays: number;
  vacationYear: number;
  usagePercentage: number;
}

interface VacationBalanceCardProps {
  userId?: string; // Optional, ha widget módban használjuk más user adataival
}

const VacationBalanceCard: React.FC<VacationBalanceCardProps> = ({ userId }) => {
  const { language } = useLanguage();
  const [balance, setBalance] = useState<VacationBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const translations = {
    en: {
      title: "Vacation Balance",
      annual: "Annual Allocation",
      used: "Used",
      pending: "Pending",
      remaining: "Remaining",
      available: "Available",
      days: "days",
      loading: "Loading...",
      error: "Failed to load vacation balance",
      lowWarning: "Low vacation balance!",
    },
    hu: {
      title: "Szabadság Egyenleg",
      annual: "Éves Keret",
      used: "Felhasznált",
      pending: "Függőben",
      remaining: "Fennmaradó",
      available: "Rendelkezésre",
      days: "nap",
      loading: "Betöltés...",
      error: "Nem sikerült betölteni a szabadság egyenleget",
      lowWarning: "Kevés szabadság maradt!",
    },
  };

  const t = translations[language];

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/time-off/balance");

        if (!response.ok) {
          throw new Error("Failed to fetch balance");
        }

        const data = await response.json();
        setBalance(data);
      } catch (err) {
        console.error("Error fetching vacation balance:", err);
        setError(t.error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [userId, t.error]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-nexus-primary rounded-lg">
            <HiCalendar className="h-6 w-6 text-nexus-tertiary" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">{t.title} {balance?.vacationYear}</h2>
        </div>
        <p className="text-gray-500">{t.loading}</p>
      </div>
    );
  }

  if (error || !balance) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <HiExclamationTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">{t.title}</h2>
        </div>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  // Figyelmeztetés ha kevés a fennmaradó szabadság (< 20%)
  const showLowWarning = balance.remainingDays < balance.annualVacationDays * 0.2;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-nexus-primary rounded-lg">
            <HiCalendar className="h-6 w-6 text-nexus-tertiary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t.title}</h2>
            <p className="text-sm text-gray-500">{balance.vacationYear}</p>
          </div>
        </div>
        {showLowWarning && (
          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 rounded-lg">
            <HiExclamationTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-xs font-medium text-yellow-800">{t.lowWarning}</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Annual */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <HiCalendar className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">{t.annual}</p>
            <p className="text-lg font-bold text-gray-900">
              {balance.annualVacationDays} {t.days}
            </p>
          </div>
        </div>

        {/* Used */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <HiCheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">{t.used}</p>
            <p className="text-lg font-bold text-gray-900">
              {balance.usedVacationDays} {t.days}
            </p>
          </div>
        </div>

        {/* Pending */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <HiClock className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">{t.pending}</p>
            <p className="text-lg font-bold text-gray-900">
              {balance.pendingDays} {t.days}
            </p>
          </div>
        </div>

        {/* Remaining */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <HiCalendar className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">{t.remaining}</p>
            <p className="text-lg font-bold text-gray-900">
              {balance.remainingDays} {t.days}
            </p>
          </div>
        </div>
      </div>

      {/* Available Days - Highlighted */}
      <div className="bg-gradient-to-r from-nexus-primary to-nexus-secondary p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-nexus-tertiary opacity-90">{t.available}</p>
            <p className="text-3xl font-bold text-nexus-tertiary">
              {balance.availableDays} {t.days}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-nexus-tertiary">{balance.usagePercentage}%</div>
            <p className="text-xs text-nexus-tertiary opacity-90">{t.used}</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-nexus-secondary to-nexus-tertiary"
            style={{ width: `${Math.min(balance.usagePercentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default VacationBalanceCard;
