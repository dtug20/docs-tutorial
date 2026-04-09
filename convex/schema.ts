import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    documents: defineTable({
        title: v.string(),
        initialContent: v.optional(v.string()),
        ownerId: v.string(),
        ownerName: v.optional(v.string()),
        roomId: v.optional(v.string()),
        organizationId: v.optional(v.string()),
        viewedAt: v.optional(v.number()),
        publicAccess: v.optional(v.union(v.literal("view"), v.literal("modify"), v.literal("private"))),
    })
        .index("by_owner_id", ["ownerId"])
        .index("by_organization_id", ["organizationId"])
        .searchIndex("search_title", {
            searchField: "title",
            filterFields: ["ownerId", "organizationId"],
        }),

    organizations: defineTable({
        name: v.string(),
        ownerId: v.string(),
    })
        .index("by_owner_id", ["ownerId"]),

    userAccesses: defineTable({
        userId: v.string(),
        documentId: v.id("documents"),
        timestamp: v.number(),
    })
        .index("by_user_id", ["userId"])
        .index("by_document_id", ["documentId"])
        .index("by_user_and_document", ["userId", "documentId"]),
});