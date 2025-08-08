import { Metadata } from 'next'
import { salonService } from '@/lib/firebase/services'

interface GlampageLayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  
  try {
    const salon = await salonService.getSalonBySlug(slug)
    
    if (!salon) {
      return {
        title: 'Salon Not Found - GlamSlot',
        description: 'The salon you are looking for does not exist.',
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://glamslot.vercel.app'
    const glampageUrl = `${baseUrl}/glampage/${slug}`

    return {
      title: `${salon.name} - Professional Beauty Services | GlamSlot`,
      description: `Visit ${salon.name} for professional beauty services. Book appointments online and experience exceptional care from our skilled team.`,
      keywords: ['salon', 'beauty', 'hair', 'styling', 'appointments', 'booking', salon.name],
      authors: [{ name: salon.name }],
      creator: salon.name,
      publisher: 'GlamSlot',
      formatDetection: {
        email: false,
        address: false,
        telephone: false,
      },
      metadataBase: new URL(baseUrl),
      alternates: {
        canonical: glampageUrl,
      },
      openGraph: {
        title: `${salon.name} - Professional Beauty Services`,
        description: `Visit ${salon.name} for professional beauty services. Book appointments online and experience exceptional care from our skilled team.`,
        url: glampageUrl,
        siteName: 'GlamSlot',
        locale: 'en_US',
        type: 'website',
        images: [
          {
            url: '/icon-512x512.png',
            width: 512,
            height: 512,
            alt: `${salon.name} - GlamSlot`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${salon.name} - Professional Beauty Services`,
        description: `Visit ${salon.name} for professional beauty services. Book appointments online and experience exceptional care from our skilled team.`,
        images: ['/icon-512x512.png'],
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Salon - GlamSlot',
      description: 'Professional beauty services and appointments.',
    }
  }
}

export default function GlampageLayout({ children }: GlampageLayoutProps) {
  return children
} 