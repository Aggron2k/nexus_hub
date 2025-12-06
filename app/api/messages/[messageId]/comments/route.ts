// app/api/messages/[messageId]/comments/route.ts
import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import databaseClient from "@/app/libs/prismadb";

const prisma = databaseClient;

interface IParams {
    messageId?: string;
}

// GET - Get all comments for a message
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

        const comments = await prisma.messageComment.findMany({
            where: { messageId },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        return NextResponse.json(comments);
    } catch (error) {
        console.error('GET /api/messages/[messageId]/comments error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST - Create new comment
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
        const { content } = body;

        if (!content || content.trim().length === 0) {
            return new NextResponse("Comment content required", { status: 400 });
        }

        // Check message exists
        const message = await prisma.messageBoard.findUnique({
            where: { id: messageId }
        });

        if (!message) {
            return new NextResponse("Message not found", { status: 404 });
        }

        const comment = await prisma.messageComment.create({
            data: {
                messageId,
                authorId: currentUser.id,
                content: content.trim()
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                }
            }
        });

        // TODO: Pusher event - comment:new
        // pusher.trigger('message-board', 'comment:new', { messageId, comment });

        return NextResponse.json(comment);
    } catch (error) {
        console.error('POST /api/messages/[messageId]/comments error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// DELETE - Delete comment
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
        const commentId = searchParams.get("commentId");

        if (!commentId) {
            return new NextResponse("Comment ID required", { status: 400 });
        }

        // Find comment
        const comment = await prisma.messageComment.findUnique({
            where: { id: commentId }
        });

        if (!comment) {
            return new NextResponse("Comment not found", { status: 404 });
        }

        // Can delete if:
        // 1. Author of comment
        // 2. Manager+ (moderation)
        const isManager = ['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role);
        const isAuthor = comment.authorId === currentUser.id;

        if (!isAuthor && !isManager) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        await prisma.messageComment.delete({
            where: { id: commentId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE /api/messages/[messageId]/comments error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
