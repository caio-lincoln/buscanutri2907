import { NextApiRequest, NextApiResponse } from 'next'
import { Server as HTTPServer } from 'http'
import { Socket as NetSocket } from 'net'
import { Server as SocketIOServer } from 'socket.io'
import { initializeSocketServer } from '@/lib/socket-server'

interface SocketServer extends HTTPServer {
  io?: SocketIOServer
}

interface SocketWithIO extends NetSocket {
  server: SocketServer
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponseWithSocket
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Check if Socket.IO server is already initialized
    if (res.socket.server.io) {
      console.log('Socket.IO server already initialized')
      return res.status(200).json({
        success: true,
        message: 'Socket.IO server already running',
        socketPath: '/api/socket'
      })
    }

    console.log('Initializing Socket.IO server...')
    
    // Initialize Socket.IO server
    const io = initializeSocketServer(res.socket.server)
    res.socket.server.io = io

    console.log('Socket.IO server initialized successfully')

    res.status(200).json({
      success: true,
      message: 'Socket.IO server initialized',
      socketPath: '/api/socket'
    })

  } catch (error) {
    console.error('Error initializing Socket.IO server:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to initialize Socket.IO server',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Disable body parsing for this API route
export const config = {
  api: {
    bodyParser: false,
  },
}
