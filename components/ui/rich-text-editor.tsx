'use client'

import React, { useCallback, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Youtube from '@tiptap/extension-youtube'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Youtube as YoutubeIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Type,
  Undo,
  Redo,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  imageUrl?: string
  onImageUrlChange?: (url: string) => void
  centerImage?: boolean
  onCenterImageChange?: (centered: boolean) => void
}

const MenuBar = ({ editor }: { editor: any }) => {
  const [linkUrl, setLinkUrl] = React.useState('')
  const [imageUrl, setImageUrl] = React.useState('')
  const [youtubeUrl, setYoutubeUrl] = React.useState('')
  const [showLinkInput, setShowLinkInput] = React.useState(false)
  const [showImageInput, setShowImageInput] = React.useState(false)
  const [showYoutubeInput, setShowYoutubeInput] = React.useState(false)

  if (!editor) {
    return null
  }

  const addLink = useCallback(() => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
      setLinkUrl('')
      setShowLinkInput(false)
    }
  }, [editor, linkUrl])

  const addImage = useCallback(() => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run()
      setImageUrl('')
      setShowImageInput(false)
    }
  }, [editor, imageUrl])

  const addYoutube = useCallback(() => {
    if (youtubeUrl) {
      editor.commands.setYoutubeVideo({
        src: youtubeUrl,
        width: 640,
        height: 480,
      })
      setYoutubeUrl('')
      setShowYoutubeInput(false)
    }
  }, [editor, youtubeUrl])

  const detectAndConvertLinks = useCallback((text: string) => {
    // Regex para detectar URLs de vídeo
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
    const instagramRegex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/
    const tiktokRegex = /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[^\/]+\/video\/(\d+)/

    if (youtubeRegex.test(text)) {
      const match = text.match(youtubeRegex)
      if (match) {
        const videoId = match[1]
        const embedUrl = `https://www.youtube.com/watch?v=${videoId}`
        editor.commands.setYoutubeVideo({
          src: embedUrl,
          width: 640,
          height: 480,
        })
        return true
      }
    }

    // Para Instagram e TikTok, por enquanto mantemos como links
    if (instagramRegex.test(text) || tiktokRegex.test(text)) {
      editor.chain().focus().setLink({ href: text }).run()
      return true
    }

    return false
  }, [editor])

  return (
    <div className="border-b border-gray-200 p-2 space-y-2">
      {/* Primeira linha - Formatação básica */}
      <div className="flex flex-wrap items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="h-8 w-8 p-0"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="h-8 w-8 p-0"
        >
          <Redo className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('bold') ? 'bg-gray-200' : ''
          )}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('italic') ? 'bg-gray-200' : ''
          )}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('strike') ? 'bg-gray-200' : ''
          )}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''
          )}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''
          )}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''
          )}
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('paragraph') ? 'bg-gray-200' : ''
          )}
        >
          <Type className="h-4 w-4" />
        </Button>
      </div>

      {/* Segunda linha - Listas e alinhamento */}
      <div className="flex flex-wrap items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('bulletList') ? 'bg-gray-200' : ''
          )}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('orderedList') ? 'bg-gray-200' : ''
          )}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('blockquote') ? 'bg-gray-200' : ''
          )}
        >
          <Quote className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''
          )}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''
          )}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''
          )}
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowLinkInput(!showLinkInput)}
          className="h-8 w-8 p-0"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowImageInput(!showImageInput)}
          className="h-8 w-8 p-0"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowYoutubeInput(!showYoutubeInput)}
          className="h-8 w-8 p-0"
        >
          <YoutubeIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Inputs condicionais */}
      {showLinkInput && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
          <Input
            type="url"
            placeholder="Cole o link aqui..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addLink()
              }
            }}
            className="flex-1"
          />
          <Button size="sm" onClick={addLink}>
            Adicionar
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowLinkInput(false)}>
            Cancelar
          </Button>
        </div>
      )}

      {showImageInput && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
          <Input
            type="url"
            placeholder="Cole a URL da imagem aqui..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addImage()
              }
            }}
            className="flex-1"
          />
          <Button size="sm" onClick={addImage}>
            Adicionar
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowImageInput(false)}>
            Cancelar
          </Button>
        </div>
      )}

      {showYoutubeInput && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
          <Input
            type="url"
            placeholder="Cole o link do YouTube aqui..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addYoutube()
              }
            }}
            className="flex-1"
          />
          <Button size="sm" onClick={addYoutube}>
            Adicionar
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowYoutubeInput(false)}>
            Cancelar
          </Button>
        </div>
      )}
    </div>
  )
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Comece a escrever...',
  className,
  imageUrl,
  onImageUrlChange,
  centerImage,
  onCenterImageChange,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Youtube.configure({
        controls: false,
        nocookie: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[200px] p-4',
      },
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData('text/plain')
        if (text) {
          // Detectar e converter links de vídeo automaticamente
          const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
          if (youtubeRegex.test(text)) {
            event.preventDefault()
            editor?.commands.setYoutubeVideo({
              src: text,
              width: 640,
              height: 480,
            })
            return true
          }
        }
        return false
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  return (
    <div className={cn('border border-gray-200 rounded-lg overflow-hidden', className)}>
      {/* Controles da imagem de capa */}
      {imageUrl && onImageUrlChange && onCenterImageChange && (
        <div className="p-4 bg-gray-50 border-b">
          <Label className="text-sm font-medium mb-2 block">Imagem de Capa</Label>
          <div className="space-y-3">
            <div className="relative">
              <img
                src={imageUrl}
                alt="Imagem de capa"
                className={cn(
                  'max-w-full h-auto rounded-lg border',
                  centerImage ? 'mx-auto block' : ''
                )}
                style={{ maxHeight: '200px' }}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="center-image"
                checked={centerImage}
                onCheckedChange={(checked) => onCenterImageChange(!!checked)}
              />
              <Label htmlFor="center-image" className="text-sm">
                Centralizar imagem de capa
              </Label>
            </div>
          </div>
        </div>
      )}

      <MenuBar editor={editor} />
      <EditorContent 
        editor={editor} 
        className="min-h-[300px] max-h-[600px] overflow-y-auto"
      />
      
      {/* Dica de uso */}
      <div className="p-2 bg-gray-50 border-t text-xs text-gray-600">
        <p>
          <strong>Dica:</strong> Cole links do YouTube, Instagram ou TikTok para incorporar vídeos automaticamente.
          Use Ctrl+B para negrito, Ctrl+I para itálico, Ctrl+Z para desfazer.
        </p>
      </div>
    </div>
  )
}