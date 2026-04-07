'use client';

import { LiveblocksProvider } from "@liveblocks/react/suspense";
import { Inbox } from "../documents/[documentId]/inbox";
import { getUsersById, getDocuments } from "../documents/[documentId]/actions";
import { Id } from "../../../convex/_generated/dataModel";

export const NavbarInbox = () => {
    return (
        <LiveblocksProvider
            throttle={16}
            authEndpoint="/api/liveblocks-auth"
            resolveUsers={async ({ userIds }) => {
                const users = await getUsersById(userIds);
                return users;
            }}
            resolveRoomsInfo={async ({ roomIds }) => {
                const documents = await getDocuments(roomIds as Id<"documents">[]);
                return documents.map((document) => ({
                    id: document.id,
                    name: document.name,
                }));
            }}
        >
            <Inbox />
        </LiveblocksProvider>
    );
};
