import {CollectionConfig} from "payload/types";
import {isAdmin} from "../../access/isAdmin";
import {isAdminOrPublished} from "../../access/isAdminOrPublished";
import {populatePublishedAt} from "../../hooks/populatePublishedAt";
import {revalidateEventCollection} from "./hooks/revalidateEventCollection";
import standardFields from "../../fields/standardFields";
import {ArrayRowLabel} from "../../components/ArrayRowLabel";
import {defaultBlocks} from "../../blocks/defaultBlocks";
import {collectionSlugs} from "../../blocks/fields/collectionSlugs";

export const EventCollections: CollectionConfig = {
    slug: "event",
    admin: {
        useAsTitle: "title",
        hidden: ({user}) => user.role !== "admin",
        livePreview: {
            url: ({data}) => `${process.env.PAYLOAD_PUBLIC_NEXT_URL}/museum-collection/${data.slug}?draft=true&secret=${process.env.PAYLOAD_PUBLIC_DRAFT_SECRET}`,
        },
    },
    hooks: {
        beforeChange: [populatePublishedAt],
        afterChange: [revalidateEventCollection]
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
        {
            name: "shouldLink",
            label: "Link Schedule block to event Page?",
            type: "checkbox",
            admin: {
                description: "When all events are listed out, should this event have a link to it's own page with more info?"
            }
        },
        {
            name: "schedule",
            type: "array",
            fields: [
                {
                    name:"title",
                    type:"text"
                },
                {
                    name:"description",
                    type: "richText"
                },
                {
                    name: "onlyMonth",
                    label: "Show only month on front end",
                    type: "checkbox",
                    admin: {
                        description: "Shows only the month on the website. This is helpful for items that last the entire month such as an artist in residence"
                    }
                },
                {
                    name:"startDate",
                    type: "date"
                },
                {
                    name: "endDate",
                    type: "date"
                },
                {
                    name: "times",
                    type: "array",
                    fields: [
                        {
                            name: 'time',
                            type: 'date',
                            admin: {
                                date: {
                                    pickerAppearance: 'timeOnly',
                                    displayFormat: 'h:mm:ss a',
                                },
                            },
                        },
                    ]
                },
                {
                    name: "noSchedule",
                    label: "Post Event Message",
                    type: "richText",
                    admin: {
                        description: "What message should display after the last schedule item passes? Leave blank to show nothing"
                    }
                }
            ]
        },
        ...standardFields
    ]
}
