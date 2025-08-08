import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { BlogViewsService, BlogPostViewStats } from '@/lib/blog-views-service';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeBlogViewsProps {
  blogPostId: string;
  initialStats?: BlogPostViewStats;
}

export function useRealtimeBlogViews({ 
  blogPostId, 
  initialStats 
}: UseRealtimeBlogViewsProps) {
  const [stats, setStats] = useState<BlogPostViewStats>(
    initialStats || {
      totalViews: 0,
      uniqueViews: 0,
      lastViewAt: null
    }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const hasRecordedView = useRef(false);

  // Carregar estatísticas iniciais
  const loadInitialStats = useCallback(async () => {
    if (initialStats) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const viewStats = await BlogViewsService.getViewStats(blogPostId);
      setStats(viewStats);
    } catch (err) {
      console.error('Erro ao carregar estatísticas iniciais:', err);
      setError('Erro ao carregar estatísticas de visualização');
    } finally {
      setIsLoading(false);
    }
  }, [blogPostId, initialStats]);

  // Registrar uma nova visualização
  const recordView = useCallback(async (viewerId?: string) => {
    if (hasRecordedView.current) return;
    
    try {
      hasRecordedView.current = true;
      const updatedStats = await BlogViewsService.recordView(
        blogPostId,
        viewerId,
        undefined, // IP será obtido no backend se necessário
        navigator.userAgent
      );
      setStats(updatedStats);
    } catch (err) {
      console.error('Erro ao registrar visualização:', err);
      hasRecordedView.current = false;
    }
  }, [blogPostId]);

  // Atualizar estatísticas manualmente
  const refreshStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const viewStats = await BlogViewsService.getViewStats(blogPostId);
      setStats(viewStats);
    } catch (err) {
      console.error('Erro ao atualizar estatísticas:', err);
      setError('Erro ao atualizar estatísticas');
    } finally {
      setIsLoading(false);
    }
  }, [blogPostId]);

  // Configurar Realtime
  useEffect(() => {
    if (!blogPostId) return;

    // Carregar estatísticas iniciais
    loadInitialStats();

    // Configurar canal Realtime
    const channel = supabase
      .channel(`blog_post_views:${blogPostId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'blog_post_views',
          filter: `blog_post_id=eq.${blogPostId}`
        },
        async (payload) => {
          console.log('Nova visualização recebida:', payload);
          
          // Atualizar estatísticas quando uma nova visualização é inserida
          try {
            const updatedStats = await BlogViewsService.getViewStats(blogPostId);
            setStats(updatedStats);
          } catch (err) {
            console.error('Erro ao atualizar estatísticas em tempo real:', err);
          }
        }
      )
      .subscribe((status) => {
        console.log('Status do canal Realtime para blog views:', status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [blogPostId, loadInitialStats]);

  return {
    stats,
    isLoading,
    error,
    recordView,
    refreshStats
  };
}

// Hook para múltiplos blog posts
interface UseRealtimeBlogViewsBulkProps {
  blogPostIds: string[];
}

export function useRealtimeBlogViewsBulk({ blogPostIds }: UseRealtimeBlogViewsBulkProps) {
  const [statsMap, setStatsMap] = useState<Record<string, BlogPostViewStats>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Carregar estatísticas iniciais para todos os posts
  const loadInitialStats = useCallback(async () => {
    if (blogPostIds.length === 0) return;
    
    try {
      setIsLoading(true);
      setError(null);
      // Temporariamente desabilitado para evitar erros
      // const bulkStats = await BlogViewsService.getBulkViewStats(blogPostIds);
      // setStatsMap(bulkStats);
      
      // Inicializar com estatísticas vazias
      const emptyStats: Record<string, BlogPostViewStats> = {};
      blogPostIds.forEach(id => {
        emptyStats[id] = {
          totalViews: 0,
          uniqueViews: 0,
          lastViewAt: null
        };
      });
      setStatsMap(emptyStats);
    } catch (err) {
      console.error('Erro ao carregar estatísticas em lote:', err);
      setError('Erro ao carregar estatísticas de visualização');
    } finally {
      setIsLoading(false);
    }
  }, [blogPostIds]);

  // Atualizar estatísticas manualmente
  const refreshStats = useCallback(async () => {
    if (blogPostIds.length === 0) return;
    
    try {
      setIsLoading(true);
      setError(null);
      // Temporariamente usar o serviço de teste
      const bulkStats = await BlogViewsService.getBulkViewStats(blogPostIds);
      setStatsMap(bulkStats);
    } catch (err) {
      console.error('Erro ao atualizar estatísticas:', err);
      setError('Erro ao atualizar estatísticas');
    } finally {
      setIsLoading(false);
    }
  }, [blogPostIds]);

  // Configurar Realtime para todos os posts
  useEffect(() => {
    if (blogPostIds.length === 0) return;

    // Carregar estatísticas iniciais
    loadInitialStats();

    // Configurar canal Realtime para todos os posts
    const channel = supabase
      .channel('blog_post_views:bulk')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'blog_post_views'
        },
        async (payload) => {
          const newView = payload.new as any;
          
          // Verificar se a visualização é de um dos posts que estamos monitorando
          if (blogPostIds.includes(newView.blog_post_id)) {
            console.log('Nova visualização recebida para post monitorado:', newView);
            
            // Atualizar apenas as estatísticas do post específico
            try {
              const updatedStats = await BlogViewsService.getViewStats(newView.blog_post_id);
              setStatsMap(prev => ({
                ...prev,
                [newView.blog_post_id]: updatedStats
              }));
            } catch (err) {
              console.error('Erro ao atualizar estatísticas em tempo real:', err);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Status do canal Realtime para blog views bulk:', status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [blogPostIds, loadInitialStats]);

  return {
    statsMap,
    isLoading,
    error,
    refreshStats,
    getStatsForPost: (postId: string) => statsMap[postId] || { totalViews: 0, uniqueViews: 0, lastViewAt: null }
  };
}