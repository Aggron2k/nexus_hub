import prisma from "@/app/libs/prismadb";
import { User } from "@prisma/client";

const getAllUsers = async (): Promise<User[]> => {
    try {
        const users = await prisma.user.findMany({
            orderBy: {
                createdAt: "desc",
            },
        });
        return users;
    } catch (error) {
        console.error("Error fetching all users:", error);
        return [];
    }
};

export default getAllUsers;
