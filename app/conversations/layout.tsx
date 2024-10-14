import getConversations from "../actions/getConversations";
import Sidebar from "../components/sidebar/Sidebar";
import ConversationList from "./components/ConversationList";
import getUsers from "../actions/getUsers";

export default async function ConversationsLayout({
    children
}: {
    children: React.ReactNode;
}) {
    const conversations = await getConversations();
    const users = await getUsers();
    
    return(
        <Sidebar>
            <div className="h-full">
                <ConversationList initalItems={[conversations]}/>
                {children}
            </div>
        </Sidebar>   
    )
};