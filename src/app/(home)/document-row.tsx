import { TableCell, TableRow } from "@/components/ui/table";
import { Doc } from "../../../convex/_generated/dataModel";
import { SiGoogledocs } from "react-icons/si";
import { Building2Icon, CircleUserIcon } from "lucide-react";
import { format } from "date-fns";
import { DocumentMenu } from "./document-menu";
import { useRouter } from "next/navigation";
import { useOrganizationList, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { getOrganizationName } from "../documents/[documentId]/actions";

interface DocumentRowProps {
    document: Doc<"documents">;
}

export const DocumentRow = ({ document }: DocumentRowProps) => {
    const router = useRouter();
    const { user } = useUser();
    const isOwner = user?.id === document.ownerId;

    const { userMemberships, isLoaded } = useOrganizationList({
        userMemberships: {
            infinite: true,
        },
    });

    const [organizationName, setOrganizationName] = useState("Organization");

    useEffect(() => {
        if (!document.organizationId) return;

        const org = userMemberships.data?.find(
            (membership) => membership.organization.id === document.organizationId
        )?.organization;

        if (org) {
            setOrganizationName(org.name);
        } else if (isLoaded) {
            getOrganizationName(document.organizationId).then((name) => {
                setOrganizationName(name);
            });
        }
    }, [document.organizationId, userMemberships.data, isLoaded]);

    return (
        <TableRow
            onClick={() => router.push(`/documents/${document._id}`)}
            className="cursor-pointer"
        >
            <TableCell className="w-[50px]">
                <SiGoogledocs className="size-6 fill-blue-500" />
            </TableCell>
            <TableCell className="font-medium md:w-[45%]">
                {document.title}
            </TableCell>
            <TableCell className="text-muted-foreground hidden md:flex items-center gap-2">
                {document.organizationId ? (
                    <>
                        <Building2Icon className="size-4" />
                        {organizationName}
                    </>
                ) : (
                    <>
                        <CircleUserIcon className="size-4" />
                        {isOwner ? "You" : (document.ownerName ?? "Unknown")}
                    </>
                )}
            </TableCell>
            <TableCell className="text-muted-foreground hidden md:table-cell">
                {format(document._creationTime, "MMM dd, yyyy")}
            </TableCell>
            <TableCell className="flex ml-auto justify-end">
                <DocumentMenu
                    documentId={document._id}
                    title={document.title}
                    onNewTab={() => window.open(`/documents/${document._id}`, "_blank")}
                />
            </TableCell>
        </TableRow>
    );
};