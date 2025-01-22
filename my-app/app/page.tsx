"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ConversationSidebar } from "@/components/conversation-sidebar"
import { UserNav } from "@/components/user-nav"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

interface AudioFeedback {
  message: string
  isPlaying: boolean
  isError?: boolean
}

interface RecordingState {
  isRecording: boolean
  mediaRecorder: MediaRecorder | null
  audioChunks: Blob[]
  error: string | null
}

const mockConversations = [
  {
    id: "1",
    date: new Date("2025-01-05"),
    preview: "Initial consultation and assessment",
  },
  {
    id: "2",
    date: new Date("2025-01-04"),
    preview: "Working on pronunciation exercises",
  },
  {
    id: "3",
    date: new Date("2025-01-03"),
    preview: "Breathing techniques practice",
  },
]

export default function VocalAITherapist() {
  const [isListening, setIsListening] = useState(false)
  const [audioFeedback, setAudioFeedback] = useState<AudioFeedback>({ 
    message: "", 
    isPlaying: false,
    isError: false 
  })
  const [selectedConversation, setSelectedConversation] = useState<string>()
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    mediaRecorder: null,
    audioChunks: [],
    error: null
  })

  const timeSliceMs = 1000 // Collect audio chunks every second

  const handleRecordingError = (error: string) => {
    setRecordingState(prev => ({ ...prev, error, isRecording: false }))
    setAudioFeedback({ 
      message: error, 
      isPlaying: true,
      isError: true 
    })
    setTimeout(() => {
      setAudioFeedback({ message: "", isPlaying: false, isError: false })
    }, 3000)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const audioChunks: Blob[] = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
          // Here we'll process the audio chunk in real-time
          processAudioChunk(event.data)
        }
      }

      mediaRecorder.onerror = (event) => {
        handleRecordingError("Recording failed. Please try again.")
        stopRecording()
      }

      mediaRecorder.onstop = () => {
        if (audioChunks.length === 0) {
          handleRecordingError("No audio data recorded. Please try again.")
          return
        }

        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
        processCompleteRecording(audioBlob)
      }

      // Start recording with timeslice for regular ondataavailable events
      mediaRecorder.start(timeSliceMs)
      
      setRecordingState({
        isRecording: true,
        mediaRecorder,
        audioChunks,
        error: null
      })
      setAudioFeedback({ 
        message: "I'm listening...", 
        isPlaying: true,
        isError: false 
      })

    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        handleRecordingError("Microphone access denied. Please enable microphone access.")
      } else if (error instanceof DOMException && error.name === 'NotFoundError') {
        handleRecordingError("No microphone found. Please connect a microphone.")
      } else {
        handleRecordingError("Failed to start recording. Please try again.")
        console.error('Recording error:', error)
      }
    }
  }

  const processAudioChunk = async (chunk: Blob) => {
    try {
      // Here we'll add real-time processing logic
      // For now, just log the chunk size
      console.log('Processing audio chunk:', chunk.size)
    } catch (error) {
      console.error('Error processing audio chunk:', error)
    }
  }

  const processCompleteRecording = async (audioBlob: Blob) => {
    try {
      // Here we'll add complete recording processing logic
      console.log('Processing complete recording:', audioBlob.size)
    } catch (error) {
      handleRecordingError("Failed to process recording. Please try again.")
      console.error('Error processing recording:', error)
    }
  }

  const stopRecording = () => {
    if (recordingState.mediaRecorder && recordingState.isRecording) {
      try {
        recordingState.mediaRecorder.stop()
        recordingState.mediaRecorder.stream.getTracks().forEach(track => track.stop())
        setRecordingState(prev => ({ 
          ...prev, 
          isRecording: false,
          error: null 
        }))
        simulateResponse()
      } catch (error) {
        handleRecordingError("Failed to stop recording. Please refresh the page.")
        console.error('Error stopping recording:', error)
      }
    }
  }

  const handleOrbClick = async () => {
    if (!recordingState.isRecording) {
      await startRecording()
    } else {
      stopRecording()
    }
  }

  const simulateResponse = () => {
    setTimeout(() => {
      const responses = [
        "Your pronunciation is getting clearer!",
        "Let's focus on your breathing rhythm.",
        "Great progress on controlling your speed.",
        "I notice improvement in your confidence.",
      ]
      const response = responses[Math.floor(Math.random() * responses.length)]
      setAudioFeedback({ message: response, isPlaying: true })

      setTimeout(() => {
        setAudioFeedback({ message: "", isPlaying: false })
        setIsListening(false)
      }, 3000)
    }, 3000)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingState.mediaRecorder && recordingState.isRecording) {
        recordingState.mediaRecorder.stop()
        recordingState.mediaRecorder.stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [recordingState.mediaRecorder, recordingState.isRecording])

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-screen w-full bg-black">
        <ConversationSidebar
          conversations={mockConversations}
          onSelect={setSelectedConversation}
          selectedId={selectedConversation}
        />
        <div className="flex-1 flex flex-col w-full">
          <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-black">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                <span className="text-xl text-zinc-100">Vocal</span>
              </div>
            </div>
            <UserNav />
          </header>
          <main className="flex-1 bg-black flex items-center justify-center relative overflow-hidden w-full">
            {/* Audio Feedback Indicator */}
            <AnimatePresence>
              {audioFeedback.isPlaying && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`absolute top-20 text-center text-lg mb-4 ${
                    audioFeedback.isError ? 'text-red-400' : 'text-zinc-100'
                  }`}
                >
                  {audioFeedback.message}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Interactive Orb */}
            <motion.div
              className="relative w-[300px] h-[300px]"
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              <motion.button
                onClick={handleOrbClick}
                className="relative group cursor-pointer w-full h-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Base glow */}
                <motion.div
                  className="absolute inset-0 rounded-full opacity-30 blur-2xl"
                  animate={{
                    opacity: isListening ? [0.2, 0.4, 0.2] : [0.1, 0.2, 0.1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                  }}
                  style={{
                    background:
                      "radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(186,230,253,0.2) 50%, rgba(147,197,253,0.2) 100%)",
                  }}
                />

                {/* Main orb */}
                <motion.div
                  className="absolute inset-0 rounded-full overflow-hidden backdrop-blur-sm"
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 20,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                  style={{
                    background: `
                      radial-gradient(circle at 30% 30%, 
                        rgba(255, 255, 255, 0.9) 0%,
                        rgba(186, 230, 253, 0.8) 20%,
                        rgba(147, 197, 253, 0.7) 40%,
                        rgba(249, 168, 212, 0.6) 60%,
                        rgba(96, 165, 250, 0.7) 80%
                      ),
                      radial-gradient(circle at 70% 70%, 
                        rgba(96, 165, 250, 0.8) 0%,
                        rgba(249, 168, 212, 0.7) 30%,
                        rgba(186, 230, 253, 0.8) 50%,
                        rgba(147, 197, 253, 0.7) 70%
                      )
                    `,
                    boxShadow: `
                      inset 0 0 50px rgba(255, 255, 255, 0.3),
                      inset 0 0 30px rgba(186, 230, 253, 0.3),
                      0 0 30px rgba(147, 197, 253, 0.2)
                    `,
                  }}
                >
                  {/* Spots effect */}
                  <motion.div
                    className="absolute inset-0"
                    animate={{
                      rotate: -360,
                    }}
                    transition={{
                      duration: 25,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                    style={{
                      background: `
                        radial-gradient(circle at 20% 20%, rgba(96, 165, 250, 0.7) 0%, transparent 20%),
                        radial-gradient(circle at 80% 80%, rgba(96, 165, 250, 0.7) 0%, transparent 20%),
                        radial-gradient(circle at 50% 50%, rgba(249, 168, 212, 0.5) 0%, transparent 30%),
                        radial-gradient(circle at 80% 20%, rgba(186, 230, 253, 0.6) 0%, transparent 20%),
                        radial-gradient(circle at 20% 80%, rgba(186, 230, 253, 0.6) 0%, transparent 20%)
                      `,
                    }}
                  />

                  {/* Glass effect overlay */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `
                        linear-gradient(
                          135deg,
                          rgba(255, 255, 255, 0.2) 0%,
                          rgba(255, 255, 255, 0.1) 40%,
                          rgba(255, 255, 255, 0) 100%
                        )
                      `,
                    }}
                  />
                </motion.div>
              </motion.button>
            </motion.div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

