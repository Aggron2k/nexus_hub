import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';

export async function POST(req: Request) {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Ellenőrizzük, hogy a felhasználó létezik-e
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Dokumentum azonosító helyett az userId-t küldjük vissza
    return NextResponse.json({ id: userId });
}
