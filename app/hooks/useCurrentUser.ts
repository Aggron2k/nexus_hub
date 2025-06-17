// app/hooks/useCurrentUser.ts
import { useSession } from "next-auth/react";
import { User } from "@prisma/client";

export const useCurrentUser = (): User | null => {
    const { data: session } = useSession();
    return session?.user as User | null;
};