// app/api/documents/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
import { pusherServer } from '@/app/libs/pusher';
import getCurrentUser from '@/app/actions/getCurrentUser';

export async function POST(req: Request) {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, name, fileType, fileUrl } = body;

    // Ellenőrizzük, hogy minden szükséges adat meg van-e adva
    if (!userId || !name || !fileType || !fileUrl) {
        return NextResponse.json(
            { error: 'All fields (userId, name, fileType, fileUrl) are required' },
            { status: 400 }
        );
    }

    // Employee csak saját magának tölthet fel dokumentumot
    const isManager = ['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role);
    if (!isManager && userId !== currentUser.id) {
        return NextResponse.json(
            { error: 'Forbidden: You can only upload documents for yourself' },
            { status: 403 }
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
            include: {
                user: true // Include user data for the pusher event
            }
        });

        // Pusher értesítés küldése
        await pusherServer.trigger(
            `user-${userId}-documents`,
            'document:new',
            newDocument
        );

        return NextResponse.json(newDocument, { status: 201 });
    } catch (error) {
        console.error("Error creating document:", error);
        return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    // Employee csak a saját dokumentumait láthatja
    const isManager = ['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role);
    if (!isManager && userId !== currentUser.id) {
        return NextResponse.json(
            { error: 'Forbidden: You can only view your own documents' },
            { status: 403 }
        );
    }

    try {
        const documents = await prisma.document.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: {
                user: true // Include user data in the response
            }
        });

        return NextResponse.json(documents);
    } catch (error) {
        console.error("Error fetching documents:", error);
        return NextResponse.json({ error: "Failed to fetch documents." }, { status: 500 });
    }
}