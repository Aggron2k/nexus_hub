import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { HiChat } from "react-icons/hi";
import { HiArrowLeftOnRectangle, HiUsers, HiCalendarDays, HiClock, HiDocument } from "react-icons/hi2";
import { HiCash } from "react-icons/hi";
import { FaTasks } from "react-icons/fa";
import { BiTrip } from "react-icons/bi";
import { MdSpaceDashboard } from "react-icons/md";
import { IoLanguage } from "react-icons/io5";

import { signOut } from "next-auth/react";
import { toast } from "react-hot-toast";

import useConversation from "./useConversation";
import { useLanguage } from "@/app/context/LanguageContext";

const useRoutes = () => {
    const pathname = usePathname();
    const { conversationId } = useConversation();
    const { language, toggleLanguage } = useLanguage();

    // Fordítások
    const translations = {
        en: {
            dashboard: "Dashboard",
            chat: "Chat",
            users: "People",
            calendar: "Calendar",
            tasks: "Tasks",
            clockInOut: "Clock In/Out",
            documents: "Documents",
            timeOff: "Time Off",
            payroll: "Payroll",
            language: "Language",
            logout: "Logout",
            logoutSuccess: "Successfully logged out!",
        },
        hu: {
            dashboard: "Irányítópult",
            chat: "Csevegés",
            users: "Emberek",
            calendar: "Naptár",
            tasks: "Feladatok",
            clockInOut: "Be/Kilépés",
            documents: "Iratok",
            timeOff: "Szabadság",
            payroll: "Bérezés",
            language: "Nyelv",
            logout: "Kijelentkezés",
            logoutSuccess: "Sikeresen kijelentkeztél!",
        },
    };

    const routes = useMemo(() => [
        {
            label: translations[language].dashboard,
            href: '/dashboard',
            icon: MdSpaceDashboard,
            active: pathname === '/dashboard',
        },
        {
            label: translations[language].chat,
            href: '/conversations',
            icon: HiChat,
            active: pathname === '/conversations' || !!conversationId,
        },
        {
            label: translations[language].users,
            href: '/users',
            icon: HiUsers,
            active: pathname === '/users',
        },
        {
            label: translations[language].calendar,
            href: '#',
            icon: HiCalendarDays,
        },
        {
            label: translations[language].tasks,
            href: '/todos',
            icon: FaTasks,
            active: pathname === '/todos',
        },
        {
            label: translations[language].clockInOut,
            href: '#',
            icon: HiClock,
        },
        {
            label: translations[language].documents,
            href: '/documents',
            icon: HiDocument,
            active: pathname === '/documents',
        },
        {
            label: translations[language].timeOff,
            href: '#',
            icon: BiTrip,
        },
        {
            label: translations[language].payroll,
            href: '#',
            icon: HiCash,
        },
        {
            label: translations[language].language,
            href: "#",
            icon: IoLanguage,
            onClick: toggleLanguage, // Nyelvváltás
        },
        {
            label: translations[language].logout,
            href: '#',
            onClick: () => {
                toast.success(translations[language].logoutSuccess); // Toast értesítés
                signOut();
            },
            icon: HiArrowLeftOnRectangle,
        },
    ], [pathname, conversationId, toggleLanguage, language]);

    return routes;
};

export default useRoutes;
