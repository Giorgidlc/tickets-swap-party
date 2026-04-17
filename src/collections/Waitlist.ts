import type { CollectionConfig } from 'payload'

export const Waitlist: CollectionConfig = {
  slug: 'waitlist',
  admin: {
    useAsTitle: 'email',
    description: 'Lista de espera cuando se agotan las 20 consumiciones gratuitas',
    defaultColumns: ['position', 'email', 'status', 'createdAt'],
  },
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      label: 'Email',
    },
    {
      name: 'name',
      type: 'text',
      label: 'Nombre',
    },
    {
      name: 'position',
      type: 'number',
      required: true,
      label: 'Posición en la cola',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'waiting',
      label: 'Estado',
      options: [
        { label: '⏳ En espera', value: 'waiting' },
        { label: '📧 Notificado (plaza libre)', value: 'notified' },
        { label: '✅ Promovido a ticket', value: 'promoted' },
        { label: '⏰ Expirado', value: 'expired' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
