import prisma from "@/app/libs/prismadb";
import { User } from "@prisma/client";

const getAllUsers = async (): Promise<User[]> => {
    try {
        // Lekérjük az összes felhasználót
        const allUsers = await prisma.user.findMany({
            orderBy: {
                createdAt: "desc",
            }
        });

        // Kiszűrjük a törölt felhasználókat (ahol deletedAt létezik ÉS nem null)
        const activeUsers = allUsers.filter(user => !user.deletedAt);

        return activeUsers;
    } catch (error) {
        console.error("Error fetching all users:", error);
        return [];
    }
};

export default getAllUsers;
