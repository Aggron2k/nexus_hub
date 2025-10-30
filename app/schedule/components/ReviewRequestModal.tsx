"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { HiCheck, HiXMark } from "react-icons/hi2";

interface ReviewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: any;
  onSuccess: () => void;
  onApprove: (request: any) => void;
}

export default function ReviewRequestModal({
  isOpen,
  onClose,
  request,
  onSuccess,
  onApprove,
}: ReviewRequestModalProps) {
  const router = useRouter();
  const [isRejectMode, setIsRejectMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !request) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Várakozó";
      case "APPROVED":
        return "Jóváhagyott";
      case "REJECTED":
        return "Elutasított";
      case "CONVERTED_TO_SHIFT":
        return "Műszakká alakítva";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-gray-100 text-gray-700";
      case "APPROVED":
        return "bg-green-100 text-green-700";
      case "REJECTED":
        return "bg-red-100 text-red-700";
      case "CONVERTED_TO_SHIFT":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleApproveClick = () => {
    onApprove(request);
    onClose();
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Kérlek add meg az elutasítás okát");
      return;
    }

    setIsLoading(true);
    try {
      await axios.patch(`/api/shift-requests/${request.id}/review`, {
        action: "reject",
        rejectionReason: rejectionReason,
      });

      toast.success("Kérés elutasítva");
      onClose();
      router.refresh();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error rejecting request:", error);
      if (error.response?.status === 400) {
        toast.error(error.response.data);
      } else {
        toast.error("Hiba történt az elutasítás során");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {isRejectMode ? "Kérés elutasítása" : "Műszak kérés áttekintése"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <HiXMark className="h-6 w-6" />
          </button>
        </div>

        {!isRejectMode ? (
          <>
            {/* Request Details */}
            <div className="px-6 py-4 space-y-4">
              {/* Employee Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Alkalmazott</p>
                    <p className="text-base font-medium text-gray-900">
                      {request.user?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Státusz</p>
                    <span
                      className={`inline-block text-xs px-2 py-1 rounded ${getStatusColor(
                        request.status
                      )}`}
                    >
                      {getStatusLabel(request.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Dátum</p>
                    <p className="text-base font-medium text-gray-900">
                      {formatDate(request.date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Típus</p>
                    <p className="text-base font-medium text-gray-900">
                      {getTypeLabel(request.type)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Time Information */}
              {request.type === "SPECIFIC_TIME" &&
                request.preferredStartTime && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Kért időszak
                    </p>
                    <p className="text-lg font-medium text-gray-900">
                      {new Date(request.preferredStartTime).toLocaleTimeString(
                        "hu-HU",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}{" "}
                      -{" "}
                      {new Date(request.preferredEndTime).toLocaleTimeString(
                        "hu-HU",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                )}

              {request.type === "AVAILABLE_ALL_DAY" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    Az alkalmazott egész nap elérhető. A pontos időpontot te
                    határozhatod meg.
                  </p>
                </div>
              )}

              {request.type === "TIME_OFF" && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-sm text-orange-800">
                    Szabadság kérés. Ha jóváhagyod, nem lehet műszakot létrehozni ezen a napon.
                  </p>
                </div>
              )}

              {/* Notes */}
              {request.notes && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Megjegyzés az alkalmazottól
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-900 italic">
                      {request.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Submission Info */}
              <div className="text-xs text-gray-500">
                Beküldve:{" "}
                {new Date(request.createdAt).toLocaleString("hu-HU")}
              </div>
            </div>

            {/* Actions */}
            {request.status === "PENDING" && (
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setIsRejectMode(true)}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100"
                  disabled={isLoading}
                >
                  <HiXMark className="inline h-5 w-5 mr-1" />
                  Elutasítás
                </button>
                <button
                  onClick={handleApproveClick}
                  className="px-4 py-2 text-sm font-medium text-white bg-nexus-tertiary rounded-md hover:bg-nexus-tertiary/90"
                  disabled={isLoading}
                >
                  <HiCheck className="inline h-5 w-5 mr-1" />
                  Jóváhagyás & Műszak létrehozása
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Rejection Form */}
            <div className="px-6 py-4">
              <p className="text-sm text-gray-700 mb-3">
                Kérlek add meg az elutasítás okát:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Pl: Ezen a napon már elegendő dolgozó van beosztva..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nexus-tertiary"
                disabled={isLoading}
              />
            </div>

            {/* Rejection Actions */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setIsRejectMode(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isLoading}
              >
                Mégse
              </button>
              <button
                onClick={handleRejectSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                disabled={isLoading}
              >
                {isLoading ? "Elutasítás..." : "Elutasítás"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
