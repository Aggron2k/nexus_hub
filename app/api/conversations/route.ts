import getCurrentUser from "@/app/actions/getCurrentUser";
import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import { pusherServer } from "@/app/libs/pusher";

export async function POST(
    request: Request
) {
    try {
        const currentUser = await getCurrentUser();
        const body = await request.json();
        const {
            userId,
            isGroup,
            members,
            name
        } = body;

        console.log('API received data:', { userId, isGroup, members, name }); // Debug log

        if (!currentUser?.id || !currentUser?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Validáció egyéni beszélgetéshez
        if (!isGroup && !userId) {
            return new NextResponse('User ID is required for individual conversation', { status: 400 });
        }

        // Group chat validáció - JAVÍTOTT SOR
        if (isGroup && (!members || members.length < 2 || !name)) {
            return new NextResponse('Invalid Group', { status: 400 });
        }

        // Group chat létrehozása
        if (isGroup) {
            const newConversation = await prisma.conversation.create({
                data: {
                    name,
                    isGroup,
                    users: {
                        connect: [
                            ...members.map((member: { value: string }) => ({
                                id: member.value
                            })),
                            {
                                id: currentUser.id
                            }
                        ]
                    }
                },
                include: {
                    users: true
                }
            });

            // Pusher notification minden felhasználónak
            newConversation.users.forEach((user) => {
                if (user.email) {
                    pusherServer.trigger(user.email, 'conversation:new', newConversation);
                }
            });

            return NextResponse.json(newConversation);
        }

        // Egyéni chat - ellenőrizzük hogy létezik-e már
        const existingConversations = await prisma.conversation.findMany({
            where: {
                OR: [
                    {
                        userIds: {
                            equals: [currentUser.id, userId]
                        }
                    },
                    {
                        userIds: {
                            equals: [userId, currentUser.id]
                        }
                    }
                ]
            }
        });

        const singleConversation = existingConversations[0];

        // Ha már létezik, visszaadjuk
        if (singleConversation) {
            return NextResponse.json(singleConversation);
        }

        // Új egyéni beszélgetés létrehozása
        const newConversation = await prisma.conversation.create({
            data: {
                users: {
                    connect: [
                        {
                            id: currentUser.id
                        },
                        {
                            id: userId
                        }
                    ]
                }
            },
            include: {
                users: true
            }
        });

        // Pusher notification mindkét felhasználónak
        newConversation.users.map((user) => {
            if (user.email) {
                pusherServer.trigger(user.email, 'conversation:new', newConversation);
            }
        });

        return NextResponse.json(newConversation);

    } catch (error: unknown) {
        console.error('Error in conversations API:', error);
        return new NextResponse('Internal Error: ' + String(error), { status: 500 });
    }
}