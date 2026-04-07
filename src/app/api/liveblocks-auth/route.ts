import { Liveblocks } from "@liveblocks/node";
import { ConvexHttpClient } from "convex/browser";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";

import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const liveblocks = new Liveblocks({
    secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(req: Request) {
    const { sessionClaims } = await auth();

    if (!sessionClaims) {
        return new Response("Unauthorized", { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
        return new Response("Unauthorized", { status: 401 });
    }

    let room;
    try {
        const body = await req.json();
        room = body?.room;
    } catch {
        // No body or invalid JSON
    }

    if (room) {
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

        if (!isOwner && !isOrganizationMember) {
            return new Response("Unauthorized", { status: 401 });
        }
    }

    const session = liveblocks.prepareSession(user.id, {
        userInfo: {
            name: user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "Anonymous",
            avatar: user.imageUrl,
        },
    });

    if (room) {
        session.allow(room, session.FULL_ACCESS);
    }
    const { body, status } = await session.authorize();

    return new Response(body, { status });
}
