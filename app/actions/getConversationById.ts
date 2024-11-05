import prisma from "@/app/libs/prismadb";
import getCurrentUser from "./getCurrentUser";

const getConversationById = async (conversationId: string) => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.email) {
            return null; // Visszaadjuk null-t ha nincs bejelentkezve felhasználó
        }

        // Lekérjük a beszélgetést a felhasználókkal együtt
        const conversation = await prisma.conversation.findUnique({
            where: {
                id: conversationId
            },
            include: {
                users: true // A felhasználókat is betöltjük
            }
        });

        return conversation; // Visszatérünk a teljes beszélgetéssel és a felhasználókkal
    } catch (error: unknown) {
        console.error(error);
        return null; // Hiba esetén null-t adunk vissza
    }
};
export default getConversationById;