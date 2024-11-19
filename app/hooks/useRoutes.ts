import { useMemo } from "react";
import {usePathname} from "next/navigation";
import { HiChat } from "react-icons/hi";
import { HiArrowLeftOnRectangle, HiUsers, HiCalendarDays, HiClock, HiDocument } from "react-icons/hi2";
import { HiCash } from "react-icons/hi";
import { FaTasks } from "react-icons/fa";
import { BiTrip } from "react-icons/bi";

import {signOut } from "next-auth/react";

import useConversation from "./useConversation";

const useRoutes = () => {
    const pathname = usePathname();
    const {conversationId} = useConversation();

    const routes = useMemo(() => [
        {
            label: 'Chat',
            href: '/conversations',
            icon: HiChat,
            active: pathname === '/conversations' || !!conversationId
        },
        {
            label: 'Users',
            href: '/users',
            icon: HiUsers,
            active: pathname === '/users'
        },
        {
            label: 'Calendar',
            href: '#',
            icon: HiCalendarDays
        },
        {
            label: 'Tasks',
            href: '#',
            icon: FaTasks
        },
        {
            label: 'ClockIn/Out',
            href: '#',
            icon: HiClock
        },
        {
            label: 'Documents',
            href: '#',
            icon: HiDocument
        },
        {
            label: 'Time Off',
            href: '#',
            icon: BiTrip
        },
        {
            label: 'Payroll',
            href: '#',
            icon: HiCash
        },
        {
            label: 'logOut',
            href: '#',
            onClick: () => signOut(),
            icon: HiArrowLeftOnRectangle
        }
    ],[pathname, conversationId]);

    return routes;
}

export default useRoutes;
