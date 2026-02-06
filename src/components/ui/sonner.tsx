"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme='dark'
      position="top-center"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-success" />,
        info: <InfoIcon className="size-4 text-success" />,
        warning: <TriangleAlertIcon className="size-4 text-warning" />,
        error: <OctagonXIcon className="size-4 text-error" />,
        loading: <Loader2Icon className="size-4 animate-spin text-success" />,
      }}
      toastOptions={{
        className: 'sonner-toast',
        style: {
          background: 'rgba(3, 7, 18, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(97, 202, 135, 0.15)',
          color: '#ffffff',
          borderRadius: '8px',
          padding: '12px 16px',
          boxShadow: '0 0 30px rgba(97, 202, 135, 0.08)',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
