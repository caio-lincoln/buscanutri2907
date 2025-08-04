"use client"

import { useState, useEffect } from "react"
import { getCurrentUser, getUserProfile } from "@/lib/auth"
import type { User } from "@supabase/supabase-js"

interface ExtendedUser extends User {
  companyProfile?: any
  nutritionistProfile?: any
  patientProfile?: any
}

export function useUser() {
  const [user, setUser] = useState<ExtendedUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (currentUser) {
          let extendedUser: ExtendedUser = currentUser

          // Carregar perfil específico baseado no tipo de usuário
          if (currentUser.user_type === "empresa") {
            try {
              const { data: companyProfile } = await getUserProfile(currentUser.id, "empresa")
              extendedUser.companyProfile = companyProfile
            } catch (error) {
              console.error("Erro ao carregar perfil da empresa:", error)
            }
          } else if (currentUser.user_type === "nutricionista") {
            try {
              const { data: nutritionistProfile } = await getUserProfile(currentUser.id, "nutricionista")
              extendedUser.nutritionistProfile = nutritionistProfile
            } catch (error) {
              console.error("Erro ao carregar perfil do nutricionista:", error)
            }
          } else if (currentUser.user_type === "paciente") {
            try {
              const { data: patientProfile } = await getUserProfile(currentUser.id, "paciente")
              extendedUser.patientProfile = patientProfile
            } catch (error) {
              console.error("Erro ao carregar perfil do paciente:", error)
            }
          }

          setUser(extendedUser)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  return { user, loading }
}