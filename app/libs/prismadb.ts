import { PrismaClient } from "@prisma/client/extension"

declare global{
    const prisma: PrismaClient | undefined; //var?
}

const client = globalThis.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalThis.prisma = client;

export default client;