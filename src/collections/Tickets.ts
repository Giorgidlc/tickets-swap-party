import type { CollectionConfig } from 'payload'

export const Tickets: CollectionConfig = {
  slug: 'tickets',
  admin: {
    useAsTitle: 'email',
    description: 'Entradas para Swap Party (máximo 20)',
    defaultColumns: ['ticketCode', 'email', 'status', 'createdAt'],
    listSearchableFields: ['email', 'ticketCode'],
  },

  // Desactivar creación manual desde admin (solo via API)
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
    delete: ({ req }) => Boolean(req.user), // Solo admin puede borrar
  },

  fields: [
    // ── Datos del asistente ──
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
      admin: {
        description: 'Capturado automáticamente de Google/Microsoft',
      },
    },
    {
      name: 'authProvider',
      type: 'select',
      label: 'Método de registro',
      defaultValue: 'email',
      options: [
        { label: 'Email manual', value: 'email' },
        { label: 'Google', value: 'google' },
        { label: 'Microsoft', value: 'microsoft' },
      ],
      admin: {
        position: 'sidebar',
      },
    },

    // ── Identificadores del ticket ──
    {
      name: 'ticketCode',
      type: 'text',
      required: true,
      unique: true,
      label: 'Código de Ticket',
      admin: {
        readOnly: true,
        description: 'Ej: SWAP-A3F7',
      },
    },
    {
      name: 'qrToken',
      type: 'text',
      required: true,
      unique: true,
      label: 'Token QR',
      admin: {
        readOnly: true,
        description: 'UUID codificado en el QR para validación',
      },
    },
    {
      name: 'cancelToken',
      type: 'text',
      required: true,
      unique: true,
      label: 'Token de Cancelación',
      admin: {
        readOnly: true,
        description: 'UUID usado en el enlace de cancelación',
      },
    },

    // ── Estado ──
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'confirmed',
      label: 'Estado',
      options: [
        { label: '✅ Confirmado', value: 'confirmed' },
        { label: '🚪 Asistió', value: 'attended' },
        { label: '❌ Cancelado', value: 'cancelled' },
      ],
      admin: {
        position: 'sidebar',
      },
    },

    // ── Timestamps ──
    {
      name: 'attendedAt',
      type: 'date',
      label: 'Fecha de asistencia',
      admin: {
        readOnly: true,
        position: 'sidebar',
        date: {
          displayFormat: 'dd/MM/yyyy HH:mm',
        },
      },
    },
    {
      name: 'cancelledAt',
      type: 'date',
      label: 'Fecha de cancelación',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },

    // ── Consumición ──
    {
      name: 'drinkRedeemed',
      type: 'checkbox',
      defaultValue: false,
      label: '🍹 Consumición canjeada',
      admin: {
        position: 'sidebar',
      },
    },
  ],

  timestamps: true, // Añade createdAt y updatedAt automáticamente

  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'update' && data?.status === 'attended' && !data?.attendedAt) {
          data.attendedAt = new Date().toISOString()
        }
        if (operation === 'update' && data?.status === 'cancelled' && !data?.cancelledAt) {
          data.cancelledAt = new Date().toISOString()
        }
        return data
      },
    ],
  },
}
