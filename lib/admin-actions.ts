"use server"

import { redirect } from "next/navigation"

export async function handleAdminSignOut() {
  // Remove admin session
  redirect("/")
}
