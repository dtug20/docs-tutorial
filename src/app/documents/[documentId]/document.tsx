'use client';

import { ToolBar } from "./toolbar";
import { Editor } from "./editor";
import { Navbar } from "./navbar"
import { Room } from "./room";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

interface DocumentPros {
    preloadedDocument: Preloaded<typeof api.documents.getById>;
};

export const Document = ({ preloadedDocument }: DocumentPros) => {
    const document = usePreloadedQuery(preloadedDocument);
    const router = useRouter();

    useEffect(() => {
        if (document === null) {
            toast.error("Document not found or has been removed.");
            router.push("/");
        }
    }, [document, router]);

    if (!document) return null;

    return (
        <Room>
            <div className="min-h-screen bg-[#FAFBFD]">
                <div className="flex flex-col px-4 pt-2 gap-y-2 fixed top-0 left-0 right-0 z-10 bg-[#FAFBFD] print:hidden">
                    <Navbar data={document} />
                    <ToolBar />
                </div>
                <div className="pt-[114px] print:pt-0">
                    <Editor initialContent={document.initialContent} />
                </div>
            </div>
        </Room>
    );
};