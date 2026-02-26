import React from 'react'

export default function ScheduleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full min-h-screen bg-white">
      {children}
    </div>
  )
}
