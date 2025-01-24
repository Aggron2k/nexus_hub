import { Conversation, Message, User, Document } from "@prisma/client";


export type FullMessageType = Message & {
    sender: User,
    seen: User[]
};

export type FullConversationType = Conversation & {
    users: User[],
    messages: FullMessageType[],
};

export type FullDocumentType = Document & {
    user: User
};