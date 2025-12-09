import { Server as SocketIOServer, Socket } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { WebRTCSignal } from './services/webrtc-service'

export interface SessionRoom {
  sessionId: string
  participants: Map<string, SocketParticipant>
  createdAt: Date
}

export interface SocketParticipant {
  userId: string
  socketId: string
  joinedAt: Date
  isOnline: boolean
}

export interface ChatMessage {
  id: string
  sessionId: string
  userId: string
  message: string
  timestamp: Date
  type: 'text' | 'system'
}

class SocketManager {
  private io: SocketIOServer | null = null
  private sessions: Map<string, SessionRoom> = new Map()
  private userSockets: Map<string, string> = new Map() // userId -> socketId

  initialize(server: HTTPServer): SocketIOServer {
    if (this.io) {
      return this.io
    }

    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
    })

    this.setupEventHandlers()
    return this.io
  }

  private setupEventHandlers(): void {
    if (!this.io) return

    this.io.on('connection', (socket: Socket) => {

      // Join session
      socket.on('join-session', (data: { sessionId: string, userId: string }) => {
        this.handleJoinSession(socket, data)
      })

      // Leave session
      socket.on('leave-session', (data: { sessionId: string, userId: string }) => {
        this.handleLeaveSession(socket, data)
      })

      // WebRTC signaling
      socket.on('webrtc-signal', (signal: WebRTCSignal) => {
        this.handleWebRTCSignal(socket, signal)
      })

      // Chat messages
      socket.on('chat-message', (data: { sessionId: string, userId: string, message: string }) => {
        this.handleChatMessage(socket, data)
      })

      // Session status updates
      socket.on('session-status-update', (data: { sessionId: string, status: string, userId: string }) => {
        this.handleSessionStatusUpdate(socket, data)
      })

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket)
      })

      // Ping/Pong for connection health
      socket.on('ping', () => {
        socket.emit('pong')
      })
    })
  }

  private handleJoinSession(socket: Socket, data: { sessionId: string, userId: string }): void {
    try {
      const { sessionId, userId } = data
      
      // Join socket room
      socket.join(sessionId)
      socket.userId = userId
      socket.sessionId = sessionId

      // Update user socket mapping
      this.userSockets.set(userId, socket.id)

      // Get or create session
      let session = this.sessions.get(sessionId)
      if (!session) {
        session = {
          sessionId,
          participants: new Map(),
          createdAt: new Date()
        }
        this.sessions.set(sessionId, session)
      }

      // Add participant
      const participant: SocketParticipant = {
        userId,
        socketId: socket.id,
        joinedAt: new Date(),
        isOnline: true
      }
      
      session.participants.set(userId, participant)

      // Notify other participants
      socket.to(sessionId).emit('user-joined', {
        userId,
        sessionId,
        participantCount: session.participants.size
      })

      // Send current participants to new user
      const participants = Array.from(session.participants.values())
        .filter(p => p.userId !== userId)
        .map(p => ({ userId: p.userId, joinedAt: p.joinedAt }))

      socket.emit('session-participants', {
        sessionId,
        participants,
        participantCount: session.participants.size
      })

    } catch {
      socket.emit('error', { message: 'Failed to join session' })
    }
  }

  private handleLeaveSession(socket: Socket, data: { sessionId: string, userId: string }): void {
    try {
      const { sessionId, userId } = data
      
      // Leave socket room
      socket.leave(sessionId)

      // Remove from user socket mapping
      this.userSockets.delete(userId)

      // Update session
      const session = this.sessions.get(sessionId)
      if (session) {
        session.participants.delete(userId)
        
        // Notify other participants
        socket.to(sessionId).emit('user-left', {
          userId,
          sessionId,
          participantCount: session.participants.size
        })

        // Clean up empty sessions
        if (session.participants.size === 0) {
          this.sessions.delete(sessionId)
        }
      }

    } catch {}
  }

  private handleWebRTCSignal(socket: Socket, signal: WebRTCSignal): void {
    try {
      const { session_id, to_user_id, from_user_id } = signal
      
      // If to_user_id is specified, send to specific user
      if (to_user_id) {
        const targetSocketId = this.userSockets.get(to_user_id)
        if (targetSocketId) {
          this.io?.to(targetSocketId).emit('webrtc-signal', signal)
        }
      } else {
        // Broadcast to all other participants in the session
        socket.to(session_id).emit('webrtc-signal', signal)
      }

    } catch {
      socket.emit('error', { message: 'Failed to relay WebRTC signal' })
    }
  }

  private handleChatMessage(socket: Socket, data: { sessionId: string, userId: string, message: string }): void {
    try {
      const { sessionId, userId, message } = data
      
      const chatMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId,
        userId,
        message,
        timestamp: new Date(),
        type: 'text'
      }

      // Broadcast message to all participants in the session
      this.io?.to(sessionId).emit('chat-message', chatMessage)
    } catch {
      socket.emit('error', { message: 'Failed to send chat message' })
    }
  }

  private handleSessionStatusUpdate(socket: Socket, data: { sessionId: string, status: string, userId: string }): void {
    try {
      const { sessionId, status, userId } = data
      
      // Broadcast status update to all participants
      socket.to(sessionId).emit('session-status-update', {
        sessionId,
        status,
        userId,
        timestamp: new Date()
      })
    } catch {}
  }

  private handleDisconnect(socket: Socket): void {
    try {
      const userId = socket.userId
      const sessionId = socket.sessionId

      if (userId && sessionId) {
        // Handle as leave session
        this.handleLeaveSession(socket, { sessionId, userId })
      }

      // Clean up user socket mapping
      if (userId) {
        this.userSockets.delete(userId)
      }

    } catch {}
  }

  // Utility methods
  getSessionInfo(sessionId: string): SessionRoom | null {
    return this.sessions.get(sessionId) || null
  }

  getActiveSessionsCount(): number {
    return this.sessions.size
  }

  getTotalParticipants(): number {
    let total = 0
    this.sessions.forEach(session => {
      total += session.participants.size
    })
    return total
  }

  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId)
  }

  sendToUser(userId: string, event: string, data: unknown): boolean {
    const socketId = this.userSockets.get(userId)
    if (socketId && this.io) {
      this.io.to(socketId).emit(event, data)
      return true
    }
    return false
  }

  sendToSession(sessionId: string, event: string, data: unknown): boolean {
    if (this.io) {
      this.io.to(sessionId).emit(event, data)
      return true
    }
    return false
  }

  // Cleanup old sessions (call periodically)
  cleanupOldSessions(maxAgeMinutes: number = 60): void {
    const now = new Date()
    const maxAge = maxAgeMinutes * 60 * 1000

    this.sessions.forEach((session, sessionId) => {
      const age = now.getTime() - session.createdAt.getTime()
      if (age > maxAge && session.participants.size === 0) {
        this.sessions.delete(sessionId)
      }
    })
  }

  getServer(): SocketIOServer | null {
    return this.io
  }
}

// Singleton instance
let socketManager: SocketManager | null = null

export const getSocketManager = (): SocketManager => {
  if (!socketManager) {
    socketManager = new SocketManager()
  }
  return socketManager
}

export const initializeSocketServer = (server: HTTPServer): SocketIOServer => {
  const manager = getSocketManager()
  return manager.initialize(server)
}

// Cleanup function
setInterval(() => {
  if (socketManager) {
    socketManager.cleanupOldSessions()
  }
}, 5 * 60 * 1000) // Run every 5 minutes

export default SocketManager
