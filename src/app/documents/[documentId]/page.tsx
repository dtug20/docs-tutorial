import { ToolBar } from "./toolbar";
import { Editor } from "./editor";

interface DocumentIdPagePros {
    params: Promise<{ documentId: string }>;
};

const DocumentIdPage = async ({ params }: DocumentIdPagePros) => {
    const { documentId } = await params;
    return (
        <div className="min-h-screen bg-[#FAFBFD]">
            <ToolBar />
            <Editor />
        </div>
    );
};

export default DocumentIdPage;