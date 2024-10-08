import { CollectionConfig } from 'payload/types'

const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  fields: [
    // Email added by default
    // Add more fields as needed
    {
      name: "role",
      type: "select",
      options: [
        "admin",
      ],
      /*access: {
        update: isAdminFieldLevel
      },*/
    },
  ],
}

export default Users
