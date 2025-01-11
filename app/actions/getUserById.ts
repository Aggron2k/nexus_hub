import prisma from "@/app/libs/prismadb";

const getUserById = async (id: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                accounts: true, // Ha kapcsolódó táblákat is szeretnél visszaadni
            },
        });

        return user;
    } catch (error: any) {
        console.error("Error fetching user by ID:", error);
        return null;
    }
};

export default getUserById;
