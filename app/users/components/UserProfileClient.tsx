"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { User, Role } from '@prisma/client';
import { HiPencil, HiCheck, HiUser, HiBriefcase, HiCog, HiCamera, HiChatBubbleLeft } from 'react-icons/hi2';
import { HiX, HiMail } from 'react-icons/hi';
import { useLanguage } from '@/app/context/LanguageContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import LoadingModal from '@/app/components/LoadingModal';

interface Position {
    id: string;
    name: string;
    displayName: string;
    color: string;
}

interface UserWithPosition extends User {
    position?: Position;
}

interface UserProfileClientProps {
    currentUser: User;
    selectedUserId: string;
}

const UserProfileClient: React.FC<UserProfileClientProps> = ({ currentUser, selectedUserId }) => {
    const [selectedUser, setSelectedUser] = useState<UserWithPosition | null>(null);
    const [positions, setPositions] = useState<Position[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [chatLoading, setChatLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editData, setEditData] = useState({
        name: '',
        email: '',
        role: Role.Employee,
        positionId: '',
        image: ''
    });

    const { language } = useLanguage();
    const router = useRouter();

    // Jogosultság ellenőrzése
    const canEdit = ['GeneralManager', 'CEO'].includes(currentUser.role);
    const isOwnProfile = selectedUserId === currentUser.id;

    // Fordítások
    const translations = {
        en: {
            profile: "User Profile",
            myProfile: "My Profile",
            edit: "Edit",
            save: "Save",
            cancel: "Cancel",
            saving: "Saving...",
            name: "Name",
            email: "Email Address",
            role: "Role",
            position: "Position",
            profileImage: "Profile Image URL",
            registered: "Registered",
            lastModified: "Last Modified",
            noEditPermission: "You can only view profile data. GeneralManager or CEO permission required for editing.",
            selectPosition: "Select position",
            nameNotProvided: "Name not provided",
            positionNotProvided: "Position not provided",
            errorOccurred: "An error occurred",
            userNotFound: "User not found",
            employee: "Employee",
            manager: "Manager",
            generalManager: "General Manager",
            ceo: "CEO",
            chat: "Chat",
            loading: "Loading...",
            quickStats: "Quick Statistics",
            daysInTeam: "Days in team",
            currentRole: "Current role",
            teamMembers: "Team Members"
        },
        hu: {
            profile: "Felhasználói Profil",
            myProfile: "Saját Profil",
            edit: "Szerkesztés",
            save: "Mentés",
            cancel: "Mégse",
            saving: "Mentés...",
            name: "Név",
            email: "Email cím",
            role: "Szerep",
            position: "Pozíció",
            profileImage: "Profilkép URL",
            registered: "Regisztráció",
            lastModified: "Utolsó módosítás",
            noEditPermission: "Csak megtekintheted a profil adatokat. A módosításhoz GeneralManager vagy CEO jogosultság szükséges.",
            selectPosition: "Válassz pozíciót",
            nameNotProvided: "Név nem megadva",
            positionNotProvided: "Pozíció nincs megadva",
            errorOccurred: "Hiba történt",
            userNotFound: "Felhasználó nem található",
            employee: "Alkalmazott",
            manager: "Menedzser",
            generalManager: "Általános Vezető",
            ceo: "Vezérigazgató",
            chat: "Chat",
            loading: "Betöltés...",
            quickStats: "Gyors statisztikák",
            daysInTeam: "Napja a csapatban",
            currentRole: "Jelenlegi szerep",
            teamMembers: "Munkatársak"
        }
    };

    const t = translations[language];

    // Pozíciók betöltése API-ból
    useEffect(() => {
        const fetchPositions = async () => {
            try {
                const response = await fetch('/api/positions');
                if (response.ok) {
                    const positionsData = await response.json();
                    setPositions(positionsData);
                }
            } catch (error) {
                console.error('Error fetching positions:', error);
                // Fallback mock pozíciók
                const mockPositions = [
                    { id: '1', name: 'Cashier', displayName: 'Pénztáros', color: '#3B82F6' },
                    { id: '2', name: 'Kitchen', displayName: 'Konyha', color: '#EF4444' },
                    { id: '3', name: 'Storage', displayName: 'Raktár', color: '#10B981' },
                    { id: '4', name: 'Packer', displayName: 'Csomagoló', color: '#F59E0B' },
                    { id: '5', name: 'Delivery', displayName: 'Kiszállító', color: '#8B5CF6' }
                ];
                setPositions(mockPositions);
            }
        };

        fetchPositions();
    }, []);

    // Felhasználó adatok betöltése
    useEffect(() => {
        const fetchUser = async () => {
            if (!selectedUserId) return;

            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`/api/users/${selectedUserId}`);

                if (!response.ok) {
                    throw new Error(await response.text());
                }

                const userData = await response.json();
                setSelectedUser(userData);

                // Edit data inicializálása
                setEditData({
                    name: userData.name || '',
                    email: userData.email,
                    role: userData.role,
                    positionId: userData.positionId || '',
                    image: userData.image || ''
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : t.errorOccurred);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [selectedUserId, t.errorOccurred]);

    const handleSave = async () => {
        if (!selectedUser) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/users/${selectedUserId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(editData),
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const updatedUser = await response.json();
            setSelectedUser(updatedUser);
            setIsEditing(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : t.errorOccurred);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (!selectedUser) return;

        setEditData({
            name: selectedUser.name || '',
            email: selectedUser.email,
            role: selectedUser.role,
            positionId: selectedUser.positionId || '',
            image: selectedUser.image || ''
        });
        setIsEditing(false);
        setError(null);
    };

    const handleChatClick = useCallback(() => {
        if (!selectedUser || isOwnProfile) return;

        setChatLoading(true);

        axios.post('/api/conversations', {
            userId: selectedUser.id
        })
            .then((response) => {
                router.push(`/conversations/${response.data.id}`);
            })
            .catch((error) => {
                console.error('Error creating conversation:', error);
                setError('Hiba történt a chat létrehozása közben');
            })
            .finally(() => setChatLoading(false));
    }, [selectedUser, isOwnProfile, router]);

    const getRoleDisplayName = (role: Role) => {
        const roleNames = {
            [Role.Employee]: t.employee,
            [Role.Manager]: t.manager,
            [Role.GeneralManager]: t.generalManager,
            [Role.CEO]: t.ceo
        };
        return roleNames[role];
    };

    const getRoleColor = (role: Role) => {
        const roleColors = {
            [Role.Employee]: 'bg-blue-100 text-blue-800',
            [Role.Manager]: 'bg-green-100 text-green-800',
            [Role.GeneralManager]: 'bg-purple-100 text-purple-800',
            [Role.CEO]: 'bg-red-100 text-red-800'
        };
        return roleColors[role];
    };

    if (loading && !selectedUser) {
        return (
            <div className="lg:pl-80 h-full">
                <div className="h-full flex flex-col bg-nexus-bg">
                    <div className="flex-1 flex items-center justify-center">
                        <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nexus-tertiary"></div>
                            <span className="ml-3 text-gray-600">{t.loading}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !selectedUser) {
        return (
            <div className="lg:pl-80 h-full">
                <div className="h-full flex flex-col bg-nexus-bg">
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-red-600 mb-2">{t.errorOccurred}</div>
                            <p className="text-sm text-gray-600">{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!selectedUser) {
        return (
            <div className="lg:pl-80 h-full">
                <div className="h-full flex flex-col bg-nexus-bg">
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-gray-500">{t.userNotFound}</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const userPosition = positions.find(p => p.id === selectedUser.positionId);

    return (
        <>
            {(loading || chatLoading) && <LoadingModal />}
            <div className="lg:pl-80 h-full">
                <div className="h-full flex flex-col bg-nexus-bg">
                    {/* Header */}
                    <div className="bg-white border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-nexus-primary rounded-lg">
                                    <HiUser className="h-6 w-6 text-nexus-tertiary" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {isOwnProfile ? t.myProfile : t.profile}
                                </h1>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Chat gomb (ha nem saját profil) */}
                                {!isOwnProfile && (
                                    <button
                                        onClick={handleChatClick}
                                        disabled={chatLoading}
                                        className="flex items-center gap-2 px-4 py-2 bg-nexus-primary text-nexus-tertiary rounded-lg hover:bg-nexus-secondary transition-colors disabled:opacity-50"
                                    >
                                        <HiChatBubbleLeft className="h-4 w-4" />
                                        {chatLoading ? t.loading : t.chat}
                                    </button>
                                )}

                                {/* Szerkesztés gomb */}
                                {(canEdit || isOwnProfile) && !isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <HiPencil className="h-4 w-4" />
                                        {t.edit}
                                    </button>
                                )}

                                {/* Mentés/Mégse gombok */}
                                {isEditing && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSave}
                                            disabled={loading}
                                            className="flex items-center gap-2 px-4 py-2 bg-nexus-primary text-nexus-tertiary rounded-lg hover:bg-nexus-secondary transition-colors disabled:opacity-50"
                                        >
                                            <HiCheck className="h-4 w-4" />
                                            {loading ? t.saving : t.save}
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            disabled={loading}
                                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <HiX className="h-4 w-4" />
                                            {t.cancel}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-auto p-6">
                        <div className="max-w-4xl mx-auto space-y-6">
                            {/* Error Alert */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div className="text-sm text-red-800">{error}</div>
                                </div>
                            )}

                            {/* Profile Card */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="lg:flex lg:items-start lg:gap-8">
                                    {/* Profile Image */}
                                    <div className="flex-shrink-0 mb-6 lg:mb-0">
                                        <div className="relative w-32 h-32 mx-auto lg:mx-0">
                                            <img
                                                src={isEditing ? (editData.image || '/default-avatar.png') : (selectedUser.image || '/default-avatar.png')}
                                                alt="Profile"
                                                className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
                                            />
                                            {isEditing && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                                                    <HiCamera className="h-8 w-8 text-white" />
                                                </div>
                                            )}
                                        </div>

                                        {isEditing && (
                                            <div className="mt-3 w-32 mx-auto lg:mx-0">
                                                <input
                                                    type="url"
                                                    value={editData.image}
                                                    onChange={(e) => setEditData({ ...editData, image: e.target.value })}
                                                    placeholder={t.profileImage}
                                                    className="w-full text-xs px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexus-tertiary focus:border-transparent"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Profile Info */}
                                    <div className="flex-1 space-y-6">
                                        {/* Name */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                {t.name}
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editData.name}
                                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexus-tertiary focus:border-transparent"
                                                />
                                            ) : (
                                                <p className="text-lg font-semibold text-gray-900">
                                                    {selectedUser.name || t.nameNotProvided}
                                                </p>
                                            )}
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <HiMail className="inline h-4 w-4 mr-1" />
                                                {t.email}
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="email"
                                                    value={editData.email}
                                                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexus-tertiary focus:border-transparent"
                                                />
                                            ) : (
                                                <p className="text-gray-900">{selectedUser.email}</p>
                                            )}
                                        </div>

                                        {/* Role */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <HiCog className="inline h-4 w-4 mr-1" />
                                                {t.role}
                                            </label>
                                            {isEditing && !isOwnProfile && canEdit ? (
                                                <select
                                                    value={editData.role}
                                                    onChange={(e) => setEditData({ ...editData, role: e.target.value as Role })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexus-tertiary focus:border-transparent"
                                                >
                                                    <option value={Role.Employee}>{t.employee}</option>
                                                    <option value={Role.Manager}>{t.manager}</option>
                                                    {currentUser.role === Role.CEO && (
                                                        <>
                                                            <option value={Role.GeneralManager}>{t.generalManager}</option>
                                                            <option value={Role.CEO}>{t.ceo}</option>
                                                        </>
                                                    )}
                                                </select>
                                            ) : (
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(selectedUser.role)}`}>
                                                    {getRoleDisplayName(selectedUser.role)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Position */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <HiBriefcase className="inline h-4 w-4 mr-1" />
                                                {t.position}
                                            </label>
                                            {isEditing ? (
                                                <select
                                                    value={editData.positionId}
                                                    onChange={(e) => setEditData({ ...editData, positionId: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexus-tertiary focus:border-transparent"
                                                >
                                                    <option value="">{t.selectPosition}</option>
                                                    {positions.map((position) => (
                                                        <option key={position.id} value={position.id}>
                                                            {position.displayName}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    {userPosition ? (
                                                        <>
                                                            <div
                                                                className="h-4 w-4 rounded-full flex-shrink-0"
                                                                style={{ backgroundColor: userPosition.color }}
                                                            />
                                                            <span className="text-gray-900">{userPosition.displayName}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-500">{t.positionNotProvided}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Additional Info */}
                                        <div className="pt-6 border-t border-gray-200">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        {t.registered}
                                                    </label>
                                                    <p className="text-sm text-gray-900">
                                                        {new Date(selectedUser.createdAt).toLocaleDateString('hu-HU', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        {t.lastModified}
                                                    </label>
                                                    <p className="text-sm text-gray-900">
                                                        {new Date(selectedUser.updatedAt).toLocaleDateString('hu-HU', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Permissions Warning */}
                                        {!canEdit && !isOwnProfile && (
                                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                                <p className="text-sm text-blue-800">
                                                    <strong>ℹ️ {t.profile}:</strong> {t.noEditPermission}
                                                </p>
                                            </div>
                                        )}

                                        {/* Own Profile Note */}
                                        {isOwnProfile && (
                                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                                <p className="text-sm text-green-800">
                                                    <strong>✓ {t.myProfile}:</strong> Szerkesztheted a saját profil adataidat.
                                                    {!canEdit && " A szerepköröd módosításához kérj segítséget egy vezetőtől."}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats Card */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">{t.quickStats}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-nexus-primary rounded-lg">
                                        <div className="text-2xl font-bold text-nexus-tertiary">
                                            {Math.floor((Date.now() - new Date(selectedUser.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                                        </div>
                                        <div className="text-sm text-nexus-tertiary">{t.daysInTeam}</div>
                                    </div>
                                    <div className="text-center p-4 bg-green-50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">
                                            {getRoleDisplayName(selectedUser.role)}
                                        </div>
                                        <div className="text-sm text-green-600">{t.currentRole}</div>
                                    </div>
                                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                                        <div className="text-2xl font-bold text-purple-600">
                                            {userPosition?.displayName || 'N/A'}
                                        </div>
                                        <div className="text-sm text-purple-600">{t.position}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default UserProfileClient;