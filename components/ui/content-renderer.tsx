'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import DOMPurify from 'dompurify'

interface ContentRendererProps {
  content: string
  className?: string
  centerImages?: boolean
}

// Função para detectar e converter links de vídeo em embeds
const processVideoEmbeds = (html: string): string => {
  // YouTube
  const youtubeRegex =
    /(?:https?:\/\/)?(?:www.)?(?:youtube.com\/watch?v=|youtu.be\/|youtube.com\/embed\/)([a-zA-Z0-9_-]{11})/g
  html = html.replace(youtubeRegex, (match, videoId) => {
    return `<div class="video-embed youtube-embed">
      <iframe 
        src="https://www.youtube.com/embed/${videoId}" 
        frameborder="0" 
        allowfullscreen
        class="w-full aspect-video rounded-lg"
      ></iframe>
    </div>`
  })

  // Instagram (usando oEmbed approach simplificado)
  const instagramRegex =
    /(?:https?:\/\/)?(?:www.)?instagram.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/g
  html = html.replace(instagramRegex, (match, postId) => {
    return `<div class="video-embed instagram-embed">
      <blockquote class="instagram-media" data-instgrm-permalink="${match}" data-instgrm-version="14">
        <a href="${match}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">
          Ver post no Instagram
        </a>
      </blockquote>
    </div>`
  })

  // TikTok
  const tiktokRegex =
    /(?:https?:\/\/)?(?:www.)?tiktok.com\/@[^\/]+\/video\/(d+)/g
  html = html.replace(tiktokRegex, (match, videoId) => {
    return `<div class="video-embed tiktok-embed">
      <blockquote class="tiktok-embed" cite="${match}" data-video-id="${videoId}">
        <a href="${match}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">
          Ver vídeo no TikTok
        </a>
      </blockquote>
    </div>`
  })

  return html
}

// Função para processar imagens e adicionar classes de centralização
const processImages = (html: string, centerImages: boolean = false): string => {
  if (!centerImages) return html

  return html.replace(
    /<img([^>]*)>/g,
    `<img$1 class="mx-auto block max-w-full h-auto rounded-lg">`
  )
}

// Função para preservar quebras de linha e espaçamento
const preserveFormatting = (html: string): string => {
  // Preservar quebras de linha duplas como parágrafos
  html = html.replace(/\n\n/g, '</p><p>')

  // Preservar quebras de linha simples como <br>
  html = html.replace(/\n/g, '<br>')

  // Preservar espaços múltiplos
  html = html.replace(/  +/g, match => {
    return '&nbsp;'.repeat(match.length)
  })

  return html
}

export function ContentRenderer({
  content,
  className,
  centerImages = false,
}: ContentRendererProps) {
  // Processar o conteúdo
  let processedContent = content

  // 1. Processar embeds de vídeo
  processedContent = processVideoEmbeds(processedContent)

  // 2. Processar imagens
  processedContent = processImages(processedContent, centerImages)

  // 3. Preservar formatação
  processedContent = preserveFormatting(processedContent)

  // 4. Sanitizar o HTML com DOMPurify
  processedContent = DOMPurify.sanitize(processedContent, {
    ALLOWED_TAGS: [
      'div', 'iframe', 'blockquote', 'img', 'br', 'p', 'span', 'strong', 'em', 'u', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li'
    ],
    ALLOWED_ATTR: [
      'class', 'width', 'height', 'src', 'frameborder', 'allowfullscreen', 'data-instgrm-permalink', 'data-instgrm-version', 'cite', 'data-video-id', 'alt', 'href', 'target'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  })

  return (
    <div
      className={cn(
        'prose prose-lg max-w-none',
        'prose-headings:text-gray-900 prose-headings:font-bold',
        'prose-p:text-gray-800 prose-p:leading-relaxed prose-p:mb-4',
        'prose-a:text-blue-600 prose-a:hover:text-blue-800 prose-a:underline',
        'prose-strong:text-gray-900 prose-strong:font-semibold',
        'prose-em:text-gray-800 prose-em:italic',
        'prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4',
        'prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4',
        'prose-li:mb-1',
        'prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700',
        'prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm',
        'prose-pre:bg-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto',
        // Estilos para embeds de vídeo
        '[&_.video-embed]:my-6 [&_.video-embed]:mx-auto [&_.video-embed]:max-w-full',
        '[&_.youtube-embed]:aspect-video',
        '[&_.instagram-embed]:max-w-lg [&_.instagram-embed]:mx-auto',
        '[&_.tiktok-embed]:max-w-sm [&_.tiktok-embed]:mx-auto',
        // Estilos para imagens
        '[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:shadow-sm',
        centerImages && '[&_img]:mx-auto [&_img]:block',
        className
      )}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  )
}

// Hook para carregar scripts de embed externos
export function useEmbedScripts() {
  React.useEffect(() => {
    // Verificação segura para SSR
    if (typeof document === 'undefined' || !document.createElement || !document.body) {
      return
    }

    // Carregar script do Instagram
    if (!document.querySelector('script[src*="instagram.com/embed.js"]')) {
      const instagramScript = document.createElement('script')
      instagramScript.src = '//www.instagram.com/embed.js'
      instagramScript.async = true
      document.body.appendChild(instagramScript)
    }

    // Carregar script do TikTok
    if (!document.querySelector('script[src*="tiktok.com/embed.js"]')) {
      const tiktokScript = document.createElement('script')
      tiktokScript.src = 'https://www.tiktok.com/embed.js'
      tiktokScript.async = true
      document.body.appendChild(tiktokScript)
    }
  }, [])
}
