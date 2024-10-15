"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MdOutlineGroupAdd } from "react-icons/md";

import useConversation from "@/app/hooks/useConversation";
import { FullConversationType } from "@/app/types";

import ConversationBox from "./ConversationBox";
import { User } from "@prisma/client";
import { useSession } from "next-auth/react";

interface ConversationListProps {
    initialItems: FullConversationType[];
}


const ConversationList: React.FC<ConversationListProps> = ({
    initialItems
}) => {
    const [items, setItems] = useState(initialItems);

    const router = useRouter();

    const {conversationId, isOpen} = useConversation();

    
    return (
        <aside className={clsx("fixed inset-y-0 pb-20 lg:pb-0 lg:left-20 lg:w-80 l:block overflow-y-auto border-r border-gray-200", isOpen ? 'hidden' : 'block w-full left-0')}>
            <div className="px-5">
                <div className="flex justify-between mb-4 pt-4">
                    <div className="text-2xl font-bold text-neutral-800">Üzenetek</div>
                    <div className="reounded-full p-2 bg-gray-100 text-gray-600 cursor-pointer hover:opacity-75 transition">
                        <MdOutlineGroupAdd size={20}/>
                    </div>
                </div>
                <div>
                {items && items.length > 0 ? (
                    items.map((item) => (
                    <ConversationBox
                        key={item.id}
                        data={item}
                        selected={conversationId === item.id}
                    />
                    ))
                ) : (
                    <div>Nincs beszélgetés elkezdve.</div>
                )}
                </div>
            </div>
        </aside>
    );
}

export default ConversationList;