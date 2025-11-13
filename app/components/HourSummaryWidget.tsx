"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { HiClock, HiCheckCircle, HiExclamationCircle } from "react-icons/hi2";

interface HourSummaryProps {
  weekScheduleId: string;
  userId?: string; // Optional - default to current user
  weekStart?: string; // Optional - week start date
  weekEnd?: string; // Optional - week end date
}

interface SummaryData {
  userId: string;
  userName: string;
  weekScheduleId: string;
  weeklyRequirement: number;
  requested: {
    hours: number;
    count: number;
  };
  planned: {
    hours: number;
    count: number;
  };
  actual: {
    hours: number;
    count: number;
    present: number;
    sick: number;
    absent: number;
  };
  warnings: string[];
}

export default function HourSummaryWidget({ weekScheduleId, userId, weekStart, weekEnd }: HourSummaryProps) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Format week date range
  const formatWeekRange = () => {
    if (!weekStart || !weekEnd) return null;

    const start = new Date(weekStart);
    const end = new Date(weekEnd);

    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const startStr = start.toLocaleDateString('en-US', options);
    const endStr = end.toLocaleDateString('en-US', options);

    return `${startStr} - ${endStr}`;
  };

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({ weekScheduleId });
        if (userId) {
          params.append('userId', userId);
        }

        const response = await axios.get(`/api/work-hours/summary?${params.toString()}`);
        setSummary(response.data);
      } catch (err: any) {
        console.error("Error fetching work hours summary:", err);
        setError(err.response?.data || "Failed to load summary");
      } finally {
        setIsLoading(false);
      }
    };

    if (weekScheduleId) {
      fetchSummary();
    }
  }, [weekScheduleId, userId]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded mb-2"></div>
          <div className="h-8 bg-gray-200 rounded mb-2"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 text-red-600">
          <HiExclamationCircle className="h-5 w-5" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  // Progress bar calculation
  const progressPercentage = Math.min(100, (summary.requested.hours / summary.weeklyRequirement) * 100);

  const weekRange = formatWeekRange();

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-nexus-primary rounded-lg">
              <HiClock className="h-6 w-6 text-nexus-tertiary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Work Hour Summary</h3>
          </div>
          {weekRange && (
            <p className="text-sm text-gray-500 ml-7">{weekRange}</p>
          )}
        </div>

        {/* Weekly Requirement */}
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Weekly Requirement:</span>
            <span className="text-lg font-bold text-gray-900">{summary.weeklyRequirement} hours</span>
          </div>
        </div>

        {/* Requested Hours */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">Requested this week:</span>
            <span className="text-base font-semibold text-blue-600">
              {summary.requested.hours} hours
              {summary.requested.count > 0 && (
                <span className="text-xs text-gray-500 ml-1">({summary.requested.count} requests)</span>
              )}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
            <div
              className={`h-2.5 rounded-full ${
                progressPercentage >= 100
                  ? 'bg-green-600'
                  : progressPercentage >= 75
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500">
            {progressPercentage.toFixed(0)}% of weekly requirement
          </div>
        </div>

        {/* Planned Hours */}
        {summary.planned.hours > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Planned (approved) hours:</span>
              <span className="text-base font-semibold text-green-600">
                {summary.planned.hours} hours
                <span className="text-xs text-gray-500 ml-1">({summary.planned.count} shifts)</span>
              </span>
            </div>
          </div>
        )}

        {/* Actual Hours */}
        {summary.actual.hours > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Actually worked:</span>
              <span className="text-base font-semibold text-gray-900">
                {summary.actual.hours} hours
                <span className="text-xs text-gray-500 ml-1">({summary.actual.count} completed)</span>
              </span>
            </div>

            {/* Breakdown */}
            {(summary.actual.present > 0 || summary.actual.sick > 0 || summary.actual.absent > 0) && (
              <div className="flex gap-3 mt-2 text-xs">
                {summary.actual.present > 0 && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                    <span>Present: {summary.actual.present}</span>
                  </div>
                )}
                {summary.actual.sick > 0 && (
                  <div className="flex items-center gap-1 text-yellow-600">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span>Sick: {summary.actual.sick}</span>
                  </div>
                )}
                {summary.actual.absent > 0 && (
                  <div className="flex items-center gap-1 text-red-600">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span>Absent: {summary.actual.absent}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Warnings */}
        {summary.warnings.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {summary.warnings.map((warning, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-amber-600 mb-2">
                <HiExclamationCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}

        {/* Success Message */}
        {summary.warnings.length === 0 && summary.requested.hours >= summary.weeklyRequirement && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <HiCheckCircle className="h-5 w-5" />
              <span className="font-medium">You've met your weekly hour requirement!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
