import bcrypt from "bcrypt";

import prisma from "../../libs/prismadb"
import { NextResponse } from "next/server";

export async function POST(
    request: Request
){
    try{
        
    const body = await request.json();
    const {
        email,
        name,
        password
    } = body;

    if(!email || !name || !password){
        return new NextResponse('Missing info', {status : 400});
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
        data:{
            email,
            name,
            hashedPassword
        }
    });
        return NextResponse.json(user);

    }catch(error: unknown){
        if (error instanceof Error) {
            console.error(error.message, 'REGISTRATION_ERROR');
        } else {
            console.error('Unexpected error', 'REGISTRATION_ERROR');
        }
        return new NextResponse('Internal ERROR', {status: 500});
    }

};