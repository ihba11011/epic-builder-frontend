"use client"

interface UserAvatarProps {
  name: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export default function UserAvatar({ name, size = "md", className = "" }: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-xl",
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center font-semibold text-white ${className}`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}
