// app/api/todos/route.ts
import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { TodoPriority } from "@prisma/client";

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

        if (!isManager) {
            // Csak a saját todo-kat láthatja
            where.assignedUserId = currentUser.id;
        } else {
            // Manager esetén szűrők alkalmazása
            if (userId) {
                where.assignedUserId = userId;
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
                assignedUser: {
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
                        displayNames: true,        // ← VÁLTOZÁS: displayName → displayNames
                        descriptions: true,        // ← HOZZÁADÁS
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

        // Ha assignToAll = true, akkor minden pozíciónak létrehozzuk
        if (assignToAll && targetPositionId) {
            const usersWithPosition = await prisma.user.findMany({
                where: {
                    userPositions: {
                        some: {
                            positionId: targetPositionId
                        }
                    }
                }
            });

            if (usersWithPosition.length === 0) {
                return new NextResponse("No users found with the specified position", { status: 400 });
            }

            const todos = await Promise.all(
                usersWithPosition.map(user =>
                    prisma.todo.create({
                        data: {
                            title,
                            description,
                            priority: priority as TodoPriority || 'MEDIUM',
                            startDate: startDate ? new Date(startDate) : null,
                            dueDate: dueDate ? new Date(dueDate) : null,
                            targetPositionId: targetPositionId,
                            assignedUserId: user.id,
                            createdById: currentUser.id,
                            notes
                        },
                        include: {
                            assignedUser: {
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
                    })
                )
            );

            return NextResponse.json(todos);
        }

        // Ha specifikus felhasználóknak
        if (specificUserIds && specificUserIds.length > 0) {
            const todos = await Promise.all(
                specificUserIds.map((userId: string) =>
                    prisma.todo.create({
                        data: {
                            title,
                            description,
                            priority: priority as TodoPriority || 'MEDIUM',
                            startDate: startDate ? new Date(startDate) : null,
                            dueDate: dueDate ? new Date(dueDate) : null,
                            targetPositionId: targetPositionId || null,
                            assignedUserId: userId,
                            createdById: currentUser.id,
                            notes
                        },
                        include: {
                            assignedUser: {
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
                    })
                )
            );

            return NextResponse.json(todos);
        }

        return new NextResponse("No users specified", { status: 400 });
    } catch (error) {
        console.error('POST /api/todos error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}