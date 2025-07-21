"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { User, Role } from '@prisma/client';
import { HiPencil, HiCheck, HiUser, HiBriefcase, HiCog, HiChatBubbleLeft } from 'react-icons/hi2';
import { HiX } from 'react-icons/hi';
import { useLanguage } from '@/app/context/LanguageContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import LoadingModal from '@/app/components/LoadingModal';
import { toast } from 'react-hot-toast';

interface Position {
    id: string;
    name: string;
    displayNames: { en: string; hu: string; };
    color: string;
    isActive: boolean;
}

interface UserWithPosition extends User {
    position?: Position;
    employeeId?: string;
    phoneNumber?: string;
    employmentStatus?: string;
    weeklyWorkHours?: number;
    birthCountry?: string;
    birthCity?: string;
    bankName?: string;
    accountNumber?: string;
    salary?: number;
    hourlyRate?: number;
    currency?: string;
    notes?: string;
    hasPassword?: boolean;
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
    const [activeTab, setActiveTab] = useState<'profile' | 'employment' | 'bank'>('profile');
    const [showPasswordSection, setShowPasswordSection] = useState(false);

    const [editData, setEditData] = useState({
        name: '',
        email: '',
        role: Role.Employee,
        positionId: '',
        image: '',
        employeeId: '',
        phoneNumber: '',
        employmentStatus: 'ACTIVE',
        weeklyWorkHours: 40,
        birthCountry: '',
        birthCity: '',
        bankName: '',
        accountNumber: '',
        salary: 0,
        hourlyRate: 0,
        currency: 'HUF',
        notes: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const { language } = useLanguage();
    const router = useRouter();

    const canEdit = ['GeneralManager', 'CEO'].includes(currentUser.role);
    const isOwnProfile = selectedUserId === currentUser.id;

    const translations = {
        en: {
            profile: "User Profile", edit: "Edit", save: "Save", cancel: "Cancel", saving: "Saving...",
            name: "Name", email: "Email", role: "Role", position: "Position", profileImage: "Profile Image",
            registered: "Registered", lastModified: "Last Modified", chat: "Chat", loading: "Loading...",
            employee: "Employee", manager: "Manager", generalManager: "General Manager", ceo: "CEO",
            profileTab: "Profile", employmentTab: "Employment", bankTab: "Banking",
            employeeId: "Employee ID", phoneNumber: "Phone", employmentStatus: "Status",
            weeklyWorkHours: "Weekly Hours", birthCountry: "Birth Country", birthCity: "Birth City",
            bankName: "Bank", accountNumber: "Account", salary: "Salary", hourlyRate: "Hourly Rate",
            currency: "Currency", notes: "Notes", changePassword: "Change Password",
            currentPassword: "Current Password", newPassword: "New Password", confirmPassword: "Confirm Password",
            active: "Active", inactive: "Inactive", suspended: "Suspended", terminated: "Terminated",
            quickStats: "Quick Stats", daysInTeam: "Days in team", currentRole: "Current role",
            oauthPasswordMessage: "Password change is not available for users authenticated with OAuth providers (Google, GitHub)."
        },
        hu: {
            profile: "Felhasználói Profil", edit: "Szerkesztés", save: "Mentés", cancel: "Mégse", saving: "Mentés...",
            name: "Név", email: "Email", role: "Szerep", position: "Pozíció", profileImage: "Profilkép",
            registered: "Regisztráció", lastModified: "Utolsó módosítás", chat: "Chat", loading: "Betöltés...",
            employee: "Alkalmazott", manager: "Menedzser", generalManager: "Általános Vezető", ceo: "Vezérigazgató",
            profileTab: "Alapadatok", employmentTab: "Munkavállalói adatok", bankTab: "Banki adatok",
            employeeId: "Munkavállalói azonosító", phoneNumber: "Telefon", employmentStatus: "Állapot",
            weeklyWorkHours: "Heti munkaidő", birthCountry: "Születési ország", birthCity: "Születési város",
            bankName: "Bank", accountNumber: "Számlaszám", salary: "Fizetés", hourlyRate: "Órabér",
            currency: "Pénznem", notes: "Megjegyzések", changePassword: "Jelszó módosítása",
            currentPassword: "Jelenlegi jelszó", newPassword: "Új jelszó", confirmPassword: "Új jelszó megerősítése",
            active: "Aktív", inactive: "Inaktív", suspended: "Felfüggesztve", terminated: "Megszüntetett",
            quickStats: "Gyors statisztikák", daysInTeam: "Napja a csapatban", currentRole: "Jelenlegi szerep",
            oauthPasswordMessage: "A jelszó módosítása nem elérhető OAuth szolgáltatókkal (Google, GitHub) bejelentkezett felhasználók számára."
        }
    };

    const t = translations[language];

    // Adatok betöltése
    useEffect(() => {
        const fetchData = async () => {
            if (!selectedUserId) return;
            setLoading(true);
            try {
                const [userRes, posRes] = await Promise.all([
                    fetch(`/api/users/${selectedUserId}`),
                    fetch('/api/positions')
                ]);

                if (userRes.ok) {
                    const userData = await userRes.json();
                    setSelectedUser(userData);
                    setEditData({
                        name: userData.name || '',
                        email: userData.email || '',
                        role: userData.role || Role.Employee,
                        positionId: userData.positionId || '',
                        image: userData.image || '',
                        employeeId: userData.employeeId || '',
                        phoneNumber: userData.phoneNumber || '',
                        employmentStatus: userData.employmentStatus || 'ACTIVE',
                        weeklyWorkHours: userData.weeklyWorkHours || 40,
                        birthCountry: userData.birthCountry || '',
                        birthCity: userData.birthCity || '',
                        bankName: userData.bankName || '',
                        accountNumber: userData.accountNumber || '',
                        salary: userData.salary || 0,
                        hourlyRate: userData.hourlyRate || 0,
                        currency: userData.currency || 'HUF',
                        notes: userData.notes || ''
                    });
                }

                if (posRes.ok) {
                    const posData = await posRes.json();
                    setPositions(posData);
                }
            } catch (err) {
                setError('Error loading data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedUserId]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/users/${selectedUserId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData),
            });
            if (response.ok) {
                const updatedUser = await response.json();
                setSelectedUser(updatedUser);
                setIsEditing(false);
                toast.success('Profil frissítve!');
            }
        } catch (err) {
            toast.error('Hiba történt!');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('A jelszavak nem egyeznek!');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`/api/users/${selectedUserId}/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                }),
            });
            if (response.ok) {
                toast.success('Jelszó megváltoztatva!');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setShowPasswordSection(false);
            } else {
                toast.error('Hibás jelenlegi jelszó!');
            }
        } catch (err) {
            toast.error('Hiba történt!');
        } finally {
            setLoading(false);
        }
    };

    const handleChatClick = useCallback(() => {
        if (!selectedUser || isOwnProfile) return;
        setChatLoading(true);
        axios.post('/api/conversations', { userId: selectedUser.id })
            .then((response) => router.push(`/conversations/${response.data.id}`))
            .catch(() => setError('Chat hiba'))
            .finally(() => setChatLoading(false));
    }, [selectedUser, isOwnProfile, router]);

    const getRoleDisplayName = (role: Role) => {
        const roles = { [Role.Employee]: t.employee, [Role.Manager]: t.manager, [Role.GeneralManager]: t.generalManager, [Role.CEO]: t.ceo };
        return roles[role];
    };

    const getRoleColor = (role: Role) => {
        const colors = { [Role.Employee]: 'bg-blue-100 text-blue-800', [Role.Manager]: 'bg-green-100 text-green-800', [Role.GeneralManager]: 'bg-purple-100 text-purple-800', [Role.CEO]: 'bg-red-100 text-red-800' };
        return colors[role];
    };

    if (loading && !selectedUser) return <LoadingModal />;
    if (!selectedUser) return <div className="lg:pl-80 h-full flex items-center justify-center"><p>Felhasználó nem található</p></div>;

    const userPosition = selectedUser.position;

    return (
        <>
            {loading && <LoadingModal />}
            <div className="lg:pl-80 h-full">
                <div className="h-full flex flex-col bg-nexus-bg">
                    {/* Header */}
                    <div className="bg-white border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img src={selectedUser.image || '/images/placeholder.jpg'} alt={selectedUser.name || ''} className="h-10 w-10 rounded-full object-cover" />
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">{selectedUser.name || 'Név nem megadva'}</h1>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs ${getRoleColor(selectedUser.role)}`}>
                                            {getRoleDisplayName(selectedUser.role)}
                                        </span>
                                        {selectedUser.employeeId && <span className="text-gray-500">#{selectedUser.employeeId}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {!isOwnProfile && <button onClick={handleChatClick} disabled={chatLoading} className="flex items-center gap-2 px-4 py-2 bg-nexus-primary text-nexus-tertiary rounded-lg hover:bg-opacity-90"><HiChatBubbleLeft className="h-4 w-4" />{t.chat}</button>}
                                {(canEdit || isOwnProfile) && !isEditing && <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"><HiPencil className="h-4 w-4" />{t.edit}</button>}
                                {isEditing && (
                                    <>
                                        <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"><HiCheck className="h-4 w-4" />{loading ? t.saving : t.save}</button>
                                        <button onClick={() => setIsEditing(false)} disabled={loading} className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"><HiX className="h-4 w-4" />{t.cancel}</button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-auto p-6">
                        <div className="max-w-4xl mx-auto space-y-6">
                            {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>}

                            {/* Tabs */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                <div className="border-b border-gray-200">
                                    <nav className="-mb-px flex space-x-8 px-6">
                                        {[
                                            { key: 'profile', icon: HiUser, label: t.profileTab },
                                            { key: 'employment', icon: HiBriefcase, label: t.employmentTab },
                                            { key: 'bank', icon: HiCog, label: t.bankTab }
                                        ].map(({ key, icon: Icon, label }) => (
                                            <button key={key} onClick={() => setActiveTab(key as any)} className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === key ? 'border-nexus-primary text-nexus-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                                <Icon className="h-4 w-4" />{label}
                                            </button>
                                        ))}
                                    </nav>
                                </div>

                                <div className="p-6">
                                    {/* Profile Tab */}
                                    {activeTab === 'profile' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {[
                                                { key: 'name', label: t.name, type: 'text' },
                                                { key: 'email', label: t.email, type: 'email' },
                                                { key: 'role', label: t.role, type: 'select', options: [{ value: Role.Employee, label: t.employee }, { value: Role.Manager, label: t.manager }, { value: Role.GeneralManager, label: t.generalManager }, { value: Role.CEO, label: t.ceo }], disabled: !canEdit },
                                                { key: 'positionId', label: t.position, type: 'select', options: positions.map(p => ({ value: p.id, label: p.displayNames[language] || p.name })) }
                                            ].map(({ key, label, type, options, disabled }) => (
                                                <div key={key}>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                                                    {isEditing ? (
                                                        type === 'select' ? (
                                                            <select value={editData[key as keyof typeof editData] as string} onChange={(e) => setEditData({ ...editData, [key]: e.target.value })} disabled={disabled} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexus-primary focus:border-nexus-primary">
                                                                <option value="">Válassz...</option>
                                                                {options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                            </select>
                                                        ) : (
                                                            <input type={type} value={editData[key as keyof typeof editData] as string} onChange={(e) => setEditData({ ...editData, [key]: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexus-primary focus:border-nexus-primary" />
                                                        )
                                                    ) : (
                                                        <p className="text-gray-900">{key === 'role' ? getRoleDisplayName(selectedUser[key]) : key === 'positionId' ? (userPosition?.displayNames[language] || userPosition?.name || '-') : (selectedUser[key as keyof typeof selectedUser] as string) || '-'}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Employment Tab */}
                                    {activeTab === 'employment' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {[
                                                { key: 'employeeId', label: t.employeeId, type: 'text' },
                                                { key: 'phoneNumber', label: t.phoneNumber, type: 'tel' },
                                                { key: 'employmentStatus', label: t.employmentStatus, type: 'select', options: [{ value: 'ACTIVE', label: t.active }, { value: 'INACTIVE', label: t.inactive }, { value: 'SUSPENDED', label: t.suspended }, { value: 'TERMINATED', label: t.terminated }] },
                                                { key: 'weeklyWorkHours', label: t.weeklyWorkHours, type: 'number' },
                                                { key: 'birthCountry', label: t.birthCountry, type: 'text' },
                                                { key: 'birthCity', label: t.birthCity, type: 'text' }
                                            ].map(({ key, label, type, options }) => (
                                                <div key={key}>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                                                    {isEditing ? (
                                                        type === 'select' ? (
                                                            <select value={editData[key as keyof typeof editData] as string} onChange={(e) => setEditData({ ...editData, [key]: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexus-primary focus:border-nexus-primary">
                                                                {options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                            </select>
                                                        ) : (
                                                            <input type={type} value={editData[key as keyof typeof editData] as string} onChange={(e) => setEditData({ ...editData, [key]: type === 'number' ? parseInt(e.target.value) || 0 : e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexus-primary focus:border-nexus-primary" />
                                                        )
                                                    ) : (
                                                        <p className="text-gray-900">{key === 'employmentStatus' ? translations[language][selectedUser[key] as keyof typeof translations[typeof language]] || selectedUser[key] : (selectedUser[key as keyof typeof selectedUser] as string) || '-'}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Bank Tab */}
                                    {activeTab === 'bank' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {[
                                                { key: 'bankName', label: t.bankName, type: 'text' },
                                                { key: 'accountNumber', label: t.accountNumber, type: 'text' },
                                                { key: 'salary', label: t.salary, type: 'number' },
                                                { key: 'hourlyRate', label: t.hourlyRate, type: 'number' }
                                            ].map(({ key, label, type }) => (
                                                <div key={key}>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                                                    {isEditing ? (
                                                        <input type={type} value={editData[key as keyof typeof editData] as string} onChange={(e) => setEditData({ ...editData, [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexus-primary focus:border-nexus-primary" />
                                                    ) : (
                                                        <p className="text-gray-900">{(selectedUser[key as keyof typeof selectedUser] as string) || '-'}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Password Change */}
                            {isOwnProfile && (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-medium text-gray-900">{t.changePassword}</h3>
                                        {selectedUser?.hasPassword ? (
                                            <button onClick={() => setShowPasswordSection(!showPasswordSection)} className="text-nexus-primary hover:text-opacity-80 text-sm">{showPasswordSection ? t.cancel : t.changePassword}</button>
                                        ) : (
                                            <span className="text-gray-400 text-sm">OAuth</span>
                                        )}
                                    </div>
                                    {selectedUser?.hasPassword ? (
                                        showPasswordSection && (
                                            <div className="space-y-4">
                                                {[
                                                    { key: 'currentPassword', label: t.currentPassword },
                                                    { key: 'newPassword', label: t.newPassword },
                                                    { key: 'confirmPassword', label: t.confirmPassword }
                                                ].map(({ key, label }) => (
                                                    <div key={key}>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                                                        <input type="password" value={passwordData[key as keyof typeof passwordData]} onChange={(e) => setPasswordData({ ...passwordData, [key]: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexus-primary focus:border-nexus-primary" />
                                                    </div>
                                                ))}
                                                <button onClick={handlePasswordChange} disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword} className="w-full px-4 py-2 bg-nexus-primary text-nexus-tertiary rounded-lg hover:bg-opacity-90 disabled:opacity-50">{loading ? t.saving : t.changePassword}</button>
                                            </div>
                                        )
                                    ) : (
                                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <p className="text-sm text-yellow-800">{t.oauthPasswordMessage}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Quick Stats */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">{t.quickStats}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-nexus-primary rounded-lg">
                                        <div className="text-2xl font-bold text-nexus-tertiary">{Math.floor((Date.now() - new Date(selectedUser.createdAt).getTime()) / (1000 * 60 * 60 * 24))}</div>
                                        <div className="text-sm text-nexus-tertiary">{t.daysInTeam}</div>
                                    </div>
                                    <div className="text-center p-4 bg-green-50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">{getRoleDisplayName(selectedUser.role)}</div>
                                        <div className="text-sm text-green-600">{t.currentRole}</div>
                                    </div>
                                    <div className="text-center p-4 rounded-lg" style={{ backgroundColor: userPosition?.color ? `${userPosition.color}20` : '#f3f4f6' }}>
                                        <div className="text-2xl font-bold" style={{ color: userPosition?.color || '#6b7280' }}>{userPosition?.displayNames[language] || userPosition?.name || 'N/A'}</div>
                                        <div className="text-sm" style={{ color: userPosition?.color || '#6b7280' }}>{t.position}</div>
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