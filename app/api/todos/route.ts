import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { Position, TodoPriority, TodoStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const position = searchParams.get('position') as Position;
        const status = searchParams.get('status') as TodoStatus;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Role alapú hozzáférés ellenőrzése
        const isManager = ['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role);

        let whereClause: any = {};

        if (!isManager) {
            // Employee csak a saját TODO-it láthatja
            whereClause.assignedUserId = currentUser.id;
        } else {
            // Manager+ szűrhet mindenki TODO-jára
            if (userId) {
                whereClause.assignedUserId = userId;
            }
        }

        // További szűrők
        if (position) {
            whereClause.targetPosition = position;
        }

        if (status) {
            whereClause.status = status;
        }

        // Dátum szűrők
        if (startDate || endDate) {
            whereClause.dueDate = {};
            if (startDate) {
                whereClause.dueDate.gte = new Date(startDate);
            }
            if (endDate) {
                whereClause.dueDate.lte = new Date(endDate);
            }
        }

        const todos = await prisma.todo.findMany({
            where: whereClause,
            include: {
                assignedUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        position: true,
                        role: true
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: [
                { priority: 'desc' },
                { dueDate: 'asc' },
                { createdAt: 'desc' }
            ]
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
            targetPosition,
            assignToAll, // Ha true, akkor minden pozíciónak
            specificUserIds, // Ha van, akkor csak ezeknek
            notes
        } = body;

        if (!title) {
            return new NextResponse("Title is required", { status: 400 });
        }

        // Ha assignToAll = true, akkor minden pozíciónak létrehozzuk
        if (assignToAll && targetPosition) {
            const usersWithPosition = await prisma.user.findMany({
                where: {
                    position: targetPosition as Position
                }
            });

            const todos = await Promise.all(
                usersWithPosition.map(user =>
                    prisma.todo.create({
                        data: {
                            title,
                            description,
                            priority: priority as TodoPriority || 'MEDIUM',
                            startDate: startDate ? new Date(startDate) : null,
                            dueDate: dueDate ? new Date(dueDate) : null,
                            targetPosition: targetPosition as Position,
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
                                    position: true
                                }
                            },
                            createdBy: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true
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
                            targetPosition: targetPosition as Position || null,
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
                                    position: true
                                }
                            },
                            createdBy: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true
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

