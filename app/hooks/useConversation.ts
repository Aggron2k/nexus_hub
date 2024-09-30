import {useParams} from "next/navigation";
import {useMemo} from "react";

const useConversation = () => {
    const params = useParams();

    const conversationID = useMemo(() => {
        if (!params?.conversationID){
            return '';
        }

        return params.conversationID as string;
    }, [params?.conversationID]);

    const isOpen = useMemo(() => !!conversationID, [conversationID]);

    return useMemo(() => ({
        isOpen,
        conversationID
    }), [isOpen, conversationID]);
};

export default useConversation;