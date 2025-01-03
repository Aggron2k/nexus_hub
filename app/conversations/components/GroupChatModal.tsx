"use client";
import Button from "@/app/components/Button";
import Modal from "@/app/components/Modal";
import Input from "@/app/components/inputs/Input";
import Select from "@/app/components/inputs/Select";
import { User } from "@prisma/client";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/app/context/LanguageContext";

interface GroupChatModalProps {
    isOpen?: boolean;
    onClose: () => void;
    users: User[];
}

const GroupChatModal: React.FC<GroupChatModalProps> = ({
    isOpen,
    onClose,
    users,
}) => {
    const router = useRouter();
    const { language } = useLanguage();

    const translations = {
        en: {
            createGroupChat: "Create a Group Chat",
            description: "Start a chat with more than 2 people.",
            name: "Name",
            members: "Members",
            cancel: "Cancel",
            create: "Create",
            error: "Something went wrong.",
        },
        hu: {
            createGroupChat: "Csoportos beszélgetés létrehozása",
            description: "Hozzon létre egy csevegést több mint 2 személlyel.",
            name: "Neve",
            members: "Tagok",
            cancel: "Mégse",
            create: "Létrehozás",
            error: "Valami hiba történt.",
        },
    };

    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FieldValues>({
        defaultValues: {
            name: "",
            members: [],
        },
    });

    const members = watch("members");

    const onSubmit: SubmitHandler<FieldValues> = (data) => {
        setIsLoading(true);
        axios
            .post("/api/conversations", {
                ...data,
                isGroup: true,
            })
            .then(() => {
                router.refresh();
                onClose();
            })
            .catch(() => toast.error(translations[language].error))
            .finally(() => setIsLoading(false));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-12">
                    <div className="border-b border-gray-900/10 pb-12">
                        <h2 className="text-base font-semibold leading-7 text-gray-900">
                            {translations[language].createGroupChat}
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-gray-600">
                            {translations[language].description}
                        </p>
                        <div className="mt-10 flex flex-col gap-y-8">
                            <Input
                                register={register}
                                label={translations[language].name}
                                id="name"
                                disabled={isLoading}
                                required
                                errors={errors}
                            />
                            <Select
                                disabled={isLoading}
                                label={translations[language].members}
                                options={users.map((user) => ({
                                    value: user.id,
                                    label: user.name,
                                }))}
                                onChange={(value) =>
                                    setValue("members", value, {
                                        shouldValidate: true,
                                    })
                                }
                                value={members}
                            />
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex items-center justify-end gap-x-6">
                    <Button disabled={isLoading} onClick={onClose} type="button" secondary>
                        {translations[language].cancel}
                    </Button>
                    <Button disabled={isLoading} type="submit">
                        {translations[language].create}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default GroupChatModal;
