'use server';

import { auth, clerkClient } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function getDocuments(ids: Id<"documents">[]) {
    return await convex.query(api.documents.getByIds, { ids });
};

export async function getUsers(organizationId?: string) {
    const clerk = await clerkClient();

    // Use the provided orgId (from the document), or fall back to active session orgId
    let targetOrgId = organizationId;
    if (!targetOrgId) {
        const { orgId } = await auth();
        targetOrgId = orgId ?? undefined;
    }

    if (!targetOrgId) {
        return [];
    }

    const response = await clerk.users.getUserList({
        organizationId: [targetOrgId],
    });

    const users = response.data.map((user) => ({
        id: user.id,
        name: user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "Anonymous",
        avatar: user.imageUrl,
    }));

    return users;
}

export async function getUsersById(userIds: string[]) {
    const clerk = await clerkClient();

    const users = await Promise.all(
        userIds.map(async (userId) => {
            const user = await clerk.users.getUser(userId);
            return {
                id: user.id,
                name: user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "Anonymous",
                avatar: user.imageUrl,
            };
        })
    );

    return users;
}

export async function getOrganizationName(organizationId: string) {
    const clerk = await clerkClient();
    try {
        const organization = await clerk.organizations.getOrganization({ organizationId });
        return organization.name;
    } catch {
        return "Organization";
    }
}