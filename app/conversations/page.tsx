"use client";

import clsx from "clsx";
import useConversation from "../hooks/useConversation";
import ConversationsEmptyState from "./components/ConversationsEmptyState";

const ConversationsPage = () => {
    const { isOpen } = useConversation();

    return (
        <div className={clsx("lg:pl-80 h-full lg:block", isOpen ? 'block' : 'hidden')}>
            <ConversationsEmptyState />
        </div>
    );
};

export default ConversationsPage;