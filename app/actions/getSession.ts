import { getServerSession } from "next-auth";

import { nextAuthConfiguration as authOptions } from "@/app/libs/auth";

export default async function getSession() {
  return await getServerSession(authOptions);
}