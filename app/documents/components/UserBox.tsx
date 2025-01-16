"use client";

import { User } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import Avatar from "@/app/components/Avatar";

interface UserBoxProps {
    data: User;
}

const UserBox: React.FC<UserBoxProps> = ({ data }) => {
    const router = useRouter();

    const handleClick = useCallback(() => {
        // Csak navigáció történik a megfelelő felhasználói dokumentum oldalra
        router.push(`/documents/${data.id}`);
    }, [data, router]);

    return (
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
    );
};

export default UserBox;
