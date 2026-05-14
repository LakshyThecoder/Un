import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Uknow — Pre-Submission Peer Review',
  description: 'Paid, matched, revision-ready peer review before submission.',
  keywords: 'peer review, academic publishing, pre-submission review, manuscript review',
  openGraph: {
    title: 'Uknow — Pre-Submission Peer Review',
    description: 'Get expert review before you submit.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '14px',
              background: '#0d0d14',
              color: '#f4f4f8',
              fontSize: '13px',
              fontWeight: 500,
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.24)',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#0d0d14' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#0d0d14' } },
          }}
        />
      </body>
    </html>
  )
}
