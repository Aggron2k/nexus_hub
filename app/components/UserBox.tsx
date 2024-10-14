"use client";

import { User } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import Avatar from "./Avatar";
import axios from "axios";
import { userAgent } from "next/server";

interface UserBoxProps {
    data: User;
}

const UserBox: React.FC<UserBoxProps> = ({
    data
}) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = useCallback(() => {
        setIsLoading(true);

        axios.post('/api/conversations', {
            userId: data.id
        })
        .then((data) => {
            router.push(`/conversations/${data.data.id}`);
        })
        .finally(() => {
            setIsLoading(false);
        });
    }, [data, router]);
    return (
        <div onClick={handleClick} className="w-full relative flex items-center space-x-3 bg-white p-3 hover:bg-neutral-100 rounded-lg transition, curosr-pointer">
            <Avatar user={data}/>
            <div className="focus-outline-none">
                <span className="felx justify-between items-center mb-1">
                    <p className="text-sm font-medium text-gray-900">{data.name}</p>
                </span>
            </div>
        </div>
    );
}

export default UserBox;