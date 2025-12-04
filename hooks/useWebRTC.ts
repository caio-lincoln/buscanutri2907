import { useState, useEffect, useRef, useCallback } from 'react'
import { getWebRTCService, WebRTCService, MediaConstraints } from '@/lib/services/webrtc-service'

export interface UseWebRTCOptions {
  sessionId: string
  userId: string
  isInitiator?: boolean
  autoStart?: boolean
  mediaConstraints?: MediaConstraints
}

export interface UseWebRTCReturn {
  // Streams
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  
  // Connection state
  connectionState: RTCPeerConnectionState | null
  iceConnectionState: RTCIceConnectionState | null
  isConnected: boolean
  isConnecting: boolean
  
  // Media controls
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  
  // Actions
  startCall: () => Promise<void>
  endCall: () => void
  toggleVideo: (enabled?: boolean) => boolean
  toggleAudio: (enabled?: boolean) => boolean
  switchCamera: () => Promise<void>
  startScreenShare: () => Promise<void>
  stopScreenShare: () => Promise<void>
  
  // Error handling
  error: Error | null
  clearError: () => void
}

export const useWebRTC = (options: UseWebRTCOptions): UseWebRTCReturn => {
  const {
    sessionId,
    userId,
    isInitiator = false,
    autoStart = false,
    mediaConstraints = { video: true, audio: true }
  } = options

  // State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState | null>(null)
  const [iceConnectionState, setIceConnectionState] = useState<RTCIceConnectionState | null>(null)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  // Refs
  const webRTCServiceRef = useRef<WebRTCService | null>(null)
  const isInitializedRef = useRef(false)

  // Initialize WebRTC service
  useEffect(() => {
    if (!sessionId || !userId || isInitializedRef.current) return

    const initializeService = async () => {
      try {
        setIsConnecting(true)
        setError(null)

        const service = getWebRTCService()
        webRTCServiceRef.current = service

        // Set up event handlers
        service.onLocalStream = (stream: MediaStream) => {
          setLocalStream(stream)
          setIsVideoEnabled(service.isVideoEnabled())
          setIsAudioEnabled(service.isAudioEnabled())
        }

        service.onRemoteStream = (stream: MediaStream) => {
          setRemoteStream(stream)
        }

        service.onConnectionStateChange = (state: RTCPeerConnectionState) => {
          setConnectionState(state)
          if (state === 'connected') {
            setIsConnecting(false)
          } else if (state === 'failed' || state === 'disconnected') {
            setIsConnecting(false)
          }
        }

        service.onIceConnectionStateChange = (state: RTCIceConnectionState) => {
          setIceConnectionState(state)
        }

        service.onError = (err: Error) => {
          setError(err)
          setIsConnecting(false)
        }

        // Initialize the service
        await service.initialize(sessionId, userId, isInitiator)
        isInitializedRef.current = true

        // Auto start if enabled
        if (autoStart) {
          await startCall()
        }

      } catch (err) {
        setError(err as Error)
        setIsConnecting(false)
      }
    }

    initializeService()

    // Cleanup on unmount
    return () => {
      if (webRTCServiceRef.current) {
        webRTCServiceRef.current.disconnect()
        webRTCServiceRef.current = null
      }
      isInitializedRef.current = false
    }
  }, [sessionId, userId, isInitiator, autoStart])

  // Start call
  const startCall = useCallback(async () => {
    try {
      if (!webRTCServiceRef.current) {
        throw new Error('WebRTC service not initialized')
      }

      setIsConnecting(true)
      setError(null)

      // Get user media
      await webRTCServiceRef.current.getUserMedia(mediaConstraints)

      // If initiator, create offer
      if (isInitiator) {
        await webRTCServiceRef.current.createOffer()
      }

    } catch (err) {
      setError(err as Error)
      setIsConnecting(false)
    }
  }, [isInitiator, mediaConstraints])

  // End call
  const endCall = useCallback(() => {
    try {
      if (webRTCServiceRef.current) {
        webRTCServiceRef.current.disconnect()
      }
      
      // Reset state
      setLocalStream(null)
      setRemoteStream(null)
      setConnectionState(null)
      setIceConnectionState(null)
      setIsConnecting(false)
      setError(null)
      isInitializedRef.current = false
      
    } catch (err) {
      setError(err as Error)
    }
  }, [])

  // Toggle video
  const toggleVideo = useCallback((enabled?: boolean): boolean => {
    try {
      if (!webRTCServiceRef.current) return false
      
      const newState = webRTCServiceRef.current.toggleVideo(enabled)
      setIsVideoEnabled(newState)
      return newState
      
    } catch (err) {
      setError(err as Error)
      return false
    }
  }, [])

  // Toggle audio
  const toggleAudio = useCallback((enabled?: boolean): boolean => {
    try {
      if (!webRTCServiceRef.current) return false
      
      const newState = webRTCServiceRef.current.toggleAudio(enabled)
      setIsAudioEnabled(newState)
      return newState
      
    } catch (err) {
      setError(err as Error)
      return false
    }
  }, [])

  // Switch camera
  const switchCamera = useCallback(async () => {
    try {
      if (!webRTCServiceRef.current) return
      
      await webRTCServiceRef.current.switchCamera()
      
    } catch (err) {
      setError(err as Error)
    }
  }, [])

  // Start screen share
  const startScreenShare = useCallback(async () => {
    try {
      if (!webRTCServiceRef.current) return
      
      await webRTCServiceRef.current.startScreenShare()
      
    } catch (err) {
      setError(err as Error)
    }
  }, [])

  // Stop screen share
  const stopScreenShare = useCallback(async () => {
    try {
      if (!webRTCServiceRef.current) return
      
      await webRTCServiceRef.current.stopScreenShare()
      
    } catch (err) {
      setError(err as Error)
    }
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Computed values
  const isConnected = connectionState === 'connected'

  return {
    // Streams
    localStream,
    remoteStream,
    
    // Connection state
    connectionState,
    iceConnectionState,
    isConnected,
    isConnecting,
    
    // Media controls
    isVideoEnabled,
    isAudioEnabled,
    
    // Actions
    startCall,
    endCall,
    toggleVideo,
    toggleAudio,
    switchCamera,
    startScreenShare,
    stopScreenShare,
    
    // Error handling
    error,
    clearError,
  }
}

export default useWebRTC
