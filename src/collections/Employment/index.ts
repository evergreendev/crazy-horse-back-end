import {CollectionConfig} from "payload/types";
import {populatePublishedAt} from "../../hooks/populatePublishedAt";
import standardFields from "../../fields/standardFields";
import {revalidateItem} from "../../hooks/revalidateItem";
import {deleteItem} from "../../hooks/deleteItem";
import {isRoleOrPublished} from "../../access/isRoleOrPublished";
import {isAtLeastEmployeeManager} from "../../access/isAtLeastEmploymentManager";

export const Employment: CollectionConfig = {
    slug: "employment",
    admin: {
        useAsTitle: "title",
        hidden: ({user}) => (user.role === "admin" || user.role === "employment-manager"),
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
        read: isRoleOrPublished("employment-manager"),
        update: isAtLeastEmployeeManager(),
        create: isAtLeastEmployeeManager(),
        delete: isAtLeastEmployeeManager()
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
