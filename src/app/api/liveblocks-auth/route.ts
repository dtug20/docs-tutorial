import { Liveblocks } from "@liveblocks/node";
import { ConvexHttpClient } from "convex/browser";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";

import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const liveblocks = new Liveblocks({
    secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(req: Request) {
    const { sessionClaims, getToken } = await auth();

    if (!sessionClaims) {
        return new Response("Unauthorized", { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
        return new Response("Unauthorized", { status: 401 });
    }

    let room;
    let hasFullAccess = false;
    let hasReadAccess = false;

    try {
        const body = await req.json();
        room = body?.room;
    } catch {
        // No body or invalid JSON
    }

    if (room) {
        const token = await getToken({ template: "convex" });
        if (token) {
            convex.setAuth(token);
        }

        const document = await convex.query(api.documents.getById, { id: room });

        if (!document) {
            return new Response("Unauthorized", { status: 401 });
        }

        const isOwner = document.ownerId === user.id;

        let isOrganizationMember = false;
        if (document.organizationId) {
            const clerk = await clerkClient();
            const memberships = await clerk.users.getOrganizationMembershipList({
                userId: user.id,
            });
            isOrganizationMember = memberships.data.some(
                (membership) => membership.organization.id === document.organizationId
            );
        }

        const isPublicModify = document.publicAccess === "modify";
        const isPublicView = document.publicAccess === "view";

        if (!isOwner && !isOrganizationMember && !isPublicModify && !isPublicView) {
            return new Response("Unauthorized", { status: 401 });
        }

        if (isOwner || isOrganizationMember || isPublicModify) {
            hasFullAccess = true;
        } else if (isPublicView) {
            hasReadAccess = true;
        }
    }

    const session = liveblocks.prepareSession(user.id, {
        userInfo: {
            name: user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "Anonymous",
            avatar: user.imageUrl,
        },
    });

    if (room) {
        if (hasFullAccess) {
            session.allow(room, session.FULL_ACCESS);
        } else if (hasReadAccess) {
            session.allow(room, session.READ_ACCESS);
        }
    }
    const { body, status } = await session.authorize();

    return new Response(body, { status });
}
