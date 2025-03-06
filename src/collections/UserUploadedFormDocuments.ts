import { CollectionConfig } from "payload/types";
import {isAdmin} from "../access/isAdmin";

export const UserUploadedFormDocuments: CollectionConfig = {
    slug: "userUploadedFormDocuments",
    access: {
        read: isAdmin(),
        create: () => true
    },
    admin: {
        hidden: ({user})=> user.role !== "admin"
    },
    upload: {
        staticURL: "/user-uploaded-documents",
        staticDir: "user-uploaded-documents",
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
        mimeTypes: ["image/*","video/mp4","application/pdf",".doc",".docx","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    },
    fields: [
        {
            name: "associatedFormSubmission",
            type: "relationship",
            relationTo: "form-submissions"
        }
    ]
}
