// app/actions/getUserById.ts
import prisma from "@/app/libs/prismadb";

const getUserById = async (id: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                accounts: true,
                userPositions: {
                    include: {
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
                        }
                    },
                    orderBy: [
                        { isPrimary: 'desc' },
                        { assignedAt: 'desc' }
                    ]
                }
            },
        });

        if (!user) {
            return null;
        }

        // Érzékeny adatok eltávolítása és pozíciók feldolgozása
        const { hashedPassword, userPositions, ...safeUser } = user;
        
        const processedUser = {
            ...safeUser,
            // Pozíciók feldolgozása - egyszerűsített formátumban
            positions: userPositions.map(up => ({
                id: up.position.id,
                name: up.position.name,
                displayNames: up.position.displayNames,
                descriptions: up.position.descriptions,
                color: up.position.color,
                isActive: up.position.isActive,
                order: up.position.order,
                isPrimary: up.isPrimary,
                assignedAt: up.assignedAt
            })),
            // Visszameneti kompatibilitás - elsődleges vagy első pozíció
            position: userPositions.length > 0 
                ? (userPositions.find(up => up.isPrimary) || userPositions[0]).position
                : null,
            hasPassword: !!hashedPassword
        };

        return processedUser;
    } catch (error: any) {
        console.error("Error fetching user by ID:", error);
        return null;
    }
};

export default getUserById;