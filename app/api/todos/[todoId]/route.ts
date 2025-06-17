// app/api/todos/[todoId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { TodoStatus } from "@prisma/client";

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
            }
        });

        if (!todo) {
            return new NextResponse("Todo not found", { status: 404 });
        }

        // Hozzáférés ellenőrzése
        const isManager = ['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role);
        const isOwner = todo.assignedUserId === currentUser.id;

        if (!isManager && !isOwner) {
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
            where: { id: todoId }
        });

        if (!todo) {
            return new NextResponse("Todo not found", { status: 404 });
        }

        // Hozzáférés ellenőrzése
        const isManager = ['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role);
        const isOwner = todo.assignedUserId === currentUser.id;

        if (!isManager && !isOwner) {
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
        });

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
            where: { id: todoId }
        });

        if (!todo) {
            return new NextResponse("Todo not found", { status: 404 });
        }

        await prisma.todo.delete({
            where: { id: todoId }
        });

        return NextResponse.json({ message: "Todo deleted successfully" });
    } catch (error) {
        console.error('DELETE /api/todos/[todoId] error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}