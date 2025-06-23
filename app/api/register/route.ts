// app/api/positions/route.ts
import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";

export async function GET() {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const positions = await prisma.position.findMany({
            include: {
                _count: {
                    select: {
                        users: true,
                        todos: true
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
                { order: 'asc' },
                { name: 'asc' }
            ]
        });

        return NextResponse.json(positions);
    } catch (error) {
        console.error('GET /api/positions error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const isManager = ['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role);
        if (!isManager) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const body = await request.json();
        const { name, displayName, description, color, order, isActive } = body;

        if (!name || name.trim().length === 0) {
            return new NextResponse("Position name is required", { status: 400 });
        }

        if (!displayName || displayName.trim().length === 0) {
            return new NextResponse("Display name is required", { status: 400 });
        }

        // Ellenőrizzük, hogy nincs-e már ilyen nevű pozíció
        const existingPosition = await prisma.position.findUnique({
            where: { name: name.trim() }
        });

        if (existingPosition) {
            return new NextResponse("Position with this name already exists", { status: 400 });
        }

        const position = await prisma.position.create({
            data: {
                name: name.trim(),
                displayName: displayName.trim(),
                description: description?.trim() || null,
                color: color || '#3B82F6',
                order: order || 0,
                isActive: isActive !== undefined ? isActive : true,
                createdById: currentUser.id
            },
            include: {
                _count: {
                    select: {
                        users: true,
                        todos: true
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

        return NextResponse.json(position);
    } catch (error) {
        console.error('POST /api/positions error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}