
'use client'

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MapPin, Video, Star, Clock } from 'lucide-react'
import Link from 'next/link'
import type { Nutritionist } from '@/hooks/useNutritionists'

interface NutritionistCardProps {
  nutritionist: Nutritionist
}

export function NutritionistCard({ nutritionist }: NutritionistCardProps) {
  const specialties = Array.isArray(nutritionist.specialties) 
    ? nutritionist.specialties 
    : typeof nutritionist.specialties === 'string' 
      ? nutritionist.specialties.split(',').map(s => s.trim()) 
      : []

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200 overflow-hidden border-border/50">
      <CardContent className="p-6 flex-1">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/10">
            <AvatarImage src={nutritionist.profile_image_url} alt={nutritionist.full_name} />
            <AvatarFallback className="bg-primary/5 text-primary text-lg font-medium">
              {nutritionist.full_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-foreground truncate">
              {nutritionist.full_name}
            </h3>
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-foreground">{nutritionist.rating?.toFixed(1) || 'New'}</span>
              <span className="text-xs">({nutritionist.total_reviews || 0} avaliações)</span>
            </div>

            {(nutritionist.location || nutritionist.address) && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1 truncate">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {nutritionist.location || nutritionist.address}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {specialties.slice(0, 3).map((spec, i) => (
            <Badge key={i} variant="secondary" className="text-xs font-normal bg-secondary/50 hover:bg-secondary/70">
              {spec}
            </Badge>
          ))}
          {specialties.length > 3 && (
            <Badge variant="outline" className="text-xs font-normal">
              +{specialties.length - 3}
            </Badge>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-sm">
          {nutritionist.online_consultation_available && (
            <div className="flex items-center gap-1.5 text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full dark:bg-green-900/20 dark:text-green-400">
              <Video className="h-3.5 w-3.5" />
              <span>Online</span>
            </div>
          )}
          {nutritionist.consultation_price && (
            <div className="font-semibold text-foreground">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(nutritionist.consultation_price)}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full font-medium" size="lg">
          <Link href={`/dashboard/paciente/agendar/${nutritionist.id}`}>
            Agendar Consulta
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
