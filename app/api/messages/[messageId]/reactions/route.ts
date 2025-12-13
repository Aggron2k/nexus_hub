// app/api/messages/[messageId]/reactions/route.ts
import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import databaseClient from "@/app/libs/prismadb";
import { realtimeServer } from "@/app/libs/pusher";


export const dynamic = 'force-dynamic';
const prisma = databaseClient;

interface IParams {
    messageId?: string;
}

// POST - Add reaction
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

        const body = await request.json();
        const { emoji } = body;

        if (!emoji) {
            return new NextResponse("Emoji required", { status: 400 });
        }

        // Validate emoji (only allowed ones)
        const allowedEmojis = ["👍", "❤️", "😄", "🎉"];
        if (!allowedEmojis.includes(emoji)) {
            return new NextResponse("Invalid emoji", { status: 400 });
        }

        // Check message exists
        const message = await prisma.messageBoard.findUnique({
            where: { id: messageId }
        });

        if (!message) {
            return new NextResponse("Message not found", { status: 404 });
        }

        // Check if reaction already exists (unique constraint will handle this too)
        const existingReaction = await prisma.messageReaction.findUnique({
            where: {
                messageId_userId_emoji: {
                    messageId,
                    userId: currentUser.id,
                    emoji
                }
            }
        });

        if (existingReaction) {
            // If exists, remove it (toggle behavior)
            await prisma.messageReaction.delete({
                where: {
                    id: existingReaction.id
                }
            });

            // Get updated message with all relations
            const updatedMessage = await prisma.messageBoard.findUnique({
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

            // Pusher event - message:update
            await realtimeServer.trigger('message-board', 'message:update', updatedMessage);

            return NextResponse.json({ action: 'removed', emoji });
        }

        // Create new reaction
        const reaction = await prisma.messageReaction.create({
            data: {
                messageId,
                userId: currentUser.id,
                emoji
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                }
            }
        });

        // Get updated message with all relations
        const updatedMessage = await prisma.messageBoard.findUnique({
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

        // Pusher event - message:update
        await realtimeServer.trigger('message-board', 'message:update', updatedMessage);

        return NextResponse.json({ action: 'added', reaction });
    } catch (error) {
        console.error('POST /api/messages/[messageId]/reactions error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// DELETE - Remove reaction
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

        const { searchParams } = new URL(request.url);
        const emoji = searchParams.get("emoji");

        if (!emoji) {
            return new NextResponse("Emoji required", { status: 400 });
        }

        // Find and delete reaction
        const reaction = await prisma.messageReaction.findUnique({
            where: {
                messageId_userId_emoji: {
                    messageId,
                    userId: currentUser.id,
                    emoji
                }
            }
        });

        if (!reaction) {
            return new NextResponse("Reaction not found", { status: 404 });
        }

        await prisma.messageReaction.delete({
            where: {
                id: reaction.id
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE /api/messages/[messageId]/reactions error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
