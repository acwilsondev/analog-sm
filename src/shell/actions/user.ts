'use server';

import { searchUsers as dbSearchUsers, getUserProfile } from "@/shell/db/user";
import { ActionResult, UserProfile } from "@/core/types";

export async function searchUsersAction(query: string): Promise<UserProfile[]> {
  return dbSearchUsers(query);
}

export async function getProfileAction(username: string): Promise<UserProfile | null> {
  return getUserProfile(username);
}
