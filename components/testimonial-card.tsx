import Image from "next/image"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface TestimonialCardProps {
  quote: string
  author: string
  role: string
  avatar?: string
  rating?: number
  className?: string
  index?: number
}

export function TestimonialCard({
  quote,
  author,
  role,
  avatar,
  rating = 5,
  className,
  index = 0,
}: TestimonialCardProps) {
  return (
    <div
      className={cn(
        "bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md animate-fade-in-up",
        className,
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Rating */}
      {rating > 0 && (
        <div className="flex mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={cn("w-4 h-4", i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />
          ))}
        </div>
      )}

      {/* Quote */}
      <blockquote className="text-[#1E1D40]/80 mb-6">"{quote}"</blockquote>

      {/* Author */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
          {avatar ? (
            <Image
              src={avatar || "/placeholder.svg"}
              alt={author}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#4AB0D9] text-white font-medium">
              {author.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <p className="font-medium text-[#1E1D40]">{author}</p>
          <p className="text-sm text-[#1E1D40]/60">{role}</p>
        </div>
      </div>
    </div>
  )
}
