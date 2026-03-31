import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Nombre',
    },
    {
      name: 'role',
      type: 'select',
      label: 'Rol',
      defaultValue: 'admin',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Door Staff', value: 'door' },
      ],
    },
  ],
}
