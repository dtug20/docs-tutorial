import { query, mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const getByIds = query({
    args: { ids: v.array(v.id("documents")) },
    handler: async (ctx, { ids }) => {
        const documents = [];

        for (const id of ids) {
            const document = await ctx.db.get(id);

            if (document) {
                documents.push({ id: document._id, name: document.title });
            } else {
                documents.push({ id, name: "[Removed]" });
            }
        }

        return documents;
    },
});

export const create = mutation({
    args: { title: v.optional(v.string()), initialContent: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();

        if (!user) {
            throw new ConvexError("Unathorized");
        }

        const organizationId = (user.organization_id ?? undefined) as
            | string
            | undefined;

        const documentId = await ctx.db.insert("documents", {
            title: args.title ?? "Untitled document",
            ownerId: user.subject,
            ownerName: user.name ?? user.email ?? "Unknown",
            organizationId: organizationId,
            initialContent: args.initialContent,
        });
        return documentId;
    },
});

export const get = query({
    args: { paginationOpts: paginationOptsValidator, search: v.optional(v.string()) },
    handler: async (ctx, { search, paginationOpts }) => {
        const user = await ctx.auth.getUserIdentity();

        if (!user) {
            throw new ConvexError("Unathorized");
        }

        const organizationId = (user.organization_id ?? undefined) as
            | string
            | undefined;

        // Search within organization
        if (search && organizationId) {
            return await ctx.db
                .query("documents")
                .withSearchIndex("search_title", (q) =>
                    q.search("title", search).eq("organizationId", organizationId))
                .paginate(paginationOpts);
        }

        // Manually merge owned and accessed documents for accurate tracking
        const ownedDocs = await ctx.db
            .query("documents")
            .withIndex("by_owner_id", (q) => q.eq("ownerId", user.subject))
            .collect();
            
        const accessedRows = await ctx.db
            .query("userAccesses")
            .withIndex("by_user_id", (q) => q.eq("userId", user.subject))
            .collect();
            
        const allDocsMap = new Map();
        for (const doc of ownedDocs) {
            allDocsMap.set(doc._id, doc);
        }
        
        for (const row of accessedRows) {
            const doc = await ctx.db.get(row.documentId);
            if (doc) allDocsMap.set(doc._id, doc);
        }
        
        let allDocs = Array.from(allDocsMap.values());
        
        if (search) {
            allDocs = allDocs.filter(d => 
                d.title.toLowerCase().includes(search.toLowerCase())
            );
        }
        
        allDocs.sort((a, b) => (b.viewedAt ?? b._creationTime) - (a.viewedAt ?? a._creationTime));
        
        const start = paginationOpts.cursor ? parseInt(paginationOpts.cursor) : 0;
        const end = start + paginationOpts.numItems;
        const page = allDocs.slice(start, end);
        const isDone = end >= allDocs.length;
        
        return {
            page,
            isDone,
            continueCursor: isDone ? "done" : end.toString()
        };
    },
});

export const recordAccess = mutation({
    args: { documentId: v.id("documents") },
    handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) return;
        
        const existing = await ctx.db
            .query("userAccesses")
            .withIndex("by_user_and_document", q => 
                q.eq("userId", user.subject)
                 .eq("documentId", args.documentId)
            )
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, { timestamp: Date.now() });
        } else {
            await ctx.db.insert("userAccesses", {
                userId: user.subject,
                documentId: args.documentId,
                timestamp: Date.now(),
            });
        }
        
        await ctx.db.patch(args.documentId, { viewedAt: Date.now() });
    }
});

export const removeById = mutation({
    args: { id: v.id("documents") },
    handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();

        if (!user) {
            throw new ConvexError("Unathorized");
        }

        const organizationId = (user.organization_id ?? undefined) as
            | string
            | undefined;

        const document = await ctx.db.get(args.id);

        if (!document) {
            throw new ConvexError("Document not found");
        }

        const isOwner = document.ownerId === user.subject;
        const isOrganizationMember =
            !!(document.organizationId && document.organizationId === organizationId);

        if (!isOwner && !isOrganizationMember) {
            throw new ConvexError("Unathorized");
        }

        await ctx.db.delete(args.id);
    },
});

export const updateById = mutation({
    args: { id: v.id("documents"), title: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();

        if (!user) {
            throw new ConvexError("Unathorized");
        }

        const organizationId = (user.organization_id ?? undefined) as
            | string
            | undefined;


        const document = await ctx.db.get(args.id);

        if (!document) {
            throw new ConvexError("Document not found");
        }

        const isOwner = document.ownerId === user.subject;
        const isOrganizationMember =
            !!(document.organizationId && document.organizationId === organizationId);

        if (!isOwner && !isOrganizationMember && document.publicAccess !== "modify") {
            throw new ConvexError("Unauthorized");
        }

        await ctx.db.patch(args.id, {
            title: args.title,
        });
    },
});

export const getById = query({
    args: { id: v.id("documents") },
    handler: async (ctx, { id }) => {
        const document = await ctx.db.get(id);

        if (!document) {
            throw new ConvexError("Document not found");
        }

        const user = await ctx.auth.getUserIdentity();

        if (!user) {
            throw new ConvexError("Unauthorized");
        }

        const organizationId = (user.organization_id ?? undefined) as
            | string
            | undefined;

        const isOwner = document.ownerId === user.subject;
        const isOrganizationMember =
            !!(document.organizationId && document.organizationId === organizationId);
        
        const isPublic = document.publicAccess !== undefined && document.publicAccess !== null;

        if (!isOwner && !isOrganizationMember && !isPublic) {
            throw new ConvexError("Unauthorized");
        }

        return document;
    },
});

export const updatePublicAccess = mutation({
    args: { id: v.id("documents"), publicAccess: v.optional(v.union(v.literal("view"), v.literal("modify"), v.literal("private"))) },
    handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();

        if (!user) {
            throw new ConvexError("Unauthorized");
        }

        const organizationId = (user.organization_id ?? undefined) as
            | string
            | undefined;

        const document = await ctx.db.get(args.id);

        if (!document) {
            throw new ConvexError("Document not found");
        }

        const isOwner = document.ownerId === user.subject;
        const isOrganizationMember =
            !!(document.organizationId && document.organizationId === organizationId);

        if (!isOwner && !isOrganizationMember) {
            throw new ConvexError("Unauthorized");
        }

        await ctx.db.patch(args.id, {
            publicAccess: args.publicAccess,
        });
    },
});
