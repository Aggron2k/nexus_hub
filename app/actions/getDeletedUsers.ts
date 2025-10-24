import prisma from "@/app/libs/prismadb";
import { User } from "@prisma/client";
import getCurrentUser from "./getCurrentUser";

const getDeletedUsers = async (): Promise<User[]> => {
    try {
        const currentUser = await getCurrentUser();

        // Csak CEO láthatja a törölt felhasználókat
        if (!currentUser || currentUser.role !== 'CEO') {
            return [];
        }

        // Lekérjük az összes törölt felhasználót
        const deletedUsers = await prisma.user.findMany({
            orderBy: {
                deletedAt: "desc",
            }
        });

        // Csak azokat adjuk vissza, akiknél létezik deletedAt
        return deletedUsers.filter(user => user.deletedAt);
    } catch (error) {
        console.error("Error fetching deleted users:", error);
        return [];
    }
};

export default getDeletedUsers;
