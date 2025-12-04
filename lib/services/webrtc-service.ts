import { io, Socket } from 'socket.io-client'

export interface WebRTCSignal {
  type: 'offer' | 'answer' | 'ice-candidate'
  data: any
  from_user_id: string
  to_user_id: string
  session_id: string
}

export interface MediaConstraints {
  video: boolean | MediaTrackConstraints
  audio: boolean | MediaTrackConstraints
}

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private socket: Socket | null = null
  private sessionId: string = ''
  private userId: string = ''
  private isInitiator: boolean = false

  // Event callbacks
  public onLocalStream?: (stream: MediaStream) => void
  public onRemoteStream?: (stream: MediaStream) => void
  public onConnectionStateChange?: (state: RTCPeerConnectionState) => void
  public onIceConnectionStateChange?: (state: RTCIceConnectionState) => void
  public onError?: (error: Error) => void

  private readonly configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  }

  constructor() {
    this.initializeSocket()
  }

  private initializeSocket() {
    try {
      // Initialize Socket.io connection
      this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin, {
        transports: ['websocket', 'polling'],
        upgrade: true,
      })

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id)
      })

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected')
      })

      this.socket.on('webrtc-signal', (signal: WebRTCSignal) => {
        this.handleWebRTCSignal(signal)
      })

      this.socket.on('user-joined', (data: { userId: string, sessionId: string }) => {
        console.log('User joined:', data)
        if (this.isInitiator && data.userId !== this.userId) {
          this.createOffer()
        }
      })

      this.socket.on('user-left', (data: { userId: string, sessionId: string }) => {
        console.log('User left:', data)
        this.handleUserLeft()
      })

    } catch (error) {
      console.error('Error initializing socket:', error)
      this.onError?.(error as Error)
    }
  }

  async initialize(sessionId: string, userId: string, isInitiator: boolean = false): Promise<void> {
    try {
      this.sessionId = sessionId
      this.userId = userId
      this.isInitiator = isInitiator

      // Join session room
      this.socket?.emit('join-session', { sessionId, userId })

      // Initialize peer connection
      await this.initializePeerConnection()

    } catch (error) {
      console.error('Error initializing WebRTC service:', error)
      this.onError?.(error as Error)
      throw error
    }
  }

  private async initializePeerConnection(): Promise<void> {
    try {
      this.peerConnection = new RTCPeerConnection(this.configuration)

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection?.connectionState
        console.log('Connection state changed:', state)
        if (state) {
          this.onConnectionStateChange?.(state)
        }
      }

      // Handle ICE connection state changes
      this.peerConnection.oniceconnectionstatechange = () => {
        const state = this.peerConnection?.iceConnectionState
        console.log('ICE connection state changed:', state)
        if (state) {
          this.onIceConnectionStateChange?.(state)
        }
      }

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendSignal({
            type: 'ice-candidate',
            data: event.candidate,
            from_user_id: this.userId,
            to_user_id: '', // Will be set by server
            session_id: this.sessionId,
          })
        }
      }

      // Handle remote stream
      this.peerConnection.ontrack = (event) => {
        console.log('Received remote track:', event)
        const [remoteStream] = event.streams
        this.remoteStream = remoteStream
        this.onRemoteStream?.(remoteStream)
      }

    } catch (error) {
      console.error('Error initializing peer connection:', error)
      this.onError?.(error as Error)
      throw error
    }
  }

  async getUserMedia(constraints: MediaConstraints = { video: true, audio: true }): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      this.localStream = stream
      
      // Add tracks to peer connection
      if (this.peerConnection) {
        stream.getTracks().forEach(track => {
          this.peerConnection?.addTrack(track, stream)
        })
      }

      this.onLocalStream?.(stream)
      return stream

    } catch (error) {
      console.error('Error getting user media:', error)
      this.onError?.(error as Error)
      throw error
    }
  }

  async createOffer(): Promise<void> {
    try {
      if (!this.peerConnection) {
        throw new Error('Peer connection not initialized')
      }

      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      })

      await this.peerConnection.setLocalDescription(offer)

      this.sendSignal({
        type: 'offer',
        data: offer,
        from_user_id: this.userId,
        to_user_id: '', // Will be set by server
        session_id: this.sessionId,
      })

    } catch (error) {
      console.error('Error creating offer:', error)
      this.onError?.(error as Error)
      throw error
    }
  }

  async createAnswer(offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      if (!this.peerConnection) {
        throw new Error('Peer connection not initialized')
      }

      await this.peerConnection.setRemoteDescription(offer)

      const answer = await this.peerConnection.createAnswer()
      await this.peerConnection.setLocalDescription(answer)

      this.sendSignal({
        type: 'answer',
        data: answer,
        from_user_id: this.userId,
        to_user_id: '', // Will be set by server
        session_id: this.sessionId,
      })

    } catch (error) {
      console.error('Error creating answer:', error)
      this.onError?.(error as Error)
      throw error
    }
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      if (!this.peerConnection) {
        throw new Error('Peer connection not initialized')
      }

      await this.peerConnection.setRemoteDescription(answer)

    } catch (error) {
      console.error('Error handling answer:', error)
      this.onError?.(error as Error)
      throw error
    }
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    try {
      if (!this.peerConnection) {
        throw new Error('Peer connection not initialized')
      }

      await this.peerConnection.addIceCandidate(candidate)

    } catch (error) {
      console.error('Error adding ICE candidate:', error)
      this.onError?.(error as Error)
    }
  }

  private async handleWebRTCSignal(signal: WebRTCSignal): Promise<void> {
    try {
      if (signal.session_id !== this.sessionId || signal.to_user_id === this.userId) {
        return // Ignore signals not for this session or from self
      }

      switch (signal.type) {
        case 'offer':
          await this.createAnswer(signal.data)
          break
        case 'answer':
          await this.handleAnswer(signal.data)
          break
        case 'ice-candidate':
          await this.addIceCandidate(signal.data)
          break
        default:
          console.warn('Unknown signal type:', signal.type)
      }

    } catch (error) {
      console.error('Error handling WebRTC signal:', error)
      this.onError?.(error as Error)
    }
  }

  private sendSignal(signal: WebRTCSignal): void {
    try {
      this.socket?.emit('webrtc-signal', signal)
    } catch (error) {
      console.error('Error sending signal:', error)
      this.onError?.(error as Error)
    }
  }

  toggleVideo(enabled?: boolean): boolean {
    if (!this.localStream) return false

    const videoTrack = this.localStream.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.enabled = enabled !== undefined ? enabled : !videoTrack.enabled
      return videoTrack.enabled
    }
    return false
  }

  toggleAudio(enabled?: boolean): boolean {
    if (!this.localStream) return false

    const audioTrack = this.localStream.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = enabled !== undefined ? enabled : !audioTrack.enabled
      return audioTrack.enabled
    }
    return false
  }

  isVideoEnabled(): boolean {
    if (!this.localStream) return false
    const videoTrack = this.localStream.getVideoTracks()[0]
    return videoTrack ? videoTrack.enabled : false
  }

  isAudioEnabled(): boolean {
    if (!this.localStream) return false
    const audioTrack = this.localStream.getAudioTracks()[0]
    return videoTrack ? audioTrack.enabled : false
  }

  getConnectionState(): RTCPeerConnectionState | null {
    return this.peerConnection?.connectionState || null
  }

  getIceConnectionState(): RTCIceConnectionState | null {
    return this.peerConnection?.iceConnectionState || null
  }

  private handleUserLeft(): void {
    // Handle when the other user leaves
    this.remoteStream = null
    this.onRemoteStream?.(null as any)
  }

  async switchCamera(): Promise<void> {
    try {
      if (!this.localStream) return

      const videoTrack = this.localStream.getVideoTracks()[0]
      if (!videoTrack) return

      // Get available video devices
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      if (videoDevices.length < 2) return // No camera to switch to

      // Find current device
      const currentDeviceId = videoTrack.getSettings().deviceId
      const currentIndex = videoDevices.findIndex(device => device.deviceId === currentDeviceId)
      const nextIndex = (currentIndex + 1) % videoDevices.length
      const nextDevice = videoDevices[nextIndex]

      // Stop current video track
      videoTrack.stop()

      // Get new video stream
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: nextDevice.deviceId },
        audio: false,
      })

      const newVideoTrack = newStream.getVideoTracks()[0]
      
      // Replace track in peer connection
      const sender = this.peerConnection?.getSenders().find(s => 
        s.track && s.track.kind === 'video'
      )
      
      if (sender) {
        await sender.replaceTrack(newVideoTrack)
      }

      // Update local stream
      this.localStream.removeTrack(videoTrack)
      this.localStream.addTrack(newVideoTrack)

      this.onLocalStream?.(this.localStream)

    } catch (error) {
      console.error('Error switching camera:', error)
      this.onError?.(error as Error)
    }
  }

  async startScreenShare(): Promise<void> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      })

      const videoTrack = screenStream.getVideoTracks()[0]
      
      // Replace video track in peer connection
      const sender = this.peerConnection?.getSenders().find(s => 
        s.track && s.track.kind === 'video'
      )
      
      if (sender) {
        await sender.replaceTrack(videoTrack)
      }

      // Handle screen share end
      videoTrack.onended = () => {
        this.stopScreenShare()
      }

    } catch (error) {
      console.error('Error starting screen share:', error)
      this.onError?.(error as Error)
    }
  }

  async stopScreenShare(): Promise<void> {
    try {
      if (!this.localStream) return

      // Get camera stream again
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      })

      const videoTrack = cameraStream.getVideoTracks()[0]
      
      // Replace track in peer connection
      const sender = this.peerConnection?.getSenders().find(s => 
        s.track && s.track.kind === 'video'
      )
      
      if (sender) {
        await sender.replaceTrack(videoTrack)
      }

      // Update local stream
      const oldVideoTrack = this.localStream.getVideoTracks()[0]
      if (oldVideoTrack) {
        this.localStream.removeTrack(oldVideoTrack)
        oldVideoTrack.stop()
      }
      
      this.localStream.addTrack(videoTrack)
      this.onLocalStream?.(this.localStream)

    } catch (error) {
      console.error('Error stopping screen share:', error)
      this.onError?.(error as Error)
    }
  }

  disconnect(): void {
    try {
      // Stop local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop())
        this.localStream = null
      }

      // Close peer connection
      if (this.peerConnection) {
        this.peerConnection.close()
        this.peerConnection = null
      }

      // Leave session room
      this.socket?.emit('leave-session', { sessionId: this.sessionId, userId: this.userId })

      // Disconnect socket
      if (this.socket) {
        this.socket.disconnect()
        this.socket = null
      }

      // Reset state
      this.remoteStream = null
      this.sessionId = ''
      this.userId = ''
      this.isInitiator = false

    } catch (error) {
      console.error('Error disconnecting:', error)
      this.onError?.(error as Error)
    }
  }

  // Getters
  get localMediaStream(): MediaStream | null {
    return this.localStream
  }

  get remoteMediaStream(): MediaStream | null {
    return this.remoteStream
  }

  get isConnected(): boolean {
    return this.peerConnection?.connectionState === 'connected'
  }
}

// Singleton instance
let webRTCServiceInstance: WebRTCService | null = null

export const getWebRTCService = (): WebRTCService => {
  if (!webRTCServiceInstance) {
    webRTCServiceInstance = new WebRTCService()
  }
  return webRTCServiceInstance
}

export const resetWebRTCService = (): void => {
  if (webRTCServiceInstance) {
    webRTCServiceInstance.disconnect()
    webRTCServiceInstance = null
  }
}
