"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import {
  HiCheckCircle,
  HiClock,
  HiXCircle,
  HiTrash,
  HiCalendar,
  HiDocumentText
} from "react-icons/hi2";

interface VacationRequest {
  id: string;
  type: "shift_request" | "time_off_request";
  status: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  notes?: string | null;
  rejectionReason?: string | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  sickLeaveDocumentUrl?: string | null;
}

interface VacationRequestsListProps {
  initialFilter?: string;
}

const VacationRequestsList: React.FC<VacationRequestsListProps> = ({ initialFilter = "all" }) => {
  const { language } = useLanguage();
  const [requests, setRequests] = useState<VacationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());

  const translations = {
    en: {
      title: "My Vacation Requests",
      all: "All",
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      year: "Year",
      days: "days",
      day: "day",
      submittedOn: "Submitted on",
      approvedBy: "Approved by",
      rejectedBy: "Rejected by",
      reason: "Reason",
      notes: "Notes",
      delete: "Delete",
      loading: "Loading...",
      noRequests: "No vacation requests found",
      confirmDelete: "Are you sure you want to delete this request?",
      document: "Document",
      viewDocument: "View Document",
    },
    hu: {
      title: "Szabadság Kéréseim",
      all: "Mind",
      pending: "Függőben",
      approved: "Jóváhagyva",
      rejected: "Elutasítva",
      year: "Év",
      days: "nap",
      day: "nap",
      submittedOn: "Benyújtva",
      approvedBy: "Jóváhagyta",
      rejectedBy: "Elutasította",
      reason: "Indok",
      notes: "Megjegyzések",
      delete: "Törlés",
      loading: "Betöltés...",
      noRequests: "Nincs szabadság kérés",
      confirmDelete: "Biztosan törölni szeretnéd ezt a kérést?",
      document: "Dokumentum",
      viewDocument: "Dokumentum megtekintése",
    },
  };

  const t = translations[language];

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (filter !== "all") {
          params.append("status", filter.toUpperCase());
        }
        if (yearFilter) {
          params.append("year", yearFilter);
        }

        const response = await fetch(`/api/time-off/requests?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Failed to fetch requests");
        }

        const data = await response.json();
        setRequests(data);
      } catch (err) {
        console.error("Error fetching vacation requests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [filter, yearFilter]);

  const handleDelete = async (requestId: string, requestType: string) => {
    if (!confirm(t.confirmDelete)) return;

    try {
      // TODO: Implement delete API endpoint
      console.log("Deleting request:", requestId, requestType);
    } catch (err) {
      console.error("Error deleting request:", err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <HiCheckCircle className="h-6 w-6 text-green-600" />;
      case "PENDING":
        return <HiClock className="h-6 w-6 text-yellow-600" />;
      case "REJECTED":
        return <HiXCircle className="h-6 w-6 text-red-600" />;
      default:
        return <HiClock className="h-6 w-6 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "APPROVED":
        return t.approved;
      case "PENDING":
        return t.pending;
      case "REJECTED":
        return t.rejected;
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      language === "hu" ? "hu-HU" : "en-US",
      { year: "numeric", month: "short", day: "numeric" }
    );
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate.toDateString() === endDate.toDateString()) {
      return formatDate(start);
    }

    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t.title}</h2>
        <p className="text-gray-500">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">{t.title}</h2>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "all"
              ? "bg-nexus-secondary text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {t.all}
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "pending"
              ? "bg-yellow-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {t.pending}
        </button>
        <button
          onClick={() => setFilter("approved")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "approved"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {t.approved}
        </button>
        <button
          onClick={() => setFilter("rejected")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "rejected"
              ? "bg-red-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {t.rejected}
        </button>

        {/* Year Filter */}
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium"
        >
          <option value={(new Date().getFullYear()).toString()}>{new Date().getFullYear()}</option>
          <option value={(new Date().getFullYear() - 1).toString()}>{new Date().getFullYear() - 1}</option>
          <option value={(new Date().getFullYear() + 1).toString()}>{new Date().getFullYear() + 1}</option>
        </select>
      </div>

      {/* Requests List - Scrollable with reduced height */}
      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
        {requests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">{t.noRequests}</div>
        ) : (
          requests.map((request) => (
            <div
              key={request.id}
              className={`border-2 rounded-lg p-3 ${getStatusColor(request.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {/* Status Icon */}
                  <div className="mt-0.5">{getStatusIcon(request.status)}</div>

                  {/* Request Info */}
                  <div className="flex-1">
                    {/* Status Badge */}
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold mb-1.5">
                      {getStatusLabel(request.status)}
                    </span>

                    {/* Dates */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <HiCalendar className="h-4 w-4" />
                      <p className="text-base font-semibold">
                        {formatDateRange(request.startDate, request.endDate)}
                      </p>
                      <span className="text-xs font-medium">
                        ({request.daysCount} {request.daysCount === 1 ? t.day : t.days})
                      </span>
                    </div>

                    {/* Notes */}
                    {request.notes && (
                      <div className="mb-1.5">
                        <p className="text-xs font-medium">{t.notes}:</p>
                        <p className="text-xs italic">&quot;{request.notes}&quot;</p>
                      </div>
                    )}

                    {/* Document Link */}
                    {request.sickLeaveDocumentUrl && (
                      <div className="flex items-center gap-2 mb-1.5">
                        <HiDocumentText className="h-4 w-4" />
                        <a
                          href={request.sickLeaveDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-blue-600 hover:underline"
                        >
                          {t.viewDocument}
                        </a>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {request.status === "REJECTED" && request.rejectionReason && (
                      <div className="mb-1.5">
                        <p className="text-xs font-medium">{t.reason}:</p>
                        <p className="text-xs">&quot;{request.rejectionReason}&quot;</p>
                      </div>
                    )}

                    {/* Submitted Date */}
                    <p className="text-xs text-gray-600 mt-1.5">
                      {t.submittedOn}: {formatDate(request.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Delete Button (only for PENDING) */}
                {request.status === "PENDING" && (
                  <button
                    onClick={() => handleDelete(request.id, request.type)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title={t.delete}
                  >
                    <HiTrash className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VacationRequestsList;
