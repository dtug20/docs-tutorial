import { PaginationStatus } from "convex/react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { Doc } from "../../../convex/_generated/dataModel";
import { DocumentRow } from "./document-row";
import { LoaderIcon } from "lucide-react";
import { Button } from "@/components/ui/button";


interface DocumnetTableProps {
    documents: Doc<"documents">[] | undefined;
    status: PaginationStatus;
    loadMore: (numItems: number) => void;
}

export const DocumentsTable = ({
    documents,
    status,
    loadMore
}: DocumnetTableProps) => {
    return (
        <div className="max-w-screen-xl mx-auto px-16 py-6">
            {documents === undefined ? (
                <div className="flex items-center justify-center h-24">
                    <LoaderIcon className="animate-spin text-muted-foreground size-5" />
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead>Name</TableHead>
                            <TableHead>&nbsp;</TableHead>
                            <TableHead className="hidden md:table-cell">Shared</TableHead>
                            <TableHead className="hidden md:table-cell">Created At</TableHead>
                        </TableRow>
                    </TableHeader>
                    {documents.length === 0 ? (
                        <TableBody>
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No documents found
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    ) : (
                        <TableBody>
                            {documents?.map((document) => (
                                <DocumentRow key={document._id} document={document} />
                            ))}
                        </TableBody>
                    )}
                </Table>
            )}
            <div className="flex items-center justify-center">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => loadMore(5)}
                    disabled={status !== "CanLoadMore"}
                >
                    {status === "CanLoadMore" ? "Load more" : "End of results"}
                </Button>
            </div>
        </div>
    );
};