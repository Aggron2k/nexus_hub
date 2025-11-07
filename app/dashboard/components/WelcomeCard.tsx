"use client";

import { User } from "@prisma/client";
import { useLanguage } from "@/app/context/LanguageContext";
import { HiUser, HiEnvelope, HiPhone, HiCalendar, HiBriefcase } from "react-icons/hi2";
import Avatar from "@/app/components/Avatar";

interface WelcomeCardProps {
    user: User | null;
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({ user }) => {
    const { language } = useLanguage();

    const translations = {
        en: {
            welcome: "Welcome Back",
            email: "Email",
            phone: "Phone",
            hireDate: "Hire Date",
            role: "Role",
            status: "Status",
            employee: "Employee",
            manager: "Manager",
            generalManager: "General Manager",
            ceo: "CEO",
            active: "Active",
            inactive: "Inactive",
            terminated: "Terminated"
        },
        hu: {
            welcome: "Üdvözlünk újra",
            email: "Email",
            phone: "Telefon",
            hireDate: "Belépés dátuma",
            role: "Szerepkör",
            status: "Státusz",
            employee: "Alkalmazott",
            manager: "Menedzser",
            generalManager: "Általános Vezető",
            ceo: "Vezérigazgató",
            active: "Aktív",
            inactive: "Inaktív",
            terminated: "Felmondva"
        }
    };

    const t = translations[language];

    if (!user) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500">{language === 'hu' ? 'Betöltés...' : 'Loading...'}</p>
            </div>
        );
    }

    // Role fordítás
    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'Employee': return t.employee;
            case 'Manager': return t.manager;
            case 'GeneralManager': return t.generalManager;
            case 'CEO': return t.ceo;
            default: return role;
        }
    };

    // Status fordítás
    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'ACTIVE': return t.active;
            case 'INACTIVE': return t.inactive;
            case 'TERMINATED': return t.terminated;
            default: return status;
        }
    };

    // Status szín
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-100 text-green-800';
            case 'INACTIVE': return 'bg-yellow-100 text-yellow-800';
            case 'TERMINATED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Avatar user={user} />
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">{t.welcome}</h2>
                    <p className="text-xl font-semibold text-nexus-tertiary">{user.name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user.employmentStatus || 'ACTIVE')}`}>
                    {getStatusLabel(user.employmentStatus || 'ACTIVE')}
                </span>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Role */}
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-nexus-primary rounded-lg">
                        <HiBriefcase className="h-5 w-5 text-nexus-tertiary" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">{t.role}</p>
                        <p className="text-sm font-medium text-gray-900">{getRoleLabel(user.role)}</p>
                    </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-nexus-primary rounded-lg">
                        <HiEnvelope className="h-5 w-5 text-nexus-tertiary" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">{t.email}</p>
                        <p className="text-sm font-medium text-gray-900">{user.email}</p>
                    </div>
                </div>

                {/* Phone */}
                {user.phoneNumber && (
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-nexus-primary rounded-lg">
                            <HiPhone className="h-5 w-5 text-nexus-tertiary" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">{t.phone}</p>
                            <p className="text-sm font-medium text-gray-900">{user.phoneNumber}</p>
                        </div>
                    </div>
                )}

                {/* Hire Date */}
                {user.hireDate && (
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-nexus-primary rounded-lg">
                            <HiCalendar className="h-5 w-5 text-nexus-tertiary" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">{t.hireDate}</p>
                            <p className="text-sm font-medium text-gray-900">
                                {new Date(user.hireDate).toLocaleDateString(language === 'hu' ? 'hu-HU' : 'en-US')}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WelcomeCard;
