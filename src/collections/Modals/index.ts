import {CollectionConfig} from "payload/types";
import {isAdmin} from "../../access/isAdmin";
import {isAdminOrPublished} from "../../access/isAdminOrPublished";
import {revalidateItem} from "../../hooks/revalidateItem";
import {deleteItem} from "../../hooks/deleteItem";
import navItemFields from "../../fields/navItemFields";

export const Modals: CollectionConfig = {
    slug: "modal",
    admin: {
        useAsTitle: "title",
        hidden: ({user}) => user.role !== "admin",
        livePreview: {
            url: ({data}) => `${process.env.PAYLOAD_PUBLIC_NEXT_URL}/museum-collection/${data.slug}?draft=true&secret=${process.env.PAYLOAD_PUBLIC_DRAFT_SECRET}`,
        },
    },
    hooks: {
        afterChange: [revalidateItem],
        afterDelete: [deleteItem]
    },
    versions: {
        drafts: true
    },
    access: {
        read: isAdminOrPublished(),
        update: isAdmin(),
        create: isAdmin(),
        delete: isAdmin()
    },
    fields: [
        {
            type: "array",
            name: "headerImages",
            fields: [
                {
                    name: "image",
                    type: "upload",
                    relationTo: "media"
                }
            ]
        },
        {
            name: "headerText",
            type: "text",
        },
        {
            name: "bodyText",
            type: "richText"
        },
        {
            name: "primaryAction",
            type: "group",
            fields: [
                ...navItemFields
            ]
        },
        {
            name: "secondaryAction",
            type: "group",
            fields: [
                ...navItemFields
            ]
        },
        {
            name: "startShowing",
            type: "date",
            admin: {
                position: "sidebar"
            },
        },
        {
            name: "stopShowing",
            type: "date",
            admin: {
                position: "sidebar"
            },
        },
        {
            name: "pages",
            type: "relationship",
            relationTo: "pages",
            hasMany: true,
            admin: {
                position: "sidebar"
            },
        }
    ]
}
