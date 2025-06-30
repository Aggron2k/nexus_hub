import getCurrentUser from "../actions/getCurrentUser";
import { redirect } from "next/navigation";

export default async function UsersPage() {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        redirect('/login');
    }

    return (
        <div className="hidden lg:block lg:pl-80 h-full">
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl text-gray-300 mb-4">👥</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Válassz egy munkatársat
                    </h3>
                    <p className="text-sm text-gray-500 max-w-sm">
                        Kattints egy munkatársra a bal oldali listából a profil adatok megtekintéséhez
                        {['GeneralManager', 'CEO'].includes(currentUser.role) ? ' és szerkesztéséhez' : ''}.
                    </p>
                </div>
            </div>
        </div>
    );
}