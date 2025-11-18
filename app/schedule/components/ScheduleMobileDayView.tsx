"use client";

import { useLanguage } from "@/app/context/LanguageContext";
import { useState } from "react";
import { HiChevronDown, HiChevronRight, HiPencil, HiTrash } from "react-icons/hi2";
import Image from "next/image";
import { format, addDays, isSameDay } from "date-fns";
import { hu, enUS } from "date-fns/locale";

interface ScheduleMobileDayViewProps {
    scheduleData: any;
    weekStart: Date;
    weekEnd: Date;
    canManage: boolean;
    onEditShift: (shiftId: string) => void;
    onDeleteShift: (shiftId: string) => void;
    onConvertRequest?: (request: any) => void;
}

const ScheduleMobileDayView: React.FC<ScheduleMobileDayViewProps> = ({
    scheduleData,
    weekStart,
    weekEnd,
    canManage,
    onEditShift,
    onDeleteShift,
    onConvertRequest,
}) => {
    const { language } = useLanguage();
    const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

    const translations = {
        en: {
            noShifts: "No shifts scheduled",
            approved: "Approved",
            pending: "Pending",
            rejected: "Rejected",
            requested: "Requested",
            converted: "Converted",
            shiftRequests: "Shift Requests",
            noRequests: "No shift requests",
            anyTime: "Any time",
            timeOff: "Time Off",
            specificTime: "Specific time",
            availableAllDay: "Available All Day",
            convert: "Convert",
        },
        hu: {
            noShifts: "Nincs beosztva műszak",
            approved: "Jóváhagyva",
            pending: "Függőben",
            rejected: "Elutasítva",
            requested: "Kérelmezve",
            converted: "Átalakítva",
            shiftRequests: "Műszak kérelmek",
            noRequests: "Nincs műszak kérelem",
            anyTime: "Bármikor",
            timeOff: "Szabadság",
            specificTime: "Konkrét időpont",
            availableAllDay: "Elérhető egész nap",
            convert: "Átalakítás",
        },
    };

    const t = translations[language];
    const locale = language === "hu" ? hu : enUS;

    const toggleDay = (dayKey: string) => {
        const newExpanded = new Set(expandedDays);
        if (newExpanded.has(dayKey)) {
            newExpanded.delete(dayKey);
        } else {
            newExpanded.add(dayKey);
        }
        setExpandedDays(newExpanded);
    };

    const getShiftsForDay = (date: Date) => {
        if (!scheduleData?.shifts) return [];

        return scheduleData.shifts.filter((shift: any) => {
            // Skip placeholder shifts that don't have startTime/endTime yet
            if (!shift.startTime || !shift.endTime) return false;

            const shiftDate = new Date(shift.date);
            return isSameDay(shiftDate, date);
        });
    };

    const getRequestsForDay = (date: Date) => {
        if (!scheduleData?.shiftRequests) return [];

        return scheduleData.shiftRequests.filter((request: any) => {
            const requestDate = new Date(request.date);
            return isSameDay(requestDate, date);
        });
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case "APPROVED":
                return "bg-green-100 text-green-800";
            case "PENDING":
                return "bg-yellow-100 text-yellow-800";
            case "REJECTED":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "APPROVED":
                return t.approved;
            case "PENDING":
                return t.pending;
            case "REJECTED":
                return t.rejected;
            case "CONVERTED_TO_SHIFT":
                return t.converted;
            default:
                return status;
        }
    };

    const formatTime = (date: string) => {
        return format(new Date(date), "HH:mm");
    };

    const getRequestTypeText = (type: string) => {
        switch (type) {
            case "TIME_OFF":
                return t.timeOff;
            case "SPECIFIC_TIME":
                return t.specificTime;
            case "AVAILABLE_ALL_DAY":
                return t.availableAllDay;
            default:
                return type;
        }
    };

    const getRequestCardStyle = (type: string) => {
        switch (type) {
            case "TIME_OFF":
                return "bg-yellow-50 border-yellow-200";
            case "AVAILABLE_ALL_DAY":
                return "bg-blue-50 border-blue-200";
            case "SPECIFIC_TIME":
                return "bg-blue-50 border-blue-200";
            default:
                return "bg-gray-50 border-gray-200";
        }
    };

    const getRequestAvatarStyle = (type: string) => {
        switch (type) {
            case "TIME_OFF":
                return "bg-yellow-300 text-yellow-700";
            case "AVAILABLE_ALL_DAY":
                return "bg-blue-300 text-blue-700";
            case "SPECIFIC_TIME":
                return "bg-blue-300 text-blue-700";
            default:
                return "bg-gray-300 text-gray-700";
        }
    };

    // Generate array of 7 days for the week
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
        <div className="space-y-2 p-4">
            {weekDays.map((day) => {
                const dayKey = format(day, "yyyy-MM-dd");
                const isExpanded = expandedDays.has(dayKey);
                const shiftsForDay = getShiftsForDay(day);
                const requestsForDay = getRequestsForDay(day);
                const hasShifts = shiftsForDay.length > 0;
                const hasRequests = requestsForDay.length > 0;

                return (
                    <div key={dayKey} className="bg-white rounded-lg shadow-sm border border-gray-200">
                        {/* Day Header */}
                        <button
                            onClick={() => toggleDay(dayKey)}
                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
                        >
                            <div className="flex items-center gap-3">
                                {isExpanded ? (
                                    <HiChevronDown className="h-5 w-5 text-gray-500" />
                                ) : (
                                    <HiChevronRight className="h-5 w-5 text-gray-500" />
                                )}
                                <div>
                                    <div className="font-semibold text-gray-900">
                                        {format(day, "EEEE", { locale })}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {format(day, "MMM d, yyyy", { locale })}
                                    </div>
                                </div>
                            </div>
                            <div className="text-sm font-medium text-gray-600">
                                {hasShifts ? `${shiftsForDay.length} ${shiftsForDay.length === 1 ? (language === "hu" ? "műszak" : "shift") : (language === "hu" ? "műszak" : "shifts")}` : ""}
                            </div>
                        </button>

                        {/* Day Content - Shifts */}
                        {isExpanded && (
                            <div className="border-t border-gray-200 p-4 space-y-3">
                                {!hasShifts ? (
                                    <div className="text-center text-gray-500 py-4">
                                        {t.noShifts}
                                    </div>
                                ) : (
                                    shiftsForDay.map((shift: any) => (
                                        <div
                                            key={shift.id}
                                            className="bg-gray-50 rounded-lg p-3 space-y-2"
                                            onClick={() => canManage && onEditShift(shift.id)}
                                        >
                                            {/* Employee Info */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="relative h-8 w-8 rounded-full overflow-hidden">
                                                        {shift.user?.image ? (
                                                            <Image
                                                                src={shift.user.image}
                                                                alt={shift.user.name || "Employee"}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <div className="h-full w-full bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-600">
                                                                {shift.user?.name?.charAt(0) || "?"}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">
                                                            {shift.user?.name || "Unknown"}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Buttons - Manager Only */}
                                                {canManage && (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onEditShift(shift.id);
                                                            }}
                                                            className="p-2 text-nexus-tertiary hover:text-nexus-secondary transition"
                                                        >
                                                            <HiPencil className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDeleteShift(shift.id);
                                                            }}
                                                            className="p-2 text-red-600 hover:text-red-700 transition"
                                                        >
                                                            <HiTrash className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Position Info */}
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: shift.position?.color || "#gray" }}
                                                />
                                                <span className="text-sm text-gray-700">
                                                    {(shift.position?.displayNames as any)?.[language] || shift.position?.name || "Unknown Position"}
                                                </span>
                                            </div>

                                            {/* Shift Request Status */}
                                            {shift.shiftRequest && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500">{t.requested}:</span>
                                                    <span
                                                        className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(
                                                            shift.shiftRequest.status
                                                        )}`}
                                                    >
                                                        {getStatusText(shift.shiftRequest.status)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}

                                {/* Shift Requests Section - Separate from shifts */}
                                {hasRequests && (
                                    <div className="mt-4 pt-4 border-t border-gray-300">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                            {t.shiftRequests}
                                        </h4>
                                        <div className="space-y-3">
                                            {requestsForDay.map((request: any) => (
                                                <div
                                                    key={request.id}
                                                    className={`rounded-lg p-3 space-y-2 border ${getRequestCardStyle(request.type)}`}
                                                >
                                                    {/* Employee Info */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="relative h-8 w-8 rounded-full overflow-hidden">
                                                                {request.user?.image ? (
                                                                    <Image
                                                                        src={request.user.image}
                                                                        alt={request.user.name || "Employee"}
                                                                        fill
                                                                        className="object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className={`h-full w-full flex items-center justify-center text-xs font-semibold ${getRequestAvatarStyle(request.type)}`}>
                                                                        {request.user?.name?.charAt(0) || "?"}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-gray-900">
                                                                    {request.user?.name || "Unknown"}
                                                                </div>
                                                                <div className="text-xs text-gray-600">
                                                                    {getRequestTypeText(request.type)}
                                                                    {request.preferredStartTime && request.preferredEndTime && (
                                                                        <span className="ml-1">
                                                                            ({formatTime(request.preferredStartTime)} - {formatTime(request.preferredEndTime)})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Status Badge */}
                                                        <span
                                                            className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(
                                                                request.status
                                                            )}`}
                                                        >
                                                            {getStatusText(request.status)}
                                                        </span>
                                                    </div>

                                                    {/* Notes */}
                                                    {request.notes && (
                                                        <div className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200">
                                                            {request.notes}
                                                        </div>
                                                    )}

                                                    {/* Convert Button - Manager Only, Pending Only, NOT TIME_OFF */}
                                                    {canManage && request.status === "PENDING" && onConvertRequest && request.type !== "TIME_OFF" && (
                                                        <button
                                                            onClick={() => onConvertRequest(request)}
                                                            className="w-full mt-2 px-3 py-2 bg-nexus-tertiary text-white rounded-md hover:bg-nexus-secondary transition text-sm font-medium"
                                                        >
                                                            {t.convert}
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ScheduleMobileDayView;
