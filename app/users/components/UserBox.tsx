"use client";

import { User } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import Avatar from "@/app/components/Avatar";
import { useLanguage } from "@/app/context/LanguageContext";

interface UserBoxProps {
  data: User;
  currentUser: User;
}

const UserBox: React.FC<UserBoxProps> = ({ data, currentUser }) => {
  const router = useRouter();
  const { language } = useLanguage();

  // Jogosultság ellenőrzése
  const canEdit = ['GeneralManager', 'CEO'].includes(currentUser.role);
  const isOwnProfile = data.id === currentUser.id;

  // Fordítások
  const translations = {
    en: {
      nameNotProvided: "Name not provided",
      employee: "Employee",
      manager: "Manager",
      generalManager: "General Manager",
      ceo: "CEO",
      you: "(You)"
    },
    hu: {
      nameNotProvided: "Név nem megadva",
      employee: "Alkalmazott",
      manager: "Menedzser",
      generalManager: "Általános Vezető",
      ceo: "Vezérigazgató",
      you: "(Te)"
    }
  };

  const t = translations[language];

  const handleClick = useCallback(() => {
    // Navigálás a profil oldalra
    router.push(`/users/${data.id}`);
  }, [data.id, router]);

  const getRoleDisplayName = (role: string) => {
    const roleNames: { [key: string]: string } = {
      'Employee': t.employee,
      'Manager': t.manager,
      'GeneralManager': t.generalManager,
      'CEO': t.ceo
    };
    return roleNames[role] || role;
  };

  const getRoleColor = (role: string) => {
    const roleColors: { [key: string]: string } = {
      'Employee': 'bg-blue-100 text-blue-800',
      'Manager': 'bg-green-100 text-green-800',
      'GeneralManager': 'bg-purple-100 text-purple-800',
      'CEO': 'bg-red-100 text-red-800'
    };
    return roleColors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div
      onClick={handleClick}
      className="w-full relative flex items-center space-x-3 bg-white p-3 hover:bg-nexus-primary rounded-lg transition cursor-pointer group"
    >
      <Avatar user={data} />

      <div className="min-w-0 flex-1">
        <div className="focus:outline-none">
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {data.name || t.nameNotProvided}
            </p>
          </div>

            <p className="text-xs text-gray-600 truncate">
              {data.email}
            </p>

            {/* Szerep badge */}
            <div className="mt-1">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getRoleColor(data.role)}`}>
                {getRoleDisplayName(data.role)}
              </span>
            </div>

            {/* Saját profil jelzés */}
            {isOwnProfile && (
              <div className="mt-1">
                <span className="text-xs text-blue-600 font-medium">
                  {t.you}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default UserBox;