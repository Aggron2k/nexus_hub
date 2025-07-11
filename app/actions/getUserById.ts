// app/actions/getUserById.ts
import prisma from "@/app/libs/prismadb";

const getUserById = async (id: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                accounts: true,
                position: {
                    select: {
                        id: true,
                        name: true,
                        displayNames: true,
                        descriptions: true,
                        color: true,
                        isActive: true,
                        order: true
                    }
                },
                // TODO kapcsolatok is lekérhetőek
                assignedTodos: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        priority: true,
                        dueDate: true
                    },
                    take: 5, // Csak az első 5 TODO
                    orderBy: {
                        dueDate: 'asc'
                    }
                },
                createdTodos: {
                    select: {
                        id: true,
                        title: true,
                        status: true
                    },
                    take: 5
                }
            },
        });

        if (!user) {
            return null;
        }

        // Érzékeny adatok eltávolítása
        const { hashedPassword, ...safeUser } = user;

        return safeUser;
    } catch (error: any) {
        console.error("Error fetching user by ID:", error);
        return null;
    }
};

export default getUserById;