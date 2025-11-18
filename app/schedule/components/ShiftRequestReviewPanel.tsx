"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { HiClock, HiCheck, HiArrowRight, HiXMark } from "react-icons/hi2";
import ConvertRequestModal from "./ConvertRequestModal";
import ReviewRequestModal from "./ReviewRequestModal";

interface ShiftRequestReviewPanelProps {
  weekScheduleId: string;
  currentUser: any;
  onShiftCreated?: () => void;
}

export default function ShiftRequestReviewPanel({
  weekScheduleId,
  currentUser,
  onShiftCreated,
}: ShiftRequestReviewPanelProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Csak GM/CEO láthatja
  const canReview = ["GeneralManager", "CEO"].includes(currentUser.role);

  // Debug: nézzük meg mi a currentUser
  console.log("ShiftRequestReviewPanel - currentUser:", currentUser);
  console.log("ShiftRequestReviewPanel - canReview:", canReview);

  useEffect(() => {
    if (canReview) {
      fetchRequests();
    }
  }, [weekScheduleId, canReview]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `/api/shift-requests?weekScheduleId=${weekScheduleId}`
      );
      setRequests(response.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      await axios.patch(`/api/shift-requests/${requestId}/review`, {
        action: "approve",
      });
      toast.success("Kérés jóváhagyva");
      fetchRequests();
      router.refresh();
    } catch (error: any) {
      console.error("Error approving request:", error);
      toast.error("Hiba a jóváhagyás során");
    }
  };

  const handleRejectClick = (request: any) => {
    setSelectedRequest(request);
    setIsRejectModalOpen(true);
    setRejectionReason("");
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Add meg az elutasítás okát");
      return;
    }

    try {
      await axios.patch(`/api/shift-requests/${selectedRequest.id}/review`, {
        action: "reject",
        rejectionReason: rejectionReason,
      });
      toast.success("Kérés elutasítva");
      setIsRejectModalOpen(false);
      setSelectedRequest(null);
      setRejectionReason("");
      fetchRequests();
      router.refresh();
    } catch (error: any) {
      console.error("Error rejecting request:", error);
      toast.error("Hiba az elutasítás során");
    }
  };

  const handleConvertClick = (request: any) => {
    setSelectedRequest(request);
    setIsConvertModalOpen(true);
  };

  const handleReviewClick = (request: any) => {
    setSelectedRequest(request);
    setIsReviewModalOpen(true);
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "SPECIFIC_TIME":
        return "Konkrét időpont";
      case "AVAILABLE_ALL_DAY":
        return "Egész nap elérhető";
      case "TIME_OFF":
        return "Szabadság";
      default:
        return type;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("hu-HU", {
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  };

  // Ha nem GM/CEO, ne mutassunk semmit
  if (!canReview) {
    return null;
  }

  // Szűrés: csak PENDING és APPROVED kérések
  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  // TIME_OFF kérések jóváhagyás után már nem jelennek meg az Approved listában (nincs konvertálás)
  const approvedRequests = requests.filter(
    (r) => r.status === "APPROVED" && r.type !== "TIME_OFF"
  );

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Műszak kérések
        </h3>
        <p className="text-gray-500">Betöltés...</p>
      </div>
    );
  }

  return (
    <>
      {/* Review Request Modal */}
      {isReviewModalOpen && selectedRequest && (
        <ReviewRequestModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
          onSuccess={fetchRequests}
        />
      )}

      {/* Rejection Modal */}
      {isRejectModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Kérés elutasítása
              </h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600 mb-4">
                <strong>{selectedRequest.user?.name}</strong> kérése:{" "}
                {formatDate(selectedRequest.date)}
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Elutasítás oka *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nexus-tertiary"
                placeholder="Add meg miért utasítod el a kérést..."
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setSelectedRequest(null);
                  setRejectionReason("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Mégse
              </button>
              <button
                onClick={handleRejectSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Elutasítás
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert Modal */}
      {selectedRequest && (
        <ConvertRequestModal
          isOpen={isConvertModalOpen}
          onClose={() => {
            setIsConvertModalOpen(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
          onSuccess={() => {
            fetchRequests();
            if (onShiftCreated) onShiftCreated();
          }}
        />
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <HiClock className="h-5 w-5 text-nexus-tertiary" />
          <h3 className="text-lg font-semibold text-gray-900">Műszak kérések</h3>
          <span className="ml-auto text-sm text-gray-500">
            {pendingRequests.length + approvedRequests.length} kérés
          </span>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Várakozó kérések ({pendingRequests.length})
            </h4>
            <div className="space-y-2">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-3 hover:border-nexus-tertiary transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {request.user?.name}
                        </span>
                        <span className="text-sm text-gray-600">
                          • {formatDate(request.date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                          {getTypeLabel(request.type)}
                        </span>
                        {request.type === "SPECIFIC_TIME" &&
                          request.preferredStartTime && (
                            <span className="text-xs text-gray-600">
                              {new Date(
                                request.preferredStartTime
                              ).toLocaleTimeString("hu-HU", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              -{" "}
                              {new Date(
                                request.preferredEndTime
                              ).toLocaleTimeString("hu-HU", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                      </div>
                      {request.notes && (
                        <p className="text-xs text-gray-600 italic">
                          {request.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleReviewClick(request)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Áttekintés és jóváhagyás"
                      >
                        <HiCheck className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleRejectClick(request)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Elutasítás"
                      >
                        <HiXMark className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approved Requests */}
        {approvedRequests.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Jóváhagyott kérések ({approvedRequests.length})
            </h4>
            <div className="space-y-2">
              {approvedRequests.map((request) => (
                <div
                  key={request.id}
                  className="border border-green-200 bg-green-50 rounded-lg p-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {request.user?.name}
                        </span>
                        <span className="text-sm text-gray-600">
                          • {formatDate(request.date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 bg-white text-gray-700 rounded">
                          {getTypeLabel(request.type)}
                        </span>
                        {request.type === "SPECIFIC_TIME" &&
                          request.preferredStartTime && (
                            <span className="text-xs text-gray-600">
                              {new Date(
                                request.preferredStartTime
                              ).toLocaleTimeString("hu-HU", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              -{" "}
                              {new Date(
                                request.preferredEndTime
                              ).toLocaleTimeString("hu-HU", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleConvertClick(request)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-nexus-tertiary rounded hover:bg-nexus-tertiary/90 transition-colors"
                      title="Műszakká alakítás"
                    >
                      <span>Konvertálás</span>
                      <HiArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {pendingRequests.length === 0 && approvedRequests.length === 0 && (
          <div className="text-center py-8">
            <HiClock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              Nincs aktív műszak kérés erre a hétre
            </p>
          </div>
        )}
      </div>
    </>
  );
}
