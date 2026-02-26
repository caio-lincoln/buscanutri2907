'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MapPin, Star, ShieldCheck } from 'lucide-react'
import type { Nutritionist } from '@/hooks/useNutritionists'

interface ProfessionalSummaryProps {
  nutritionist: Nutritionist
}

export function ProfessionalSummary({ nutritionist }: ProfessionalSummaryProps) {
  return (
    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 w-full text-center md:text-left">
      {/* Photo */}
      <div className="relative shrink-0">
        <Avatar className="h-28 w-28 md:h-32 md:w-32 border-4 border-background shadow-xl ring-1 ring-border/10">
          <AvatarImage src={nutritionist.profile_image_url} className="object-cover" />
          <AvatarFallback className="text-4xl font-bold text-primary bg-primary/5">
            {nutritionist.full_name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        {nutritionist.is_verified && (
          <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-full shadow-lg border-2 border-background" title="Profissional Verificado">
            <ShieldCheck className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-3 flex-1 min-w-0">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-tight">
            {nutritionist.full_name}
          </h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground bg-muted px-2 py-0.5 rounded">CRN: {nutritionist.crn}</span>
            {nutritionist.location && (
              <>
                <span className="hidden md:inline">•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {nutritionist.location}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Stats & Chips */}
        <div className="space-y-3">
          <div className="flex items-center justify-center md:justify-start gap-3">
             <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full border border-yellow-200/50 shadow-sm">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-bold">{nutritionist.rating?.toFixed(1) || 'New'}</span>
                <span className="opacity-80 text-xs">({nutritionist.total_reviews || 0} avaliações)</span>
              </div>
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            {typeof nutritionist.specialties === 'string' 
              ? nutritionist.specialties.split(',').slice(0, 4).map((s, i) => (
                  <Badge key={i} variant="secondary" className="px-2.5 py-0.5 text-xs font-medium bg-secondary/50 hover:bg-secondary/70 transition-colors">
                    {s.trim()}
                  </Badge>
                ))
              : Array.isArray(nutritionist.specialties) 
                ? nutritionist.specialties.slice(0, 4).map((s, i) => (
                    <Badge key={i} variant="secondary" className="px-2.5 py-0.5 text-xs font-medium bg-secondary/50 hover:bg-secondary/70 transition-colors">
                      {s}
                    </Badge>
                  ))
                : null
            }
          </div>
        </div>
      </div>
    </div>
  )
}
