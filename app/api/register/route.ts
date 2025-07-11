// app/api/positions/route.ts
import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import bcrypt from "bcrypt";

import prisma from "@/app/libs/prismadb";

export async function GET() {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const positions = await prisma.position.findMany({
            include: {
                _count: {
                    select: {
                        users: true,
                        todos: true
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: [
                { order: 'asc' },
                { name: 'asc' }
            ]
        });

        return NextResponse.json(positions);
    } catch (error) {
        console.error('GET /api/positions error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, name, password } = body;

        // Adatok validálása
        if (!email || !name || !password) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Email validálás
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return new NextResponse("Invalid email format", { status: 400 });
        }

        // Jelszó validálás
        if (password.length < 6) {
            return new NextResponse("Password must be at least 6 characters", { status: 400 });
        }

        // Ellenőrizzük, hogy már létezik-e a felhasználó
        const existingUser = await prisma.user.findUnique({
            where: {
                email: email.toLowerCase()
            }
        });

        if (existingUser) {
            return new NextResponse("User already exists", { status: 409 });
        }

        // Jelszó hash-elése
        const hashedPassword = await bcrypt.hash(password, 12);

        // Új felhasználó létrehozása alapértelmezett Employee szerepkörrel
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                name: name.trim(),
                hashedPassword,
                role: 'Employee' // Alapértelmezett szerepkör
            }
        });

        // Érzékeny adatok eltávolítása a válaszból
        const { hashedPassword: _, ...safeUser } = user;

        return NextResponse.json(safeUser, { status: 201 });

    } catch (error) {
        console.error('POST /api/register error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}