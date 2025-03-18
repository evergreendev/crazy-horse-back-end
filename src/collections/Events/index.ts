import {CollectionConfig} from "payload/types";
import {populatePublishedAt} from "../../hooks/populatePublishedAt";
import standardFields from "../../fields/standardFields";
import {ArrayRowLabel} from "../../components/ArrayRowLabel";
import {defaultBlocks} from "../../blocks/defaultBlocks";
import {collectionSlugs} from "../../blocks/fields/collectionSlugs";
import {revalidateItem} from "../../hooks/revalidateItem";
import {deleteItem} from "../../hooks/deleteItem";
import {isRoleOrPublished} from "../../access/isRoleOrPublished";
import {isAtLeastMuseumManager} from "../../access/isAtLeastMuseumManager";
import CustomCell from "./CustomCell";

const handleUp = async (id:string) => {
    const posts = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/event?_sort=order:asc&_limit=1000&_page=1&_embed=eventCategory`);
    const postsJson = await posts.json();
    const docs = postsJson.docs;
    const currOrder = docs.find((doc: { id: string; }) => doc.id === id).order;
    const minOrder = 1;
    const postIdToReplace = docs.find((doc: { order: number; }) => doc.order === currOrder - 1)?.id;

    await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/event/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            order: Math.max(currOrder - 1, minOrder),
        }),
    });

    if (postIdToReplace) {
        await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/event/${postIdToReplace}`, {
            method: "PATCH",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                order: currOrder,
            }),
        })
    }

    location.reload();
}
const handleDown = async (id:string) => {
    const posts = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/event?_sort=order:asc&_limit=1000&_page=1&_embed=eventCategory`);
    const postsJson = await posts.json();
    const docs = postsJson.docs;
    const currOrder = docs.find((doc: { id: string; }) => doc.id === id).order;
    const maxOrder = docs.length;
    const postIdToReplace = docs.find((doc: { order: number; }) => doc.order === currOrder + 1)?.id;

    await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/event/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            order: Math.min(currOrder + 1, maxOrder),
        }),
    })

    if (postIdToReplace) {
        await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/event/${postIdToReplace}`, {
            method: "PATCH",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                order: currOrder,
            }),
        })
    }

    location.reload();
}

export const EventCollections: CollectionConfig = {
    slug: "event",
    admin: {
        useAsTitle: "title",
        defaultColumns: ["title", "order"],
        hidden: ({user}) => !(user.role === "admin" || user.role === "museum-manager"),
        livePreview: {
            url: ({data}) => `${process.env.PAYLOAD_PUBLIC_NEXT_URL}/event/${data.slug}?draft=true&secret=${process.env.PAYLOAD_PUBLIC_DRAFT_SECRET}`,
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
            name: "layout",
            type: "blocks",
            labels: {
                singular: "row",
                plural: "rows",
            },
            blocks: defaultBlocks()
        },
        ...standardFields,
        {
            name: "eventCategory",
            type: "relationship",
            relationTo: "eventCat",
            admin: {
                position: "sidebar"
            },
        },
        {
            name: "order",
            type: "number",
            admin: {
                readOnly: true,
                components: {
                    Cell: (props) => CustomCell({...props, handleUp:handleUp, handleDown:handleDown})
                },
                position: "sidebar"
            },
        }
    ]
}
