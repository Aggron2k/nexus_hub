// app/api/messages/route.ts
import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { MessageType } from "@prisma/client";

// GET - List all messages with filters
export async function GET(request: Request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") as MessageType | null;
        const isPinned = searchParams.get("isPinned");
        const onlyMine = searchParams.get("onlyMine");

        // Build filter
        const where: any = {};

        if (type) {
            where.type = type;
        }

        if (isPinned === "true") {
            where.isPinned = true;
        }

        if (onlyMine === "true") {
            where.authorId = currentUser.id;
        }

        const messages = await prisma.messageBoard.findMany({
            where,
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        role: true
                    }
                },
                pinnedBy: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                reactions: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                image: true
                            }
                        }
                    }
                },
                comments: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                image: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                },
                _count: {
                    select: {
                        reactions: true,
                        comments: true
                    }
                }
            },
            orderBy: [
                { isPinned: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        return NextResponse.json(messages);
    } catch (error) {
        console.error('GET /api/messages error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST - Create new message
export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await request.json();
        const { title, content, imageUrl, type } = body;

        // Validate
        if (!content || !type) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        if (!Object.values(MessageType).includes(type)) {
            return new NextResponse("Invalid message type", { status: 400 });
        }

        const message = await prisma.messageBoard.create({
            data: {
                title,
                content,
                imageUrl,
                type,
                authorId: currentUser.id
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        role: true
                    }
                },
                reactions: true,
                comments: true,
                _count: {
                    select: {
                        reactions: true,
                        comments: true
                    }
                }
            }
        });

        // TODO: Pusher event - message:new
        // pusher.trigger('message-board', 'message:new', message);

        return NextResponse.json(message);
    } catch (error) {
        console.error('POST /api/messages error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
