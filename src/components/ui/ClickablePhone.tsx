interface ClickablePhoneProps {
  phone: string
  children?: React.ReactNode
  className?: string
}

export default function ClickablePhone({ phone, children, className = '' }: ClickablePhoneProps) {
  // Clean the phone number for tel: protocol
  const cleanPhone = phone.replace(/[^\d+]/g, '')
  
  return (
    <a
      href={`tel:${cleanPhone}`}
      className={`hover:underline transition-colors ${className}`}
      aria-label={`Call ${phone}`}
    >
      {children || phone}
    </a>
  )
} 