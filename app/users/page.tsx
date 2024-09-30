'use client';

import {signOut} from "next-auth/react"

const Users = () => {
    return (
        <button onClick={() => signOut()}>
            LogOut
        </button>
    );
}

export default Users;