import {CollectionConfig} from "payload/types";
import {isAdmin} from "../../access/isAdmin";
import {isAdminOrPublished} from "../../access/isAdminOrPublished";
import {populatePublishedAt} from "../../hooks/populatePublishedAt";
import {revalidateEmployment} from "./hooks/revalidateEmployment";
import standardFields from "../../fields/standardFields";

export const Employment: CollectionConfig = {
    slug: "employment",
    admin: {
        useAsTitle: "title",
        hidden: ({user}) => user.role !== "admin",
    },
    hooks: {
        beforeChange: [populatePublishedAt],
        afterChange: [revalidateEmployment]
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
            name: "description",
            type: "textarea",
        },
        {
            name: "linksToOnlineEmploymentForm",
            label: "Link to online employment form (Uncheck to link position to PDF)",
            type: "checkbox",
            defaultValue: true
        },
        {
            name: "PDF",
            type: "upload",
            relationTo: "media",
            admin: {
                condition: (data, siblingData, { user, }) => data.linksToOnlineEmploymentForm === false
            }
        },
        {
            name: "company",
            required: true,
            type: "select",
            options: [{label: "Crazy Horse Memorial®", value: "crazy-horse"},{label:"Korczak's Heritage",value: "korczak"}],
        },
        {
            name: "positionType",
            required: true,
            type: "select",
            options: ["year-round","seasonal"]
        },
        {
            name: 'featuredImage',
            label: 'Featured Image',
            type: 'upload',
            relationTo: "media",
            admin: {
                position: 'sidebar',
            }
        },
        ...standardFields
    ]
}
