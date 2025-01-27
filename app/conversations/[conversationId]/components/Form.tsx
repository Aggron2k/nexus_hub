"use client";
import useConversation from "@/app/hooks/useConversation";
import axios from "axios";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { HiPaperAirplane, HiPhoto } from "react-icons/hi2";
import MessageInput from "./MessageInput";
import { CldUploadButton } from "next-cloudinary";
import { useLanguage } from "@/app/context/LanguageContext";

const Form = () => {
    const { conversationId } = useConversation();
    const { language } = useLanguage();

    const translations = {
        en: {
            placeholder: "Write a message",
        },
        hu: {
            placeholder: "Írj egy üzenetet",
        },
    };

    const { placeholder } = translations[language];

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<FieldValues>({
        defaultValues: {
            message: "",
        },
    });

    const onSubmit: SubmitHandler<FieldValues> = (data) => {
        setValue("message", "", { shouldValidate: true });

        axios.post("/api/messages", {
            ...data,
            conversationId,
        });
    };

    const handleUpload = (result: any) => {
        axios.post("/api/messages", {
            image: result?.info?.secure_url,
            conversationId,
        });
    };

    return (
        <div className="py-4 px-4 bg-white border-t flex items-center gap-2 lg:gap-4 w-full z-50">
            <CldUploadButton
                options={{ maxFiles: 1 }}
                onUpload={handleUpload}
                uploadPreset="krkiyocl"
            >
                <HiPhoto
                    size={30}
                    className="text-nexus-tertiary  hover:text-nexus-secondary"
                />
            </CldUploadButton>

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex items-center gap-2 lg:gap-4 w-full"
            >
                <MessageInput
                    id="message"
                    register={register}
                    errors={errors}
                    required
                    placeholder={placeholder}
                />
                <button
                    type="submit"
                    className="rounded-full p-2 bg-nexus-tertiary cursor-pointer hover:bg-nexus-secondary transition"
                >
                    <HiPaperAirplane size={18} className="text-white" />
                </button>
            </form>
        </div>
    );
};

export default Form;
