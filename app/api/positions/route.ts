import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";

export async function GET() {
    try {
        // Return hardcoded positions for now
        const positions = [
            { id: '1', name: 'Cashier', description: 'Handles cash register', isActive: true },
            { id: '2', name: 'Kitchen', description: 'Kitchen staff', isActive: true },
            { id: '3', name: 'Storage', description: 'Storage management', isActive: true },
            { id: '4', name: 'Packer', description: 'Package handling', isActive: true }
        ];

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
        const { name, description } = body;

        if (!name || name.trim().length === 0) {
            return new NextResponse("Position name is required", { status: 400 });
        }

        // For now, just return the created position data
        const position = {
            id: Date.now().toString(),
            name: name.trim(),
            description: description?.trim() || null,
            isActive: true,
            createdAt: new Date().toISOString(),
            _count: {
                users: 0,
                todos: 0
            }
        };

        return NextResponse.json(position);
    } catch (error) {
        console.error('POST /api/positions error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}