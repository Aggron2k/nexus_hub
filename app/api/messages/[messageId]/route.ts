// app/api/messages/[messageId]/route.ts
import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import databaseClient from "@/app/libs/prismadb";


export const dynamic = 'force-dynamic';
const prisma = databaseClient;

interface IParams {
    messageId?: string;
}

// GET - Get single message
export async function GET(
    request: Request,
    { params }: { params: IParams }
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { messageId } = params;
        if (!messageId) {
            return new NextResponse("Message ID required", { status: 400 });
        }

        const message = await prisma.messageBoard.findUnique({
            where: { id: messageId },
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
            }
        });

        if (!message) {
            return new NextResponse("Message not found", { status: 404 });
        }

        return NextResponse.json(message);
    } catch (error) {
        console.error('GET /api/messages/[messageId] error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// PATCH - Update message
export async function PATCH(
    request: Request,
    { params }: { params: IParams }
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { messageId } = params;
        if (!messageId) {
            return new NextResponse("Message ID required", { status: 400 });
        }

        const body = await request.json();
        const { title, content, imageUrl } = body;

        // Check message exists and ownership
        const existingMessage = await prisma.messageBoard.findUnique({
            where: { id: messageId }
        });

        if (!existingMessage) {
            return new NextResponse("Message not found", { status: 404 });
        }

        // Only author can edit
        if (existingMessage.authorId !== currentUser.id) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const message = await prisma.messageBoard.update({
            where: { id: messageId },
            data: {
                title,
                content,
                imageUrl
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

        // TODO: Pusher event - message:update
        // pusher.trigger('message-board', 'message:update', message);

        return NextResponse.json(message);
    } catch (error) {
        console.error('PATCH /api/messages/[messageId] error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// DELETE - Delete message
export async function DELETE(
    request: Request,
    { params }: { params: IParams }
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { messageId } = params;
        if (!messageId) {
            return new NextResponse("Message ID required", { status: 400 });
        }

        // Check message exists
        const existingMessage = await prisma.messageBoard.findUnique({
            where: { id: messageId }
        });

        if (!existingMessage) {
            return new NextResponse("Message not found", { status: 404 });
        }

        // Can delete if:
        // 1. Author of message
        // 2. Manager+ (moderation)
        const isManager = ['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role);
        const isAuthor = existingMessage.authorId === currentUser.id;

        if (!isAuthor && !isManager) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        await prisma.messageBoard.delete({
            where: { id: messageId }
        });

        // TODO: Pusher event - message:delete
        // pusher.trigger('message-board', 'message:delete', { messageId });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE /api/messages/[messageId] error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
