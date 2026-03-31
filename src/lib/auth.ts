import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID || 'common',
    }),
  ],

  callbacks: {
    async jwt({ token, profile, account }) {
      if (account && profile) {
        token.provider = account.provider
        token.name = profile.name || profile.displayName || ''
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
