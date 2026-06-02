'use client'

import { useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X } from '@phosphor-icons/react'

import type { VideoItem } from './content'

// ---------------------------------------------------------------------------
// Video embed by channel
// ---------------------------------------------------------------------------

function getEmbedUrl(video: VideoItem): string {
  switch (video.channel) {
    case 'youtube':
      return `https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0`
    case 'rutube':
      return `https://rutube.ru/play/embed/${video.videoId}?autoplay=1`
    case 'vkvideo':
      return `https://vk.com/video_ext.php?oid=-210700304&id=${video.videoId}&autoplay=1`
    default:
      return ''
  }
}

// ---------------------------------------------------------------------------
// Channel icon components
// ---------------------------------------------------------------------------

function YoutubeIcon() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
      <svg viewBox="0 0 24 17" fill="#EF4444" className="h-4 w-5" aria-hidden="true">
        <path d="M23.49 3.6c-.3-1.1-1.2-1.97-2.3-2.27C19.4.96 12 1 12 1S4.6.96 2.81 1.33C1.7 1.63.8 2.5.5 3.6-.08 4.96 0 9 0 9s.08 4.4 2.81 5.4C4.6 15.04 12 15 12 15s6.4.04 8.19-1.6C23.92 13.4 24 9 24 9s-.08-4.04-.51-5.4zM9.6 12.5V4.5l7.5 4-7.5 4z"/>
      </svg>
    </div>
  )
}

function RutubeIcon() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-blue-500/20">
      <svg viewBox="0 0 24 24" fill="#3B82F6" className="h-4 w-4" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 13.19-4.53 2.39c-.7.37-1.28-.08-1.28-.99V9.4c0-.91.58-1.36 1.28-.99l4.53 2.39c.7.37.7 1.28 0 1.65v-.01z"/>
      </svg>
    </div>
  )
}

function VkIcon() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-blue-500/20">
      <svg viewBox="0 0 28 16" fill="#3B82F6" className="h-4 w-5" aria-hidden="true">
        <path d="M19.959 11.159c.011-.003.021-.006.033-.006.338 0 .675-.002 1.011.001.17.002.346.021.466.116.14.11.169.269.169.438 0 .375-.001.75 0 1.124.002.195-.055.416-.179.555-.118.132-.313.183-.492.183-.81.001-1.621.001-2.431 0-.309-.001-.512-.171-.65-.451-.166-.334-.296-.688-.296-1.07-.001-.936.002-1.872 0-2.808 0-.183-.021-.385-.113-.533-.103-.168-.289-.248-.487-.248-.195 0-.391.001-.586 0-.121-.001-.264.05-.355.133-.1.091-.129.224-.129.349 0 .365-.002.73 0 1.095.001.154.037.318.126.449.093.137.238.206.404.206.31.002.62.001.93 0 .158 0 .31-.038.422-.144.138-.132.136-.328.136-.509 0-.4.002-.8-.001-1.2-.002-.217-.059-.437-.191-.602-.128-.158-.322-.236-.533-.236-.374-.002-.748-.001-1.122 0-.19.001-.396.046-.554.149-.154.1-.262.252-.262.439-.002.375 0 .75 0 1.124v.186z"/>
      </svg>
    </div>
  )
}

function ChannelIcon({ channel }: { channel: VideoItem['channel'] }) {
  switch (channel) {
    case 'youtube':
      return <YoutubeIcon />
    case 'rutube':
      return <RutubeIcon />
    case 'vkvideo':
      return <VkIcon />
    default:
      return null
  }
}

function getChannelName(channel: VideoItem['channel']): string {
  switch (channel) {
    case 'youtube':
      return 'YouTube'
    case 'rutube':
      return 'RuTube'
    case 'vkvideo':
      return 'VK Видео'
    default:
      return ''
  }
}

// ---------------------------------------------------------------------------
// Dialog
// ---------------------------------------------------------------------------

export function ContentVideoDialog({
  video,
  onClose,
}: {
  video: VideoItem | null
  onClose: () => void
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Lock body scroll while dialog is open
  useEffect(() => {
    if (video) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [video])

  // Focus close button when dialog opens
  useEffect(() => {
    if (video && closeButtonRef.current) {
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [video])

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose],
  )

  return (
    <AnimatePresence>
      {video && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-label={`Видео: ${video.title}`}
        >
          {/* Gradient overlays for depth */}
          <div className="absolute inset-0 bg-[#0F0B1E]/95 backdrop-blur-xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-violet-950/20 via-transparent to-indigo-950/20 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/10 via-transparent to-transparent pointer-events-none" />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.9, y: 32, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95, y: 16, filter: 'blur(4px)' }}
            transition={{
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1],
              scale: { duration: 0.35 },
              filter: { duration: 0.3 },
            }}
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(15, 11, 30, 0.98) 100%)',
              border: '1px solid rgba(167, 139, 250, 0.15)',
              boxShadow: '0 0 60px rgba(109, 40, 217, 0.25), 0 0 120px rgba(109, 40, 217, 0.1), 0 25px 50px -12px rgba(0, 0, 0, 0.6)',
            }}
          >
            {/* Inner glow border effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
            <div className="absolute inset-[1px] rounded-2xl bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />

            {/* Close button */}
            <motion.button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full text-white/60 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              aria-label="Закрыть"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300"
                style={{
                  background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
                  boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
                }}
                whileHover={{ opacity: 1 }}
              />
              <X weight="bold" className="relative z-10 h-5 w-5" />
            </motion.button>

            {/* Video info header */}
            <div className="relative px-6 pt-5 pb-0">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="flex items-start gap-4 pr-12"
              >
                {/* Channel icon */}
                <div className="mt-1 shrink-0">
                  <ChannelIcon channel={video.channel} />
                </div>

                <div>
                  <h2 className="font-display text-lg font-bold leading-tight tracking-tight text-white">
                    {video.title}
                  </h2>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 font-mono text-xs text-white/50">
                    <span className="flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-violet-400/60" />
                      {getChannelName(video.channel)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-white/30" />
                      {video.views} просмотров
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-white/30" />
                      {video.duration}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Video embed */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.35 }}
              className="relative mt-4 aspect-video w-full"
            >
              {/* Subtle glow behind video */}
              <div
                className="absolute inset-0 rounded-lg opacity-30 blur-xl -z-10"
                style={{
                  background: 'linear-gradient(135deg, rgba(109, 40, 217, 0.4) 0%, rgba(79, 70, 229, 0.2) 100%)',
                }}
              />
              <div
                className="h-full w-full overflow-hidden rounded-lg"
                style={{
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(109, 40, 217, 0.15)',
                }}
              >
                <iframe
                  src={getEmbedUrl(video)}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              </div>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
              className="relative px-6 pb-6 pt-4"
            >
              <div
                className="h-px w-full"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.3) 50%, transparent 100%)',
                }}
              />
              <p className="mt-4 text-sm leading-relaxed text-white/60">
                {video.description}
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
