"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/app/context/LanguageContext";
import { HiCamera, HiTrash } from "react-icons/hi2";
import Image from "next/image";

interface ProfileImageUploadProps {
    currentImageUrl: string | null;
    onImageUpload: (imageUrl: string) => void;
    onImageRemove: () => void;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
    currentImageUrl,
    onImageUpload,
    onImageRemove,
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl);

    const { language } = useLanguage();

    const translations = {
        en: {
            uploadProfileImage: "Profile Picture",
            chooseImage: "Choose Image",
            uploading: "Uploading...",
            uploadSuccess: "Profile image uploaded successfully!",
            uploadError: "Failed to upload image.",
            onlyJpgPng: "Only JPG and PNG files are allowed!",
            removeImage: "Remove",
            changeImage: "Change",
        },
        hu: {
            uploadProfileImage: "Profilkép",
            chooseImage: "Kép kiválasztása",
            uploading: "Feltöltés...",
            uploadSuccess: "Profilkép sikeresen feltöltve!",
            uploadError: "Nem sikerült feltölteni a képet.",
            onlyJpgPng: "Csak JPG és PNG fájlokat lehet feltölteni!",
            removeImage: "Törlés",
            changeImage: "Módosítás",
        },
    };

    const t = translations[language];

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];

        if (!selectedFile) return;

        // JPG/PNG ellenőrzés
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(selectedFile.type)) {
            toast.error(t.onlyJpgPng);
            e.target.value = '';
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || "krkiyocl");
            formData.append("resource_type", "image");

            const uploadResponse = await axios.post(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                formData
            );

            const imageUrl = uploadResponse.data.secure_url;
            setPreviewUrl(imageUrl);
            onImageUpload(imageUrl);
            toast.success(t.uploadSuccess);
        } catch (error) {
            console.error("Error during image upload:", error);
            toast.error(t.uploadError);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveImage = () => {
        setPreviewUrl(null);
        onImageRemove();
    };

    return (
        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.uploadProfileImage}
            </label>

            <div className="flex items-center gap-4">
                {/* Preview */}
                <div className="relative">
                    <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-300">
                        {previewUrl ? (
                            <Image
                                src={previewUrl}
                                alt="Profile"
                                width={96}
                                height={96}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center">
                                <HiCamera className="h-10 w-10 text-gray-400" />
                            </div>
                        )}
                    </div>
                    {isUploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                    )}
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-2">
                    <label
                        htmlFor="profileImageInput"
                        className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                    >
                        <HiCamera className="h-4 w-4 mr-2" />
                        {previewUrl ? t.changeImage : t.chooseImage}
                        <input
                            id="profileImageInput"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            onChange={handleFileChange}
                            className="sr-only"
                            disabled={isUploading}
                        />
                    </label>

                    {previewUrl && (
                        <button
                            onClick={handleRemoveImage}
                            disabled={isUploading}
                            className="flex items-center justify-center px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            <HiTrash className="h-4 w-4 mr-2" />
                            {t.removeImage}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileImageUpload;
