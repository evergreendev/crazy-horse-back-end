import {CollectionConfig} from "payload/types";
import {isAdmin} from "../../access/isAdmin";
import {isAdminOrPublished} from "../../access/isAdminOrPublished";
import {populatePublishedAt} from "../../hooks/populatePublishedAt";
import standardFields from "../../fields/standardFields";
import {ArrayRowLabel} from "../../components/ArrayRowLabel";
import {collectionSlugs} from "../../blocks/fields/collectionSlugs";
import {defaultBlocks} from "../../blocks/defaultBlocks";
import {revalidateItem} from "../../hooks/revalidateItem";
import {deleteItem} from "../../hooks/deleteItem";

export const PassionsForTheProject: CollectionConfig = {
    slug: "passions",
    labels: {
        singular: "Passions for the project",
        plural: "Passions for the project"
    },
    admin: {
        useAsTitle: "title",
        hidden: ({user}) => user.role !== "admin",
        livePreview: {
            url: ({data}) => `${process.env.PAYLOAD_PUBLIC_NEXT_URL}/passions/${data.slug}?draft=true&secret=${process.env.PAYLOAD_PUBLIC_DRAFT_SECRET}`,
        },
    },
    hooks: {
        beforeChange: [populatePublishedAt],
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
            name: "jump_menu",
            label: "Jump Menu",
            type: "array",
            admin: {
                components: {
                    RowLabel: ArrayRowLabel
                },
                description: "Each jump menu nav item should have either a Link to another page, or an internal link to a section within the current page"
            },
            labels: {
                singular: "item",
                plural: "items"
            },
            fields: [
                {
                    name: "title",
                    type: "text"
                },
                {
                    name: "link",
                    type: "relationship",
                    relationTo: collectionSlugs,
                },
                {
                    name: "internal_link",
                    type: "text",
                    admin: {
                        description: "Used to link to sections within the current page. Name sections the same as this to link"
                    }
                }
            ]
        },
        {
            name: "excerpt",
            type: "textarea",
            admin: {
                position: "sidebar"
            }
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
        ...standardFields
    ]
}
