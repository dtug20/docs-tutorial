"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import {
    LiveblocksProvider,
    RoomProvider,
    ClientSideSuspense,
} from "@liveblocks/react/suspense";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { FullscreenLoader } from "@/components/fullscreen-loader";
import { getUsers, getUsersById, getDocuments } from "./actions";
import { toast } from "sonner";
import { LEFT_MARGIN_DEFAULT, RIGHT_MARGIN_DEFAULT } from "@/constants/margins";

type User = { id: string; name: string; avatar: string }

export function Room({ children }: { children: ReactNode }) {
    const params = useParams();
    const documentId = params.documentId as string;

    const document = useQuery(api.documents.getById, { id: documentId as Id<"documents"> });

    const [users, setUsers] = useState<User[]>([]);

    const fetchUsers = useMemo(
        () => async () => {
            try {
                // Pass the document's organizationId so we always look up the right org
                // regardless of which org the user currently has active in their session
                const list = await getUsers(document?.organizationId ?? undefined);
                setUsers(list);
            } catch {
                toast.error("Failed to fetch users");
            }
        },
        [document?.organizationId],
    );

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    return (
        <LiveblocksProvider
            throttle={16}
            authEndpoint={async () => {
                const endpoint = "/api/liveblocks-auth";
                const room = params.documentId as string;

                const response = await fetch(endpoint, {
                    method: "POST",
                    body: JSON.stringify({ room }),
                });

                return await response.json();
            }}
            resolveUsers={async ({ userIds }) => {
                const users = await getUsersById(userIds);
                return users;
            }}
            resolveMentionSuggestions={({ text }) => {
                let filteredUsers = users;

                if (text) {
                    filteredUsers = users.filter((user) =>
                        user.name.toLowerCase().includes(text.toLowerCase())
                    );
                }

                return filteredUsers.map((user) => user.id);
            }}
            resolveRoomsInfo={async ({ roomIds }) => {
                const documents = await getDocuments(roomIds as Id<"documents">[]);
                return documents.map((document) => ({
                    id: document.id,
                    name: document.name,
                }));
            }}
        >
            <RoomProvider id={documentId} initialStorage={{ leftMargin: LEFT_MARGIN_DEFAULT, rightMargin: RIGHT_MARGIN_DEFAULT }}
            >
                <ClientSideSuspense fallback={<FullscreenLoader label="Room loading..." />}>
                    {children}
                </ClientSideSuspense>
            </RoomProvider>
        </LiveblocksProvider>
    );
}