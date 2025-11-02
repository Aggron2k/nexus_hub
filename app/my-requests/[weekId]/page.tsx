"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useLanguage } from "@/app/context/LanguageContext";
import { HiClock, HiCalendar, HiTrash } from "react-icons/hi2";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import HourSummaryWidget from "@/app/components/HourSummaryWidget";

export default function WeekRequestsPage() {
  const params = useParams();
  const router = useRouter();
  const weekId = params?.weekId as string;
  const { language } = useLanguage();

  const [requests, setRequests] = useState<any[]>([]);
  const [weekSchedule, setWeekSchedule] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const translations = {
    en: {
      title: "My Requests",
      week: "Week",
      loading: "Loading...",
      noRequests: "No requests for this week yet",
      status: {
        PENDING: "Pending",
        APPROVED: "Approved",
        REJECTED: "Rejected",
        CONVERTED_TO_SHIFT: "Converted to Shift"
      },
      type: {
        SPECIFIC_TIME: "Specific Time",
        AVAILABLE_ALL_DAY: "Available All Day",
        TIME_OFF: "Time Off"
      },
      position: "Position",
      notAssigned: "Not assigned yet",
      deleteConfirm: "Are you sure you want to delete this request?",
      deleted: "Request deleted",
      deleteError: "Error deleting request",
      rejectionReason: "Rejection reason"
    },
    hu: {
      title: "Kéréseim",
      week: "Hét",
      loading: "Betöltés...",
      noRequests: "Még nincs kérés erre a hétre",
      status: {
        PENDING: "Várakozik",
        APPROVED: "Jóváhagyva",
        REJECTED: "Elutasítva",
        CONVERTED_TO_SHIFT: "Műszakká alakítva"
      },
      type: {
        SPECIFIC_TIME: "Konkrét időpont",
        AVAILABLE_ALL_DAY: "Egész nap elérhető",
        TIME_OFF: "Szabadság"
      },
      position: "Pozíció",
      notAssigned: "Még nincs kijelölve",
      deleteConfirm: "Biztosan törölni szeretnéd ezt a kérést?",
      deleted: "Kérés törölve",
      deleteError: "Hiba a kérés törlésekor",
      rejectionReason: "Elutasítás oka"
    }
  };

  const t = translations[language];

  useEffect(() => {
    fetchData();
  }, [weekId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch week schedule
      const scheduleResponse = await axios.get(`/api/schedule/${weekId}`);
      setWeekSchedule(scheduleResponse.data);

      // Fetch requests for this week
      const requestsResponse = await axios.get(`/api/shift-requests?weekScheduleId=${weekId}`);
      setRequests(requestsResponse.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Hiba az adatok betöltésekor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm(t.deleteConfirm)) return;

    try {
      await axios.delete(`/api/shift-requests/${requestId}`);
      toast.success(t.deleted);
      fetchData();
      router.refresh();
    } catch (error: any) {
      console.error("Error deleting request:", error);
      if (error.response?.status === 400) {
        toast.error(error.response.data);
      } else {
        toast.error(t.deleteError);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "CONVERTED_TO_SHIFT":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "SPECIFIC_TIME":
        return <HiClock className="h-5 w-5" />;
      case "AVAILABLE_ALL_DAY":
        return <HiCalendar className="h-5 w-5" />;
      case "TIME_OFF":
        return <HiCalendar className="h-5 w-5 text-orange-500" />;
      default:
        return <HiClock className="h-5 w-5" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long"
    });
  };

  const formatWeek = () => {
    if (!weekSchedule) return "";
    const start = new Date(weekSchedule.weekStart).toLocaleDateString("hu-HU", {
      month: "short",
      day: "numeric"
    });
    const end = new Date(weekSchedule.weekEnd).toLocaleDateString("hu-HU", {
      month: "short",
      day: "numeric"
    });
    return `${start} - ${end}`;
  };

  if (isLoading) {
    return (
      <div className="hidden lg:block lg:pl-80 h-full">
        <div className="h-full flex items-center justify-center bg-nexus-bg">
          <div className="text-gray-500">{t.loading}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:block lg:pl-80 h-full">
      <div className="h-full flex flex-col bg-nexus-bg">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-nexus-primary rounded-lg">
              <HiClock className="h-6 w-6 text-nexus-tertiary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
              <p className="text-sm text-gray-600">
                {t.week} {formatWeek()}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Hour Summary Widget */}
            {weekSchedule && (
              <HourSummaryWidget weekScheduleId={weekSchedule.id} />
            )}

            {/* Requests List */}
            {requests.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center text-gray-500">
                <HiClock className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <p>{t.noRequests}</p>
              </div>
            ) : (
              <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getTypeIcon(request.type)}
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {formatDate(request.date)}
                          </h3>
                          {request.position ? (
                            <p className="text-sm text-green-600">
                              {t.position}: {request.position.displayNames?.hu || request.position.name}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500">
                              {t.position}: {t.notAssigned}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {t.status[request.status as keyof typeof t.status]}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          {t.type[request.type as keyof typeof t.type]}
                        </span>
                      </div>

                      {request.type === "SPECIFIC_TIME" && request.preferredStartTime && (
                        <p className="text-sm text-gray-600">
                          {new Date(request.preferredStartTime).toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" })}
                          {" - "}
                          {new Date(request.preferredEndTime).toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}

                      {request.notes && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          {request.notes}
                        </p>
                      )}

                      {request.status === "REJECTED" && request.rejectionReason && (
                        <p className="text-sm text-red-600 mt-2">
                          {t.rejectionReason}: {request.rejectionReason}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {request.status === "PENDING" && (
                        <button
                          onClick={() => handleDeleteRequest(request.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                          title="Kérés törlése"
                        >
                          <HiTrash className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
