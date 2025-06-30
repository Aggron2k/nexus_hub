// app/users/[userId]/page.tsx
import getCurrentUser from "@/app/actions/getCurrentUser";
import { redirect } from "next/navigation";
import UserProfileClient from "../components/UserProfileClient";

interface IParams {
    userId: string;
}

export default async function UserProfilePage({ params }: { params: IParams }) {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        redirect('/login');
    }

    // Jogosultság ellenőrzése: Employee csak saját profilját láthatja
    const canViewOthers = ['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role);

    if (!canViewOthers && params.userId !== currentUser.id) {
        redirect('/users');
    }

    return (
        <UserProfileClient
            currentUser={currentUser}
            selectedUserId={params.userId}
        />
    );
}