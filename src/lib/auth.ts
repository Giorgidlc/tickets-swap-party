import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Aquí puedes enlazar el login de Payload si lo necesitas en el futuro
        // Por ahora, NextAuth requiere al menos un proveedor configurado
        return null
      },
    }),
  ],

  callbacks: {
    async jwt({ token, profile, account }) {
      if (account && profile) {
        token.provider = account.provider
        token.name = profile.name || (profile as any).displayName || ''
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).provider = token.provider
      }
      return session
    },
  },

  pages: {
    signIn: '/', // Redirige a nuestra página de registro
  },

  session: {
    strategy: 'jwt',
  },
})
