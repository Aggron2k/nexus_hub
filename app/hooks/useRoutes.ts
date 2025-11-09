import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { HiChat, HiCash } from "react-icons/hi";
import { HiArrowLeftOnRectangle, HiUsers, HiCalendarDays, HiDocument, HiClipboardDocumentList } from "react-icons/hi2";
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
            myRequests: "My Requests",
            tasks: "Tasks",
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
            myRequests: "Kéréseim",
            tasks: "Feladatok",
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
            href: '/schedule',
            icon: HiCalendarDays,
            active: pathname === '/schedule',
        },
        {
            label: translations[language].myRequests,
            href: '/my-requests',
            icon: HiClipboardDocumentList,
            active: pathname === '/my-requests',
        },
        {
            label: translations[language].tasks,
            href: '/todos',
            icon: FaTasks,
            active: pathname === '/todos',
        },
        {
            label: translations[language].documents,
            href: '/documents',
            icon: HiDocument,
            active: pathname === '/documents',
        },
        {
            label: translations[language].timeOff,
            href: '/time-off',
            icon: BiTrip,
            active: pathname === '/time-off' || pathname?.startsWith('/time-off/'),
        },
        {
            label: translations[language].payroll,
            href: '/payroll',
            icon: HiCash,
            active: pathname === '/payroll' || pathname?.startsWith('/payroll/'),
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
