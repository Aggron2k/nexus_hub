"use client";

import { useState } from "react";
import { User, Role } from "@prisma/client";
import { useRouter } from "next/navigation";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/app/context/LanguageContext";

import Button from "@/app/components/Button";
import Modal from "@/app/components/Modal";

interface NewUserModalProps {
    isOpen?: boolean;
    onClose: () => void;
    currentUser: User;
}

const NewUserModal: React.FC<NewUserModalProps> = ({
    isOpen,
    onClose,
    currentUser,
}) => {
    const router = useRouter();
    const { language } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);

    const translations = {
        en: {
            title: "Add New User",
            description: "Create a new user account for your team.",
            name: "Full Name",
            namePlaceholder: "Enter full name...",
            email: "Email Address",
            emailPlaceholder: "user@company.com",
            password: "Password",
            passwordPlaceholder: "Minimum 6 characters...",
            confirmPassword: "Confirm Password",
            confirmPasswordPlaceholder: "Re-enter password...",
            role: "User Role",
            selectRole: "Select role...",
            employee: "Employee",
            manager: "Manager",
            generalManager: "General Manager",
            ceo: "CEO",
            cancel: "Cancel",
            create: "Create User",
            error: "Something went wrong.",
            userCreated: "User created successfully!",
            nameRequired: "Name is required.",
            emailRequired: "Email is required.",
            emailInvalid: "Invalid email format.",
            passwordRequired: "Password is required.",
            passwordMinLength: "Password must be at least 6 characters.",
            confirmPasswordRequired: "Please confirm your password.",
            passwordMismatch: "Passwords do not match.",
            emailExists: "A user with this email already exists.",
        },
        hu: {
            title: "Új felhasználó hozzáadása",
            description: "Új felhasználói fiók létrehozása a csapatnak.",
            name: "Teljes név",
            namePlaceholder: "Írd be a teljes nevet...",
            email: "Email cím",
            emailPlaceholder: "felhasznalo@ceg.hu",
            password: "Jelszó",
            passwordPlaceholder: "Minimum 6 karakter...",
            confirmPassword: "Jelszó megerősítése",
            confirmPasswordPlaceholder: "Jelszó újra...",
            role: "Felhasználói szerepkör",
            selectRole: "Szerepkör kiválasztása...",
            employee: "Alkalmazott",
            manager: "Menedzser",
            generalManager: "Általános Vezető",
            ceo: "Vezérigazgató",
            cancel: "Mégse",
            create: "Felhasználó létrehozása",
            error: "Valami hiba történt.",
            userCreated: "Felhasználó sikeresen létrehozva!",
            nameRequired: "A név megadása kötelező.",
            emailRequired: "Az email megadása kötelező.",
            emailInvalid: "Hibás email formátum.",
            passwordRequired: "A jelszó megadása kötelező.",
            passwordMinLength: "A jelszónak legalább 6 karakternek kell lennie.",
            confirmPasswordRequired: "Erősítsd meg a jelszót.",
            passwordMismatch: "A jelszavak nem egyeznek.",
            emailExists: "Ezzel az email címmel már létezik felhasználó.",
        },
    };

    const t = translations[language];

    // Check if current user can assign roles
    const canAssignRoles = ['GeneralManager', 'CEO'].includes(currentUser.role);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<FieldValues>({
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
            role: Role.Employee,
        },
    });

    const password = watch("password");

    const onSubmit: SubmitHandler<FieldValues> = async (data) => {
        // Validate passwords match
        if (data.password !== data.confirmPassword) {
            toast.error(t.passwordMismatch);
            return;
        }

        setIsLoading(true);

        try {
            // Create new user
            await axios.post("/api/register", {
                name: data.name.trim(),
                email: data.email.toLowerCase().trim(),
                password: data.password,
                role: data.role,
            });

            toast.success(t.userCreated);

            // Close modal and reset form
            onClose();
            reset();

            // Refresh the users list
            router.refresh();

        } catch (error: any) {
            console.error("Error creating user:", error);

            // Handle specific errors
            if (error.response?.status === 409) {
                toast.error(t.emailExists);
            } else if (error.response?.data) {
                toast.error(error.response.data);
            } else {
                toast.error(t.error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        onClose();
        reset();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="border-b border-gray-200 pb-4">
                        <h2 className="text-lg font-semibold leading-6 text-gray-900">
                            {t.title}
                        </h2>
                        <p className="mt-1 text-sm text-gray-600">
                            {t.description}
                        </p>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t.name} <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register("name", {
                                    required: t.nameRequired,
                                    minLength: { value: 2, message: "Name must be at least 2 characters" }
                                })}
                                disabled={isLoading}
                                type="text"
                                className="block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-nexus-tertiary focus:ring-nexus-tertiary sm:text-sm px-3 py-2 bg-white"
                                placeholder={t.namePlaceholder}
                            />
                            {errors.name && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.name.message as string}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t.email} <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register("email", {
                                    required: t.emailRequired,
                                    pattern: {
                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                        message: t.emailInvalid
                                    }
                                })}
                                disabled={isLoading}
                                type="email"
                                className="block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-nexus-tertiary focus:ring-nexus-tertiary sm:text-sm px-3 py-2 bg-white"
                                placeholder={t.emailPlaceholder}
                            />
                            {errors.email && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.email.message as string}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t.password} <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register("password", {
                                    required: t.passwordRequired,
                                    minLength: {
                                        value: 6,
                                        message: t.passwordMinLength
                                    }
                                })}
                                disabled={isLoading}
                                type="password"
                                className="block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-nexus-tertiary focus:ring-nexus-tertiary sm:text-sm px-3 py-2 bg-white"
                                placeholder={t.passwordPlaceholder}
                            />
                            {errors.password && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.password.message as string}
                                </p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t.confirmPassword} <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register("confirmPassword", {
                                    required: t.confirmPasswordRequired,
                                    validate: value => value === password || t.passwordMismatch
                                })}
                                disabled={isLoading}
                                type="password"
                                className="block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-nexus-tertiary focus:ring-nexus-tertiary sm:text-sm px-3 py-2 bg-white"
                                placeholder={t.confirmPasswordPlaceholder}
                            />
                            {errors.confirmPassword && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.confirmPassword.message as string}
                                </p>
                            )}
                        </div>

                        {/* Role - Only for GeneralManager/CEO */}
                        {canAssignRoles && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t.role}
                                </label>
                                <select
                                    {...register("role")}
                                    disabled={isLoading}
                                    className="block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-nexus-tertiary focus:ring-nexus-tertiary sm:text-sm px-3 py-2 bg-white"
                                >
                                    <option value={Role.Employee}>{t.employee}</option>
                                    <option value={Role.Manager}>{t.manager}</option>
                                    <option value={Role.GeneralManager}>{t.generalManager}</option>
                                    <option value={Role.CEO}>{t.ceo}</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center justify-end gap-x-3 pt-4 border-t border-gray-200">
                    <Button
                        disabled={isLoading}
                        onClick={handleClose}
                        type="button"
                        secondary
                    >
                        {t.cancel}
                    </Button>
                    <Button
                        disabled={isLoading}
                        type="submit"
                    >
                        {isLoading ? "..." : t.create}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default NewUserModal;
