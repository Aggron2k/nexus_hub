import prisma from "@/app/libs/prismadb";
import getCurrentUser from "./getCurrentUser";
const getConversationById = async (
    conversationId: string
) => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.email) {
            return "Unauthorized";
        }
        const conversation = await prisma.conversation.findUnique({
            where: {
                id: conversationId
            },
            include: {
                users: true
            }
        });
        return conversation;
    } catch (error: unknown) {
        return error;
    }
};
export default getConversationById;