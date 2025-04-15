import {CollectionConfig} from 'payload/types'
import {isAdminFieldLevel} from "../access/isAdmin";

export const userRoles = [
    "admin",
    "museum-manager",
    "employment-manager"
];

const Users: CollectionConfig = {
    slug: 'users',
    auth: true,
    access: {
        read: ({req: {user}}) => {
            // allow authenticated users
            if (user?.role === 'admin') {
                return true
            }
            // using a query constraint, guest users can access when a field named 'isPublic' is set to true
            return {
                // assumes we have a checkbox field named 'isPublic'
                email: {
                    equals: user?.email,
                },
            }
        }
    },
    admin: {
        useAsTitle: 'email',
    },
    fields: [
        // Email added by default
        // Add more fields as needed
        {
            name: "role",
            type: "select",
            options: userRoles,
            access: {
                update: isAdminFieldLevel
            },
        },
        {
            name: "allowedFormSubmissions",
            type: "relationship",
            relationTo: "forms",
            hasMany: true,
            access: {
                update: isAdminFieldLevel
            },
        }
    ],
}

export default Users
