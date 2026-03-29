interface DocumentIdPagePros {
    params: Promise<{ documentId: string }>;
};

const DocumentIdPage = async ({ params }: DocumentIdPagePros) => {
    const { documentId } = await params;
    return (
        <div>
            Document ID: {documentId}
        </div>
    );
};

export default DocumentIdPage;