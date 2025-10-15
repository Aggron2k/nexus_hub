import { Conversation, Message, User, Document } from "@prisma/client";


export type FullMessageType = Message & {
    sender: User,
    seen: User[]
};

export type FullConversationType = Conversation & {
    users: User[],
    messages: FullMessageType[],
};

export interface FullDocumentType {
    id: string;
    name: string;
    fileUrl: string;
    fileType: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
}

export interface TodoAssignment {
    id: string;
    userId: string;
    todoId: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        userPositions?: Array<{
            isPrimary: boolean;
            position: {
                id: string;
                name: string;
                displayNames: { en: string; hu: string };
                descriptions?: { en: string; hu: string };
                color: string;
            };
        }>;
    };
}

export interface TodoWithRelations {
    id: string;
    title: string;
    description?: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    startDate: Date | null;
    dueDate: Date | null;
    completedAt: Date | null;
    assignments: TodoAssignment[];
    targetPosition?: {
        id: string;
        name: string;
        displayNames: { en: string; hu: string };
        descriptions?: { en: string; hu: string };
        color: string;
    } | null;
    createdBy: {
        id: string;
        name: string;
        email: string;
    };
    notes?: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
}

