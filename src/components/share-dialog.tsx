"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface ShareDialogProps {
    documentId: Id<"documents">;
    initialPublicAccess: "view" | "modify" | "private" | undefined;
    children: React.ReactNode;
}

export const ShareDialog = ({ documentId, initialPublicAccess, children }: ShareDialogProps) => {
    const [access, setAccess] = useState<"view" | "modify" | "private">(
        initialPublicAccess ?? "private"
    );
    const [isUpdating, setIsUpdating] = useState(false);
    const [open, setOpen] = useState(false);
    const updatePublicAccess = useMutation(api.documents.updatePublicAccess);

    const onChange = (value: string) => {
        const newAccess = value as "private" | "view" | "modify";
        setAccess(newAccess);
        setIsUpdating(true);
        updatePublicAccess({
            id: documentId,
            publicAccess: newAccess,
        })
        .then(() => toast.success("Share settings updated"))
        .catch(() => toast.error("Failed to update settings"))
        .finally(() => setIsUpdating(false));
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share document</DialogTitle>
                    <DialogDescription>
                        Anyone with the link can access this document based on the permissions below.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2 pt-4">
                    <Select value={access} onValueChange={onChange} disabled={isUpdating}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select access level" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="private">Private (Only you & Org)</SelectItem>
                            <SelectItem value="view">Public (Anyone can view)</SelectItem>
                            <SelectItem value="modify">Public (Anyone can edit)</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button type="button" size="sm" className="px-3" onClick={copyLink}>
                        <span className="sr-only">Copy</span>
                        <CopyIcon className="size-4" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
