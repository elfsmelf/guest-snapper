"use client"

import { useRef, useState, useEffect } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDuration } from "@/lib/video-utils"

interface VideoPlayerProps {
  src: string
  poster?: string
  className?: string
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
  controls?: boolean
  preload?: "none" | "metadata" | "auto"
  playsInline?: boolean
}

export function VideoPlayer({
  src,
  poster,
  className,
  autoPlay = false,
  muted = false,
  loop = false,
  controls = true,
  preload = "metadata",
  playsInline = true,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(muted)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const hideControlsTimeout = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleDurationChange = () => setDuration(video.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("durationchange", handleDurationChange)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("ended", handleEnded)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("durationchange", handleDurationChange)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("ended", handleEnded)
    }
  }, [])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        videoRef.current.requestFullscreen()
      }
    }
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current)
    }
    hideControlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 2000)
  }

  const handleMouseLeave = () => {
    if (isPlaying) {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current)
      }
      hideControlsTimeout.current = setTimeout(() => {
        setShowControls(false)
      }, 500)
    }
  }

  // Simple controls with native fallback
  if (!controls) {
    return (
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className={cn("w-full h-full object-contain", className)}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        preload={preload}
        playsInline={playsInline}
      />
    )
  }

  return (
    <div
      className={cn("relative w-full h-full bg-black group", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        autoPlay={autoPlay}
        muted={isMuted}
        loop={loop}
        preload={preload}
        playsInline={playsInline}
        onClick={togglePlay}
      />

      {/* Play button overlay (center) */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
          aria-label="Play video"
        >
          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
            <Play className="w-8 h-8 text-black ml-1" fill="currentColor" />
          </div>
        </button>
      )}

      {/* Custom controls */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 transition-opacity duration-300",
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Progress bar */}
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 mb-2 bg-white/30 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, white 0%, white ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) 100%)`
          }}
        />

        {/* Control buttons */}
        <div className="flex items-center gap-2 text-white">
          <button
            onClick={togglePlay}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" fill="currentColor" />
            ) : (
              <Play className="w-5 h-5" fill="currentColor" />
            )}
          </button>

          <button
            onClick={toggleMute}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>

          <span className="text-sm font-medium ml-1">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </span>

          <div className="flex-1" />

          <button
            onClick={toggleFullscreen}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
            aria-label="Fullscreen"
          >
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Lightweight video thumbnail component that lazy-loads the player on click
 */
interface VideoThumbnailProps {
  src: string
  thumbnail?: string
  duration?: number
  className?: string
  onClick?: () => void
}

export function VideoThumbnail({
  src,
  thumbnail,
  duration,
  className,
  onClick,
}: VideoThumbnailProps) {
  const [showPlayer, setShowPlayer] = useState(false)

  const handleClick = () => {
    setShowPlayer(true)
    onClick?.()
  }

  if (showPlayer) {
    return (
      <VideoPlayer
        src={src}
        poster={thumbnail}
        className={className}
        autoPlay
        preload="auto"
      />
    )
  }

  return (
    <div
      className={cn("relative cursor-pointer group", className)}
      onClick={handleClick}
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt="Video thumbnail"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gray-900 flex items-center justify-center">
          <Play className="w-12 h-12 text-white/60" />
        </div>
      )}

      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <Play className="w-8 h-8 text-black ml-1" fill="currentColor" />
        </div>
      </div>

      {/* Duration badge */}
      {duration !== undefined && duration > 0 && (
        <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs font-medium px-1.5 py-0.5 rounded">
          {formatDuration(duration)}
        </div>
      )}
    </div>
  )
}
