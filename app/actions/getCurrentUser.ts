import { getServerSession } from "next-auth";
import { authOptions } from "@/app/libs/auth";
import prisma from "@/app/libs/prismadb";

const getCurrentUser = async () => {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return null;
    }

    const currentUser = await prisma.user.findUnique({
      where: {
        email: session.user.email as string
      }
    });

    // Törölt felhasználó NEM jelentkezhet be
    if (!currentUser || currentUser.deletedAt) {
      return null;
    }

    return currentUser;
  } catch (error: any) {
    console.error("Error in getCurrentUser:", error);
    return null;
  }
};

export default getCurrentUser;