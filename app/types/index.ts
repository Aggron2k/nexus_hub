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

export interface TodoWithRelations {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    assignedUser: {
        id: string;
        name: string;
        email: string;
        position?: string;
        role: string;
    };
    createdBy: {
        id: string;
        name: string;
        email: string;
    };
    createdAt: string;
    updatedAt: string;
}

