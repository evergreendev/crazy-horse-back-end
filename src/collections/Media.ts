import { CollectionConfig } from "payload/types";

export const Media: CollectionConfig = {
    slug: "media",
    access: {
        read: () => true
    },
    admin: {
        hidden: ({user}) => !(user.role === "admin" || user.role === "museum-manager"),
    },
    upload: {
        staticURL: "/media",
        staticDir: "media",
        imageSizes: [
            {
                name: 'thumbnail',
                width: 400,
                height: 300,
                position: 'centre',
            },
            {
                name: 'card',
                width: 768,
                height: 1024,
                position: 'centre',
            },
            {
                name: 'tablet',
                width: 1024,
                // By specifying `undefined` or leaving a height undefined,
                // the image will be sized to a certain width,
                // but it will retain its original aspect ratio
                // and calculate a height automatically.
                height: undefined,
                position: 'centre',
            },
        ],
        adminThumbnail: ({doc}) => {
            if ((doc.mimeType as string).includes('image')) return (doc as any).sizes.thumbnail.url;

            return null;
        },
        mimeTypes: ["image/*","video/mp4","application/pdf"],
    },
    fields: [
        {
            name: "alt",
            type: "text"
        }
    ]
}
