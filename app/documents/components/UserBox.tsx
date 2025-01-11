"use client";

import axios from "axios";
import { User } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import Avatar from "@/app/components/Avatar";
import LoadingModal from "@/app/components/LoadingModal";
import { toast } from "react-hot-toast";

interface UserBoxProps {
    data: User;
}

const UserBox: React.FC<UserBoxProps> = ({ data }) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = useCallback(() => {
        setIsLoading(true);

        axios
            .post('/api/documents', {
                userId: data.id,
            })
            .then((response) => {
                router.push(`/documents/${response.data.id}`);
            })
            .catch(() => {
                toast.error("Failed to load documents");
            })
            .finally(() => setIsLoading(false));
    }, [data, router]);

    return (
        <>
            {isLoading && <LoadingModal />}
            <div
                onClick={handleClick}
                className="w-full relative flex items-center space-x-3 bg-white p-3 hover:bg-nexus-primary rounded-lg transition cursor-pointer"
            >
                <Avatar user={data} />
                <div className="min-w-0 flex-1">
                    <div className="focus:outline-none">
                        <div className="flex justify-between items-center mb-1">
                            <p className="text-sm font-medium text-gray-900">{data.name}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default UserBox;
