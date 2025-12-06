// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { nextAuthConfiguration } from "@/app/libs/auth";

const handler = NextAuth(nextAuthConfiguration);

export { handler as GET, handler as POST };
