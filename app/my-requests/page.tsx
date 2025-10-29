"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { HiClock, HiPlus, HiCalendar, HiTrash } from "react-icons/hi2";
import axios from "axios";
import toast from "react-hot-toast";
import ShiftRequestModal from "../schedule/components/ShiftRequestModal";

export default function MyRequestsPage() {
  const { language } = useLanguage();
  const [requests, setRequests] = useState<any[]>([]);
  const [weekSchedules, setWeekSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);

  const translations = {
    en: {
      title: "My Shift Requests",
      noSchedules: "No schedules available",
      noRequests: "No requests yet",
      addRequest: "New Request",
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
      deadline: "Deadline",
      week: "Week"
    },
    hu: {
      title: "Műszak kéréseim",
      noSchedules: "Nincs elérhető beosztás",
      noRequests: "Még nincs kérés",
      addRequest: "Új kérés",
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
      deadline: "Határidő",
      week: "Hét"
    }
  };

  const t = translations[language];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch week schedules
      const schedulesResponse = await axios.get("/api/schedule");
      setWeekSchedules(schedulesResponse.data);

      // Fetch my shift requests
      const requestsResponse = await axios.get("/api/shift-requests");
      setRequests(requestsResponse.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Hiba az adatok betöltésekor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm("Biztosan törölni szeretnéd ezt a kérést?")) return;

    try {
      await axios.delete(`/api/shift-requests/${requestId}`);
      toast.success("Kérés törölve");
      fetchData();
    } catch (error: any) {
      console.error("Error deleting request:", error);
      if (error.response?.status === 400) {
        toast.error(error.response.data);
      } else {
        toast.error("Hiba a kérés törlésekor");
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
      day: "numeric"
    });
  };

  if (isLoading) {
    return (
      <div className="hidden lg:block lg:pl-80 h-full">
        <div className="h-full flex items-center justify-center">
          <div className="text-gray-500">Betöltés...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:block lg:pl-80 h-full">
      <div className="h-full flex flex-col bg-nexus-bg">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-nexus-primary rounded-lg">
                <HiClock className="h-6 w-6 text-nexus-tertiary" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Available Week Schedules */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Elérhető beosztások
            </h2>

            {weekSchedules.length === 0 ? (
              <div className="bg-white rounded-lg p-6 text-center text-gray-500">
                {t.noSchedules}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {weekSchedules.map((schedule) => {
                  const deadline = schedule.requestDeadline ? new Date(schedule.requestDeadline) : null;
                  const isDeadlinePassed = deadline ? new Date() > deadline : false;
                  const requestCount = requests.filter(
                    (r) => r.weekScheduleId === schedule.id
                  ).length;

                  return (
                    <div
                      key={schedule.id}
                      className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {t.week} {new Date(schedule.weekStart).toLocaleDateString("hu-HU", { month: "short", day: "numeric" })}
                            {" - "}
                            {new Date(schedule.weekEnd).toLocaleDateString("hu-HU", { month: "short", day: "numeric" })}
                          </h3>
                          {deadline && (
                            <p className="text-sm text-gray-600 mt-1">
                              {t.deadline}: {deadline.toLocaleString("hu-HU")}
                            </p>
                          )}
                          {!deadline && (
                            <p className="text-sm text-gray-600 mt-1">
                              Nincs határidő beállítva
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm text-gray-500">
                          {requestCount} kérés
                        </span>
                        <button
                          onClick={() => {
                            setSelectedSchedule(schedule);
                            setIsModalOpen(true);
                          }}
                          disabled={isDeadlinePassed}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-nexus-tertiary rounded-md hover:bg-nexus-tertiary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <HiPlus className="h-4 w-4" />
                          {t.addRequest}
                        </button>
                      </div>

                      {isDeadlinePassed && (
                        <p className="text-xs text-red-600 mt-2">
                          Határidő lejárt
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* My Requests */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Kéréseim
            </h2>

            {requests.length === 0 ? (
              <div className="bg-white rounded-lg p-6 text-center text-gray-500">
                {t.noRequests}
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
                                Pozíció: {request.position.displayNames?.hu || request.position.name}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-500">
                                Pozíció: Még nincs kijelölve
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
                            Elutasítás oka: {request.rejectionReason}
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

      {/* Shift Request Modal */}
      {selectedSchedule && (
        <ShiftRequestModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSchedule(null);
          }}
          weekScheduleId={selectedSchedule.id}
          weekStart={new Date(selectedSchedule.weekStart)}
          weekEnd={new Date(selectedSchedule.weekEnd)}
          requestDeadline={selectedSchedule.requestDeadline ? new Date(selectedSchedule.requestDeadline) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)}
          onSuccess={() => {
            fetchData();
          }}
        />
      )}
    </div>
  );
}
