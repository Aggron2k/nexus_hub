import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';

export async function POST(req: Request) {
    const body = await req.json();
    const { userId, name, fileType, fileUrl } = body;

    // Ellenőrizzük, hogy minden szükséges adat meg van-e adva
    if (!userId || !name || !fileType || !fileUrl) {
        return NextResponse.json(
            { error: 'All fields (userId, name, fileType, fileUrl) are required' },
            { status: 400 }
        );
    }

    try {
        // Új dokumentum hozzáadása az adatbázishoz
        const newDocument = await prisma.document.create({
            data: {
                userId,
                name,
                fileType,
                fileUrl,
            },
        });

        return NextResponse.json(newDocument, { status: 201 });
    } catch (error) {
        console.error("Error creating document:", error);
        return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
    }
}


export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    try {
        const documents = await prisma.document.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(documents);
    } catch (error) {
        console.error("Error fetching documents:", error);
        return NextResponse.json({ error: "Failed to fetch documents." }, { status: 500 });
    }
}


