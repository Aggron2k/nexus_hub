// app/api/todos/[todoId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { TodoStatus } from "@prisma/client";
import { pusherServer } from "@/app/libs/pusher";

interface IParams {
    todoId: string;
}

export async function GET(
    request: NextRequest,
    { params }: { params: IParams }
) {
    try {
        const { todoId } = params;
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const todo = await prisma.todo.findUnique({
            where: { id: todoId },
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

        if (!todo) {
            return new NextResponse("Todo not found", { status: 404 });
        }

        // Hozzáférés ellenőrzése
        const isManager = ['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role);
        const isAssigned = todo.assignments.some(assignment => assignment.userId === currentUser.id);

        if (!isManager && !isAssigned) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        return NextResponse.json(todo);
    } catch (error) {
        console.error('GET /api/todos/[todoId] error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: IParams }
) {
    try {
        const { todoId } = params;
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await request.json();
        const { status, notes, completedAt } = body;

        const todo = await prisma.todo.findUnique({
            where: { id: todoId },
            include: {
                assignments: true
            }
        });

        if (!todo) {
            return new NextResponse("Todo not found", { status: 404 });
        }

        // Hozzáférés ellenőrzése
        const isManager = ['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role);
        const userAssignment = todo.assignments.find(a => a.userId === currentUser.id);

        if (!isManager && !userAssignment) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const updateData: any = {};

        if (status) {
            updateData.status = status as TodoStatus;
            if (status === 'COMPLETED' && !completedAt) {
                updateData.completedAt = new Date();
            }
        }

        if (notes !== undefined) {
            updateData.notes = notes;
        }

        if (completedAt) {
            updateData.completedAt = new Date(completedAt);
        }

        updateData.updatedAt = new Date();

        const updatedTodo = await prisma.todo.update({
            where: { id: todoId },
            data: updateData,
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
        updatedTodo.assignments.forEach((assignment) => {
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
            return pusherServer.trigger(`private-${email}`, 'todo:update', updatedTodo);
        });

        await Promise.all(pusherPromises);

        return NextResponse.json(updatedTodo);
    } catch (error) {
        console.error('PATCH /api/todos/[todoId] error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: IParams }
) {
    try {
        const { todoId } = params;
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Csak Manager+ törölhet TODO-t
        const isManager = ['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role);
        if (!isManager) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const todo = await prisma.todo.findUnique({
            where: { id: todoId },
            include: {
                assignments: {
                    include: {
                        user: {
                            select: {
                                email: true
                            }
                        }
                    }
                }
            }
        });

        if (!todo) {
            return new NextResponse("Todo not found", { status: 404 });
        }

        // Pusher értesítés minden hozzárendelt felhasználónak + minden managernek
        console.log('Sending Pusher delete event for todo:', todoId);

        // Gyűjtsük össze az összes email címet
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
            console.log('Sending to:', `private-${email}`);
            return pusherServer.trigger(`private-${email}`, 'todo:delete', { todoId });
        });

        // Várjuk meg hogy minden Pusher event elküldésre kerüljön
        await Promise.all(pusherPromises);
        console.log('All Pusher events sent to', emailsToNotify.size, 'users');

        await prisma.todo.delete({
            where: { id: todoId }
        });

        return NextResponse.json({ message: "Todo deleted successfully" });
    } catch (error) {
        console.error('DELETE /api/todos/[todoId] error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}