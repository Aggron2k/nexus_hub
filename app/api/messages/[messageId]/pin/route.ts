// app/api/messages/[messageId]/pin/route.ts
import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import databaseClient from "@/app/libs/prismadb";
import { realtimeServer } from "@/app/libs/pusher";


export const dynamic = 'force-dynamic';
const prisma = databaseClient;

interface IParams {
    messageId?: string;
}

// POST - Toggle pin status (only CEO/GM)
export async function POST(
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

        // Only CEO/GM can pin
        const canPin = ['GeneralManager', 'CEO'].includes(currentUser.role);
        if (!canPin) {
            return new NextResponse("Forbidden - Only CEO/GM can pin messages", { status: 403 });
        }

        // Check message exists
        const existingMessage = await prisma.messageBoard.findUnique({
            where: { id: messageId }
        });

        if (!existingMessage) {
            return new NextResponse("Message not found", { status: 404 });
        }

        // Toggle pin
        const message = await prisma.messageBoard.update({
            where: { id: messageId },
            data: {
                isPinned: !existingMessage.isPinned,
                pinnedById: !existingMessage.isPinned ? currentUser.id : null,
                pinnedAt: !existingMessage.isPinned ? new Date() : null
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

        // Pusher event - message:update
        await realtimeServer.trigger('message-board', 'message:update', message);

        return NextResponse.json(message);
    } catch (error) {
        console.error('POST /api/messages/[messageId]/pin error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
