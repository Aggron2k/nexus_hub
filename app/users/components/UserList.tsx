"use client";

import { User } from "@prisma/client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import clsx from "clsx";
import UserBox from "./UserBox";
import { useLanguage } from "@/app/context/LanguageContext";
import { HiMagnifyingGlass, HiUsers, HiUserPlus } from "react-icons/hi2";
import NewUserModal from "./NewUserModal";
import toast from "react-hot-toast";

interface UserListProps {
  items: User[];
  deletedItems?: User[];
  currentUser: User;
}

const UserList: React.FC<UserListProps> = ({ items, deletedItems = [], currentUser }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { language } = useLanguage();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);

  // Fordítások
  const translations = {
    en: {
      title: "People",
      search: "Search people...",
      allRoles: "All roles",
      noResults: "No people found",
      limitedAccess: "Limited Access",
      limitedMessage: "You can only view your own profile with your current role.",
      employee: "Employee",
      manager: "Manager",
      generalManager: "General Manager",
      ceo: "CEO",
      addUser: "Add User",
      deletedUsers: "Deleted Users",
      showDeleted: "Show Deleted",
      hideDeleted: "Hide Deleted",
      restore: "Restore",
      deletedBy: "Deleted by",
      deletedAt: "Deleted at",
      restoringUser: "Restoring user...",
      userRestored: "User restored successfully!",
      restoreError: "Failed to restore user"
    },
    hu: {
      title: "Munkatársak",
      search: "Keresés...",
      allRoles: "Minden szerepkör",
      noResults: "Nincs találat",
      limitedAccess: "Korlátozott hozzáférés",
      limitedMessage: "Jelenlegi szerepköröddel csak a saját profil adataid tekintheted meg.",
      employee: "Alkalmazott",
      manager: "Menedzser",
      generalManager: "Általános Vezető",
      ceo: "Vezérigazgató",
      addUser: "Felhasználó hozzáadása",
      deletedUsers: "Törölt felhasználók",
      showDeleted: "Törölt mutatása",
      hideDeleted: "Törölt elrejtése",
      restore: "Visszaállítás",
      deletedBy: "Törölte",
      deletedAt: "Törlés ideje",
      restoringUser: "Felhasználó visszaállítása...",
      userRestored: "Felhasználó sikeresen visszaállítva!",
      restoreError: "Nem sikerült visszaállítani a felhasználót"
    },
  };

  const t = translations[language];

  // Jogosultság ellenőrzése
  const canViewOthers = ['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role);
  const canEdit = ['GeneralManager', 'CEO'].includes(currentUser.role);

  // Mindig tartalmazza a saját felhasználót is, de elkerüli a duplikációt
  const visibleUsers = canViewOthers
    ? items.some(user => user.id === currentUser.id)
      ? items
      : [...items, currentUser]
    : [currentUser];

  // Szűrés
  const filteredUsers = visibleUsers.filter(user => {
    const matchesSearch = !searchTerm ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = selectedRole === 'all' || user.role === selectedRole;

    return matchesSearch && matchesRole;
  });

  // Selected user ID kezelése
  useEffect(() => {
    if (pathname === "/users") {
      setSelectedUserId(null);
    } else if (pathname) {
      const userIdMatch = pathname.match(/\/users\/(.+)/);
      if (userIdMatch) {
        setSelectedUserId(userIdMatch[1]);
      }
    }
  }, [pathname]);

  // Restore user handler
  const handleRestoreUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/restore`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to restore user');
      }

      // Frissítjük az oldalt Next.js router-rel
      router.refresh();
    } catch (error) {
      console.error('Error restoring user:', error);
      toast.error(t.restoreError);
    }
  };

  // Egyedi szerepkörök listája
  const uniqueRoles = Array.from(new Set(visibleUsers.map(user => user.role)));

  // Check if a user is selected (mobile view control)
  const isUserSelected = pathname !== "/users";

  return (
    <>
      {/* New User Modal */}
      <NewUserModal
        currentUser={currentUser}
        isOpen={isNewUserModalOpen}
        onClose={() => setIsNewUserModalOpen(false)}
      />

      <aside
        className={clsx(
          `fixed inset-y-0 pb-20 lg:pb-0 lg:left-20 lg:w-80 lg:block overflow-y-auto border-r border-gray-200`,
          isUserSelected ? "hidden" : "block w-full left-0"
        )}
      >
      <div className="px-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pt-4">
          <div className="text-2xl font-bold text-neutral-800">
            {translations[language].title}
          </div>

          {/* Add User Button - Only for GeneralManager/CEO */}
          {canEdit && (
            <div
              onClick={() => setIsNewUserModalOpen(true)}
              className="rounded-full p-2 bg-nexus-tertiary text-white hover:bg-nexus-primary focus-visible:bg-nexus-primary cursor-pointer transition hover:text-black"
              title={t.addUser}
            >
              <HiUserPlus size={20} />
            </div>
          )}
        </div>

        {/* Keresés és szűrők (csak ha van jogosultsága) */}
        {canViewOthers && (
          <div className="space-y-3 mb-4">
            {/* Keresés */}
            <div className="relative">
              <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={translations[language].search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Szerepkör szűrő */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{t.allRoles}</option>
              {uniqueRoles.map((role) => (
                <option key={role} value={role}>
                  {role === 'Employee' ? t.employee :
                    role === 'Manager' ? t.manager :
                      role === 'GeneralManager' ? t.generalManager :
                        role === 'CEO' ? t.ceo : role}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Jogosultság figyelmeztetés */}
        {!canViewOthers && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-medium text-blue-800">
              {translations[language].limitedAccess}
            </h4>
            <p className="mt-1 text-xs text-blue-700">
              {translations[language].limitedMessage}
            </p>
          </div>
        )}

        {/* Felhasználók listája */}
        <div className="space-y-1">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((item) => (
              <UserBox
                key={item.id}
                data={item}
                currentUser={currentUser}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <HiUsers className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                {translations[language].noResults}
              </p>
            </div>
          )}
        </div>

        {/* Statisztika */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            {filteredUsers.length} / {visibleUsers.length} {translations[language].title.toLowerCase()}
          </p>
        </div>

        {/* Törölt felhasználók - Csak CEO láthatja */}
        {currentUser.role === 'CEO' && deletedItems.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowDeleted(!showDeleted)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition"
            >
              <span>{t.deletedUsers} ({deletedItems.length})</span>
              <span className="text-xs">{showDeleted ? t.hideDeleted : t.showDeleted}</span>
            </button>

            {showDeleted && (
              <div className="mt-2 space-y-2">
                {deletedItems.map((user) => (
                  <div
                    key={user.id}
                    className="p-3 bg-red-50 border border-red-200 rounded-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <img
                            src={user.image || '/images/placeholder.jpg'}
                            alt={user.name || 'User'}
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-600">
                          <p>{t.deletedAt}: {user.deletedAt ? new Date(user.deletedAt).toLocaleDateString(language === 'hu' ? 'hu-HU' : 'en-US') : 'N/A'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRestoreUser(user.id)}
                        className="ml-2 px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition"
                      >
                        {t.restore}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
    </>
  );
};

export default UserList;