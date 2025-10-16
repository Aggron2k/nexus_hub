import { AuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/app/libs/prismadb";
import bcrypt from "bcrypt";

export const authOptions: AuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_ID as string,
            clientSecret: process.env.GITHUB_SECRET as string,
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'email', type: 'text' },
                password: { label: 'password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null; // Null helyett Error - így nem jelenik meg az URL-ben
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user || !user.hashedPassword) {
                    return null; // Null visszatérés
                }

                const isCorrectPassword = await bcrypt.compare(
                    credentials.password,
                    user.hashedPassword
                );

                if (!isCorrectPassword) {
                    return null; // Null visszatérés
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                };
            },
        }),
    ],
    debug: process.env.NODE_ENV === 'development',
    session: {
        strategy: "jwt" as const,
        maxAge: 24 * 60 * 60, // 24 óra
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/",
        signOut: "/",
        error: "/",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).id = token.id as string;
            }
            return session;
        },
        // KRITIKUS: URL tisztítás callback
        async redirect({ url, baseUrl }) {
            // Ha URL tartalmaz query paramétert, tisztítsd meg
            if (url.includes('?')) {
                return `${baseUrl}/dashboard`;
            }

            // Csak saját domain-re engedélyezett redirect
            if (url.startsWith("/")) {
                return `${baseUrl}${url}`;
            } else if (new URL(url).origin === baseUrl) {
                return url;
            }

            return `${baseUrl}/dashboard`;
        },

        // Signin callback - további védelem
        async signIn({ user, account, profile, email, credentials }) {
            return true; // Engedélyezi a bejelentkezést
        },
    },
    events: {
        // Event listener a sikeres bejelentkezésre
        async signIn({ user, account, profile, isNewUser }) {
            console.log("Successful login:", user.email);
        },
    },
};