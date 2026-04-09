'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
};

const ErrorPage = ({ error, reset }: ErrorProps) => {
    const router = useRouter();

    useEffect(() => {
        const lowerMessage = error.message.toLowerCase();
        if (lowerMessage.includes("document not found")) {
            toast.error("Document not found or has been removed.");
            router.push("/");
        } else if (lowerMessage.includes("unauthorized") || lowerMessage.includes("not authorized")) {
            toast.error("You do not have permission to access this document.");
            router.push("/");
        }
    }, [error, router]);

    // For other errors, show a friendly UI
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#FAFBFD]">
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-rose-100">
                    <AlertTriangle className="size-8 text-rose-600" />
                </div>
                <h1 className="text-2xl font-semibold text-gray-900">Something went wrong</h1>
                <p className="max-w-sm text-sm text-gray-500">{error.message}</p>
            </div>
            <div className="flex gap-3">
                <Button onClick={() => router.push("/")} variant="outline">
                    Go home
                </Button>
                <Button onClick={reset}>
                    Try again
                </Button>
            </div>
        </div>
    );
};

export default ErrorPage;
