import {Block} from "payload/types";

export const MediaBlock: Block = {
    slug: "MediaBlock",
    fields: [
        {
            name: "media",
            type: "upload",
            relationTo: "media"
        },
        {
            name: "url",
            label: "URL to video",
            type: "text",
            admin:{
                description: "URL to video to embed. Can be either Youtube or Vimeo"
            }
        },
        {
            name: "thumbnail",
            admin: {
                description: "Thumbnail to show for videos. This field won't be used if Media is not a video"
            },
            type: "upload",
            relationTo: "media"
        },
        {
            name: "expandImage",
            type: "checkbox",
            admin: {
                description: "Forces image to expand to fill the size of the container"
            }
        }
    ]
}

export default MediaBlock;
