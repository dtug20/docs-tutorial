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

    const users = response.data.map((user) => {
        const name = user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "Anonymous";
        const nameToNumber = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const hue = Math.abs(nameToNumber) % 360;
        const color = `hsl(${hue}, 80%, 60%)`;
        
        return {
            id: user.id,
            name,
            avatar: user.imageUrl,
            color,
        };
    });

    return users;
}

export async function getUsersById(userIds: string[]) {
    const clerk = await clerkClient();

    const users = await Promise.all(
        userIds.map(async (userId) => {
            const user = await clerk.users.getUser(userId);
            const name = user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "Anonymous";
            const nameToNumber = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const hue = Math.abs(nameToNumber) % 360;
            const color = `hsl(${hue}, 80%, 60%)`;

            return {
                id: user.id,
                name,
                avatar: user.imageUrl,
                color,
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