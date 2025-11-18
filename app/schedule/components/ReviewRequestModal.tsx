"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { HiCheck, HiXMark, HiCalendar, HiCheckCircle, HiClock, HiExclamationTriangle } from "react-icons/hi2";

interface VacationBalance {
  annualVacationDays: number;
  usedVacationDays: number;
  pendingDays: number;
  remainingDays: number;
  availableDays: number;
  vacationYear: number;
  usagePercentage: number;
}

interface ReviewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: any;
  onSuccess: () => void;
}

export default function ReviewRequestModal({
  isOpen,
  onClose,
  request,
  onSuccess,
}: ReviewRequestModalProps) {
  const router = useRouter();
  const [isRejectMode, setIsRejectMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [vacationBalance, setVacationBalance] = useState<VacationBalance | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [shiftTimes, setShiftTimes] = useState({
    startTime: "",
    endTime: ""
  });
  const [positions, setPositions] = useState<any[]>([]);
  const [positionId, setPositionId] = useState("");
  const [notes, setNotes] = useState("");

  // Betöltjük a szabadság egyenleget TIME_OFF kérések esetén
  useEffect(() => {
    if (isOpen && request?.type === "TIME_OFF" && request?.user?.id) {
      const fetchBalance = async () => {
        try {
          setBalanceLoading(true);
          const response = await axios.get(`/api/time-off/balance?userId=${request.user.id}`);
          setVacationBalance(response.data);
        } catch (error) {
          console.error("Error fetching vacation balance:", error);
          setVacationBalance(null);
        } finally {
          setBalanceLoading(false);
        }
      };
      fetchBalance();
    } else {
      setVacationBalance(null);
    }
  }, [isOpen, request]);

  // Inicializáljuk az időpontokat a request típusa alapján
  useEffect(() => {
    if (isOpen && request) {
      if (request.type === "SPECIFIC_TIME" && request.preferredStartTime) {
        // SPECIFIC_TIME: kért időpontok
        const startTime = new Date(request.preferredStartTime);
        const endTime = new Date(request.preferredEndTime);
        setShiftTimes({
          startTime: startTime.toTimeString().slice(0, 5), // HH:MM
          endTime: endTime.toTimeString().slice(0, 5)
        });
      } else if (request.type === "AVAILABLE_ALL_DAY") {
        // AVAILABLE_ALL_DAY: alapértelmezett időpontok
        setShiftTimes({
          startTime: "08:00",
          endTime: "16:00"
        });
      } else {
        // TIME_OFF vagy más: nincs időpont
        setShiftTimes({
          startTime: "",
          endTime: ""
        });
      }

      // Pozíciók betöltése (SPECIFIC_TIME és AVAILABLE_ALL_DAY esetén)
      if ((request.type === "SPECIFIC_TIME" || request.type === "AVAILABLE_ALL_DAY") && request.user?.userPositions) {
        const userPositions = request.user.userPositions.map((up: any) => up.position);
        setPositions(userPositions);

        // Automatikusan kiválasztjuk a primary pozíciót
        const primaryPosition = request.user.userPositions.find((up: any) => up.isPrimary);
        if (primaryPosition) {
          setPositionId(primaryPosition.positionId);
        }
      } else {
        setPositions([]);
        setPositionId("");
      }

      // Reset notes
      setNotes("");
    }
  }, [isOpen, request]);

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

  const handleApproveClick = async () => {
    setIsLoading(true);

    try {
      // SPECIFIC_TIME és AVAILABLE_ALL_DAY esetén: APPROVE + CONVERT
      if (request.type === "SPECIFIC_TIME" || request.type === "AVAILABLE_ALL_DAY") {
        // Időpont validáció
        if (!shiftTimes.startTime || !shiftTimes.endTime) {
          toast.error("Add meg a műszak időpontját!");
          setIsLoading(false);
          return;
        }

        const start = new Date(`1970-01-01T${shiftTimes.startTime}:00`);
        const end = new Date(`1970-01-01T${shiftTimes.endTime}:00`);
        if (start >= end) {
          toast.error("A befejező időnek később kell lennie, mint a kezdő idő!");
          setIsLoading(false);
          return;
        }

        // Pozíció validáció
        if (!positionId) {
          toast.error("Válassz pozíciót!");
          setIsLoading(false);
          return;
        }

        // 1. APPROVE API hívás
        await axios.patch(`/api/shift-requests/${request.id}/review`, {
          action: "approve",
        });

        // 2. CONVERT API hívás (Shift létrehozása)
        const requestDate = new Date(request.date);
        const [startHours, startMinutes] = shiftTimes.startTime.split(":");
        const [endHours, endMinutes] = shiftTimes.endTime.split(":");

        const startDateTime = new Date(requestDate);
        startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0);

        const endDateTime = new Date(requestDate);
        endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0);

        await axios.post(`/api/shift-requests/${request.id}/convert`, {
          positionId: positionId,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          notes: notes || null,
        });

        toast.success("Műszak sikeresen létrehozva!");
        onSuccess();
        onClose();
      } else if (request.type === "TIME_OFF") {
        // TIME_OFF: csak APPROVE (nincs convert)
        await axios.patch(`/api/shift-requests/${request.id}/review`, {
          action: "approve",
        });
        toast.success("Szabadság jóváhagyva!");
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error("Error approving/converting request:", error);
      if (error.response?.status === 409) {
        toast.error(error.response.data);
      } else {
        toast.error("Hiba történt a jóváhagyás során");
      }
    } finally {
      setIsLoading(false);
    }
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

              {/* Time Information - SPECIFIC_TIME */}
              {request.type === "SPECIFIC_TIME" &&
                request.preferredStartTime && (
                  <div className="space-y-3">
                    {/* Kért időpont (read-only) */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-blue-800 mb-1">
                        📋 Kért időszak
                      </p>
                      <p className="text-base font-semibold text-blue-900">
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

                    {/* Módosítható időpont */}
                    <div className="bg-white border border-gray-300 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        ✏️ Műszak időszak (megbeszélés alapján módosítható)
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Kezdés *</label>
                          <input
                            type="time"
                            value={shiftTimes.startTime}
                            onChange={(e) => setShiftTimes({...shiftTimes, startTime: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nexus-tertiary focus:border-nexus-tertiary"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Befejezés *</label>
                          <input
                            type="time"
                            value={shiftTimes.endTime}
                            onChange={(e) => setShiftTimes({...shiftTimes, endTime: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nexus-tertiary focus:border-nexus-tertiary"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pozíció választás */}
                    <div className="bg-white border border-gray-300 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        📍 Pozíció *
                      </p>
                      <select
                        value={positionId}
                        onChange={(e) => setPositionId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nexus-tertiary focus:border-nexus-tertiary"
                        required
                      >
                        <option value="">Válassz pozíciót...</option>
                        {positions.map((position) => {
                          const isPrimary = request.user?.userPositions?.find(
                            (up: any) => up.positionId === position.id && up.isPrimary
                          );
                          return (
                            <option key={position.id} value={position.id}>
                              {position.displayNames?.hu || position.name}
                              {isPrimary ? " (Elsődleges)" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Megjegyzések */}
                    <div className="bg-white border border-gray-300 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        📝 Megjegyzések (opcionális)
                      </p>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder="Opcionális megjegyzések..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nexus-tertiary focus:border-nexus-tertiary resize-none"
                      />
                    </div>
                  </div>
                )}

              {request.type === "AVAILABLE_ALL_DAY" && (
                <div className="space-y-3">
                  {/* Info banner */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      📋 Az alkalmazott egész nap elérhető. Add meg a pontos időpontot.
                    </p>
                  </div>

                  {/* Időpont megadás */}
                  <div className="bg-white border border-gray-300 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      ✏️ Műszak időszak
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Kezdés *</label>
                        <input
                          type="time"
                          value={shiftTimes.startTime}
                          onChange={(e) => setShiftTimes({...shiftTimes, startTime: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nexus-tertiary focus:border-nexus-tertiary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Befejezés *</label>
                        <input
                          type="time"
                          value={shiftTimes.endTime}
                          onChange={(e) => setShiftTimes({...shiftTimes, endTime: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nexus-tertiary focus:border-nexus-tertiary"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pozíció választás */}
                  <div className="bg-white border border-gray-300 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      📍 Pozíció *
                    </p>
                    <select
                      value={positionId}
                      onChange={(e) => setPositionId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nexus-tertiary focus:border-nexus-tertiary"
                      required
                    >
                      <option value="">Válassz pozíciót...</option>
                      {positions.map((position) => {
                        const isPrimary = request.user?.userPositions?.find(
                          (up: any) => up.positionId === position.id && up.isPrimary
                        );
                        return (
                          <option key={position.id} value={position.id}>
                            {position.displayNames?.hu || position.name}
                            {isPrimary ? " (Elsődleges)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Megjegyzések */}
                  <div className="bg-white border border-gray-300 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      📝 Megjegyzések (opcionális)
                    </p>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Opcionális megjegyzések..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nexus-tertiary focus:border-nexus-tertiary resize-none"
                    />
                  </div>
                </div>
              )}

              {request.type === "TIME_OFF" && (
                <>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-orange-800 font-medium">
                      🗓️ Szabadság kérés
                    </p>
                    <p className="text-xs text-orange-700 mt-1">
                      Ha jóváhagyod, {request.vacationDays || 1} nap kerül levonásra a szabadság egyenlegből.
                    </p>
                  </div>

                  {/* Szabadság egyenleg megjelenítése */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <HiCalendar className="h-5 w-5 text-blue-600" />
                      <h4 className="text-sm font-semibold text-gray-900">
                        Szabadság egyenleg
                      </h4>
                    </div>

                    {balanceLoading ? (
                      <p className="text-sm text-gray-500">Betöltés...</p>
                    ) : vacationBalance ? (
                      <>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          {/* Éves keret */}
                          <div className="bg-white rounded-lg p-2">
                            <div className="flex items-center gap-2">
                              <HiCalendar className="h-4 w-4 text-blue-600" />
                              <div>
                                <p className="text-xs text-gray-600">Éves keret</p>
                                <p className="text-sm font-bold text-gray-900">
                                  {vacationBalance.annualVacationDays} nap
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Felhasznált */}
                          <div className="bg-white rounded-lg p-2">
                            <div className="flex items-center gap-2">
                              <HiCheckCircle className="h-4 w-4 text-green-600" />
                              <div>
                                <p className="text-xs text-gray-600">Felhasznált</p>
                                <p className="text-sm font-bold text-gray-900">
                                  {vacationBalance.usedVacationDays} nap
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Függőben */}
                          <div className="bg-white rounded-lg p-2">
                            <div className="flex items-center gap-2">
                              <HiClock className="h-4 w-4 text-yellow-600" />
                              <div>
                                <p className="text-xs text-gray-600">Függőben</p>
                                <p className="text-sm font-bold text-gray-900">
                                  {vacationBalance.pendingDays} nap
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Fennmaradó */}
                          <div className="bg-white rounded-lg p-2">
                            <div className="flex items-center gap-2">
                              <HiCalendar className="h-4 w-4 text-purple-600" />
                              <div>
                                <p className="text-xs text-gray-600">Fennmaradó</p>
                                <p className="text-sm font-bold text-gray-900">
                                  {vacationBalance.remainingDays} nap
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Rendelkezésre álló - kiemelt */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-3">
                          <div className="flex items-center justify-between text-white">
                            <div>
                              <p className="text-xs opacity-90">Rendelkezésre áll</p>
                              <p className="text-2xl font-bold">
                                {vacationBalance.availableDays} nap
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold">{vacationBalance.usagePercentage}%</p>
                              <p className="text-xs opacity-90">használva</p>
                            </div>
                          </div>
                        </div>

                        {/* Figyelmeztetés vagy siker üzenet */}
                        <div className="mt-3">
                          {vacationBalance.availableDays < (request.vacationDays || 1) ? (
                            <div className="flex items-start gap-2 bg-red-100 border border-red-300 rounded-lg p-2">
                              <HiExclamationTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-semibold text-red-800">
                                  Nincs elegendő szabadság!
                                </p>
                                <p className="text-xs text-red-700">
                                  Ez a kérés {request.vacationDays || 1} napot igényel, de csak {vacationBalance.availableDays} nap áll rendelkezésre.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2 bg-green-100 border border-green-300 rounded-lg p-2">
                              <HiCheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-semibold text-green-800">
                                  Elegendő szabadság áll rendelkezésre
                                </p>
                                <p className="text-xs text-green-700">
                                  Jóváhagyás után: {vacationBalance.availableDays - (request.vacationDays || 1)} nap marad
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500">
                        <HiExclamationTriangle className="h-5 w-5" />
                        <p className="text-sm">Nem sikerült betölteni az egyenleget</p>
                      </div>
                    )}
                  </div>
                </>
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
