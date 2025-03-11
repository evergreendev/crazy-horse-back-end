import {CollectionConfig} from "payload/types";
import {populatePublishedAt} from "../../hooks/populatePublishedAt";
import standardFields from "../../fields/standardFields";
import {defaultBlocks} from "../../blocks/defaultBlocks";
import {revalidateItem} from "../../hooks/revalidateItem";
import {deleteItem} from "../../hooks/deleteItem";
import {isRoleOrPublished} from "../../access/isRoleOrPublished";
import {isAtLeastMuseumManager} from "../../access/isAtLeastMuseumManager";

export const EventCategories: CollectionConfig = {
    slug: "eventCat",
    labels: {
        singular: "Event Category",
        plural: "Event Categories"
    },
    admin: {
        useAsTitle: "title",
        hidden: ({user}) => user.role !== "admin",
        livePreview: {
            url: ({data}) => `${process.env.PAYLOAD_PUBLIC_NEXT_URL}/event/category/${data.slug}?draft=true&secret=${process.env.PAYLOAD_PUBLIC_DRAFT_SECRET}`,
        },
    },
    versions: {
        drafts: true
    },
    hooks: {
        beforeChange: [populatePublishedAt],
        afterChange: [revalidateItem],
        afterDelete: [deleteItem]
    },
    access: {
        read: isRoleOrPublished("museum-manager"),
        update: isAtLeastMuseumManager(),
        create: isAtLeastMuseumManager(),
        delete: isAtLeastMuseumManager()
    },
    fields: [
        {
            name: "intro_content",
            label: "Intro Content",
            type: "group",
            admin:{disableListColumn:true},
            fields: [
                {
                    name: "video",
                    type: "text",
                    admin: {
                        description: "URL to youtube video. If this is empty slides will show on front end instead of the video"
                    }
                },
                {
                    name: "videoFile",
                    type: "upload",
                    relationTo: "media",
                    admin: {
                        description: "A video file to use for the intro video"
                    }
                },
                {
                    name: "thumbnail",
                    type: "upload",
                    relationTo: "media",
                    admin: {
                        condition: (data) => {
                            return data?.intro_content?.video || data?.intro_content?.videoFile;
                        },
                        description: "Image used as video cover"
                    }
                },
                {
                    name: "images",
                    type: "array",
                    fields: [
                        {
                            name: "media",
                            type: "upload",
                            relationTo: "media"
                        }
                    ]
                },
                {
                    name: "header",
                    type: "text"
                },
                {
                    name: "content",
                    type: "textarea"
                }
            ]
        },
        {
            name: "layout",
            type: "blocks",
            labels: {
                singular: "row",
                plural: "rows",
            },
            blocks: defaultBlocks()
        },
        ...standardFields,
    ]
}
