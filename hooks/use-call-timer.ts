import { useEffect, useRef, useState } from 'react'
import { useRoomContext } from '@livekit/components-react'
import { RoomEvent } from 'livekit-client'

export function useCallTimer(startedAtFromServer?: string | null) {
  const room = useRoomContext()
  const [seconds, setSeconds] = useState(0)

  const accRef = useRef(0)
  const startRef = useRef<number | null>(null)
  const tickRef = useRef<number | null>(null)

  useEffect(() => {
    if (startedAtFromServer) {
      const base = Math.max(
        0,
        Math.floor((Date.now() - new Date(startedAtFromServer).getTime()) / 1000),
      )
      accRef.current = base
      setSeconds(base)
    }
  }, [startedAtFromServer])

  const start = () => {
    if (startRef.current !== null) return
    startRef.current = Date.now()
    tickRef.current = window.setInterval(() => {
      const elapsed =
        accRef.current +
        Math.floor((Date.now() - (startRef.current as number)) / 1000)
      setSeconds(elapsed)
    }, 1000)
  }

  const stop = () => {
    if (startRef.current === null) return
    accRef.current += Math.floor((Date.now() - startRef.current) / 1000)
    startRef.current = null
    if (tickRef.current) {
      clearInterval(tickRef.current)
      tickRef.current = null
    }
    setSeconds(accRef.current)
  }

  useEffect(() => {
    const handle = (state: any) => {
      if (state === 'connected') start()
      else if (state === 'reconnecting' || state === 'disconnected') stop()
    }
    // estado atual + listeners
    handle(room.state)
    room.on(RoomEvent.ConnectionStateChanged, handle)
    return () => {
      room.off(RoomEvent.ConnectionStateChanged, handle)
      stop()
    }
  }, [room])

  const label =
    seconds >= 3600
      ? new Date(seconds * 1000).toISOString().substring(11, 19)
      : new Date(seconds * 1000).toISOString().substring(14, 19)

  return { seconds, label }
}
