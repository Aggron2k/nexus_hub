// app/api/todos/route.ts
import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { TodoPriority } from "@prisma/client";
import { pusherServer } from "@/app/libs/pusher";

export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const position = searchParams.get("position");
        const status = searchParams.get("status");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        // Manager+ láthat minden todo-t, employee csak a sajátjait
        const isManager = ['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role);

        const where: any = {};

        // Employee csak azokat a TODO-kat látja, ahol ő van hozzárendelve
        if (!isManager) {
            where.assignments = {
                some: {
                    userId: currentUser.id
                }
            };
        } else {
            // Manager esetén szűrők alkalmazása
            if (userId) {
                where.assignments = {
                    some: {
                        userId: userId
                    }
                };
            }
        }

        if (position) {
            where.targetPosition = {
                name: position
            };
        }

        if (status) {
            where.status = status;
        }

        if (startDate) {
            where.startDate = {
                gte: new Date(startDate)
            };
        }

        if (endDate) {
            where.dueDate = {
                lte: new Date(endDate)
            };
        }

        const todos = await prisma.todo.findMany({
            where,
            include: {
                assignments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                                userPositions: {
                                    select: {
                                        isPrimary: true,
                                        position: {
                                            select: {
                                                id: true,
                                                name: true,
                                                displayNames: true,
                                                descriptions: true,
                                                color: true
                                            }
                                        }
                                    },
                                    where: { isPrimary: true },
                                    take: 1
                                }
                            }
                        }
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                targetPosition: {
                    select: {
                        id: true,
                        name: true,
                        displayNames: true,
                        descriptions: true,
                        color: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        

        return NextResponse.json(todos);
    } catch (error) {
        console.error('GET /api/todos error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Csak Manager+ hozhat létre TODO-t
        const isManager = ['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role);
        if (!isManager) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const body = await request.json();
        const {
            title,
            description,
            priority,
            startDate,
            dueDate,
            targetPositionId,
            assignToAll, // Ha true, akkor minden pozíciónak
            specificUserIds, // Ha van, akkor csak ezeknek
            notes
        } = body;

        if (!title) {
            return new NextResponse("Title is required", { status: 400 });
        }

        // Felhasználók listájának meghatározása
        let userIds: string[] = [];

        if (assignToAll && targetPositionId) {
            // Minden felhasználó aki az adott pozícióban van
            const usersWithPosition = await prisma.user.findMany({
                where: {
                    userPositions: {
                        some: {
                            positionId: targetPositionId
                        }
                    }
                },
                select: { id: true }
            });

            if (usersWithPosition.length === 0) {
                return new NextResponse("No users found with the specified position", { status: 400 });
            }

            userIds = usersWithPosition.map(user => user.id);
        } else if (specificUserIds && specificUserIds.length > 0) {
            // Specifikus felhasználók
            userIds = specificUserIds;
        } else {
            return new NextResponse("No users specified", { status: 400 });
        }

        // 1 TODO létrehozása + több assignment
        const todo = await prisma.todo.create({
            data: {
                title,
                description,
                priority: priority as TodoPriority || 'MEDIUM',
                startDate: startDate ? new Date(startDate) : null,
                dueDate: dueDate ? new Date(dueDate) : null,
                targetPositionId: targetPositionId || null,
                createdById: currentUser.id,
                notes,
                // Assignments létrehozása
                assignments: {
                    create: userIds.map(userId => ({
                        userId: userId,
                        status: 'PENDING'
                    }))
                }
            },
            include: {
                assignments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                                userPositions: {
                                    select: {
                                        isPrimary: true,
                                        position: {
                                            select: {
                                                id: true,
                                                name: true,
                                                displayNames: true,
                                                descriptions: true,
                                                color: true
                                            }
                                        }
                                    },
                                    where: { isPrimary: true },
                                    take: 1
                                }
                            }
                        }
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                targetPosition: {
                    select: {
                        id: true,
                        name: true,
                        displayNames: true,
                        descriptions: true,
                        color: true
                    }
                }
            }
        });

        // Pusher értesítés minden hozzárendelt felhasználónak + minden managernek
        const emailsToNotify = new Set<string>();

        // Hozzárendelt felhasználók
        todo.assignments.forEach((assignment) => {
            if (assignment.user.email) {
                emailsToNotify.add(assignment.user.email);
            }
        });

        // Minden Manager, GeneralManager és CEO is kapjon értesítést
        const managers = await prisma.user.findMany({
            where: {
                role: {
                    in: ['Manager', 'GeneralManager', 'CEO']
                }
            },
            select: {
                email: true
            }
        });

        managers.forEach((manager) => {
            if (manager.email) {
                emailsToNotify.add(manager.email);
            }
        });

        // Küldj Pusher event mindenkinek
        const pusherPromises = Array.from(emailsToNotify).map((email) => {
            return pusherServer.trigger(`private-${email}`, 'todo:new', todo);
        });

        await Promise.all(pusherPromises);

        return NextResponse.json(todo);
    } catch (error) {
        console.error('POST /api/todos error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}