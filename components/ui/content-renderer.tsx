'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import DOMPurify from 'dompurify'
import { marked } from 'marked'

interface ContentRendererProps {
  content: string
  className?: string
  centerImages?: boolean
}

// Config do parser Markdown
marked.setOptions({
  gfm: true,
  breaks: true,      // linha simples vira <br>
  headerIds: false,  // sem ids automáticos nos headings
  mangle: false,
})

/** Converte links de vídeo em embeds (após o Markdown virar HTML) */
function embedVideos(html: string): string {
  // YouTube – link sozinho no parágrafo ou <a> dentro do <p>
  const yt =
    /<p>\s*(?:<a[^>]*href="(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11}))"[^>]*>.*?<\/a>|(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})))\s*<\/p>/gi
  html = html.replace(yt, (_, url1, id1, url2, id2) => {
    const id = id1 || id2
    return `
      <div class="video-embed youtube-embed">
        <iframe
          src="https://www.youtube.com/embed/${id}"
          loading="lazy"
          referrerpolicy="no-referrer"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          class="w-full aspect-video rounded-lg"
        ></iframe>
      </div>`
  })

  // Instagram – link sozinho
  const ig =
    /<p>\s*(https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel)\/[A-Za-z0-9_-]+\/?)\s*<\/p>/gi
  html = html.replace(ig, (_, url) => {
    return `
      <div class="video-embed instagram-embed">
        <blockquote class="instagram-media" data-instgrm-permalink="${url}" data-instgrm-version="14">
          <a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">Ver post no Instagram</a>
        </blockquote>
      </div>`
  })

  // TikTok – link sozinho
  const tt =
    /<p>\s*(https?:\/\/(?:www\.)?tiktok\.com\/@[^\/]+\/video\/(\d+))\s*<\/p>/gi
  html = html.replace(tt, (__, url, id) => {
    return `
      <div class="video-embed tiktok-embed">
        <blockquote class="tiktok-embed" cite="${url}" data-video-id="${id}">
          <a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">Ver vídeo no TikTok</a>
        </blockquote>
      </div>`
  })

  return html
}

/** Centraliza e otimiza imagens */
function tweakImages(html: string, center = false): string {
  // adiciona loading/decoding
  html = html.replace(/<img([^>]*?)>/g, (_m, attrs) => {
    let a = attrs
    if (!/loading=/.test(a)) a += ' loading="lazy"'
    if (!/decoding=/.test(a)) a += ' decoding="async"'
    if (center) {
      if (/class=/.test(a)) {
        a = a.replace(/class="([^"]*)"/, 'class="$1 mx-auto block max-w-full h-auto rounded-lg"')
      } else {
        a += ' class="mx-auto block max-w-full h-auto rounded-lg"'
      }
    }
    return `<img${a}>`
  })
  return html
}

export function ContentRenderer({ content, className, centerImages = false }: ContentRendererProps) {
  // 1) Markdown -> HTML
  let html = marked.parse((content || '').trim()) as string

  // 2) Embeds
  html = embedVideos(html)

  // 3) Imagens
  html = tweakImages(html, centerImages)

  // 4) Sanitização
  html = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p','br','span','strong','em','u','a',
      'h1','h2','h3','h4','h5','h6',
      'ul','ol','li','blockquote','code','pre',
      'img','div','iframe'
    ],
    ALLOWED_ATTR: [
      'class','href','target','rel',
      'src','width','height','alt','loading','decoding',
      'frameborder','allow','allowfullscreen','referrerpolicy',
      'data-instgrm-permalink','data-instgrm-version',
      'cite','data-video-id'
    ],
  })

  return (
    <div
      className={cn(
        'prose prose-lg max-w-none whitespace-pre-wrap break-words',
        'prose-headings:text-gray-900 prose-headings:font-bold',
        'prose-p:text-gray-800 prose-p:leading-relaxed',
        'prose-pre:whitespace-pre-wrap prose-pre:break-words',
        'prose-a:text-blue-600 hover:prose-a:text-blue-800',
        'prose-ul:list-disc prose-ol:list-decimal',
        'prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic',
        // Embeds
        '[&_.video-embed]:my-6 [&_.video-embed]:mx-auto [&_.video-embed]:max-w-full',
        '[&_.youtube-embed]:aspect-video',
        '[&_.instagram-embed]:max-w-lg [&_.instagram-embed]:mx-auto',
        '[&_.tiktok-embed]:max-w-sm [&_.tiktok-embed]:mx-auto',
        // Imagens
        '[&_img]:w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:shadow-sm [&_img]:object-contain',
        centerImages && '[&_img]:mx-auto [&_img]:block',
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

/** Carrega os scripts de embed (chame no componente da página) */
export function useEmbedScripts() {
  React.useEffect(() => {
    if (typeof document === 'undefined') return
    if (!document.querySelector('script[src*="instagram.com/embed.js"]')) {
      const s = document.createElement('script')
      s.src = 'https://www.instagram.com/embed.js'
      s.async = true
      document.body.appendChild(s)
    }
    if (!document.querySelector('script[src*="tiktok.com/embed.js"]')) {
      const s = document.createElement('script')
      s.src = 'https://www.tiktok.com/embed.js'
      s.async = true
      document.body.appendChild(s)
    }
  }, [])
}
