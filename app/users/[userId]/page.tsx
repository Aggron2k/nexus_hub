import getCurrentUser from "@/app/actions/getCurrentUser";
import { redirect } from "next/navigation";
import UserProfile from "../components/UserProfile";

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
        <div className="lg:pl-80 h-full">
            <div className="h-full">
                <UserProfile
                    currentUser={currentUser}
                    selectedUserId={params.userId}
                />
            </div>
        </div>
    );
}