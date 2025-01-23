"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ConversationSidebar } from "@/components/conversation-sidebar"
import { UserNav } from "@/components/user-nav"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
// import { assemblyAIService } from "@/services/assemblyai"

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
  audioContext: AudioContext | null
  analyzer: AnalyserNode | null
  dataArray: Uint8Array | null
  transcription: string | null
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
    error: null,
    audioContext: null,
    analyzer: null,
    dataArray: null,
    transcription: null
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameId = useRef<number>()

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

  const setupAudioVisualization = (stream: MediaStream) => {
    const audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(stream)
    const analyzer = audioContext.createAnalyser()
    
    analyzer.fftSize = 2048
    const bufferLength = analyzer.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    
    source.connect(analyzer)
    // Don't connect to destination to avoid feedback
    // analyzer.connect(audioContext.destination)
    
    setRecordingState(prev => ({
      ...prev,
      audioContext,
      analyzer,
      dataArray
    }))

    // Start the visualization loop
    startVisualization(analyzer, dataArray)
  }

  const startVisualization = (analyzer: AnalyserNode, dataArray: Uint8Array) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      const width = canvas.width
      const height = canvas.height
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height)
      
      // Get waveform data
      analyzer.getByteTimeDomainData(dataArray)
      
      // Draw waveform
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(147, 197, 253, 0.6)'
      ctx.lineWidth = 2

      const sliceWidth = width / dataArray.length
      let x = 0

      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0
        const y = (v * height) / 2

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }

        x += sliceWidth
      }

      ctx.lineTo(width, height / 2)
      ctx.stroke()

      // Draw volume level indicator
      analyzer.getByteFrequencyData(dataArray)
      const averageVolume = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length
      const normalizedVolume = averageVolume / 256
      
      // Draw circular volume indicator
      const centerX = width / 2
      const centerY = height / 2
      const maxRadius = Math.min(width, height) / 2
      const currentRadius = maxRadius * (0.8 + normalizedVolume * 0.2)
      
      ctx.beginPath()
      ctx.arc(centerX, centerY, currentRadius, 0, 2 * Math.PI)
      ctx.strokeStyle = `rgba(147, 197, 253, ${normalizedVolume})`
      ctx.lineWidth = 2
      ctx.stroke()

      animationFrameId.current = requestAnimationFrame(draw)
    }

    draw()
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const audioChunks: Blob[] = []

      // Set up audio visualization
      setupAudioVisualization(stream)

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
        error: null,
        audioContext: recordingState.audioContext,
        analyzer: recordingState.analyzer,
        dataArray: recordingState.dataArray,
        transcription: recordingState.transcription
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
      setAudioFeedback({ 
        message: "Processing your speech...", 
        isPlaying: true,
        isError: false 
      })

      // Upload audio to AssemblyAI
      const audioUrl = await assemblyAIService.uploadAudio(audioBlob)
      
      // Get transcription
      const transcription = await assemblyAIService.transcribeAudio(audioUrl)
      
      setRecordingState(prev => ({
        ...prev,
        transcription
      }))

      setAudioFeedback({ 
        message: "Transcription complete!", 
        isPlaying: true,
        isError: false 
      })

      // Display transcription for 3 seconds
      setTimeout(() => {
        setAudioFeedback({ 
          message: transcription, 
          isPlaying: true,
          isError: false 
        })
      }, 1500)

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
        
        // Clean up audio context
        if (recordingState.audioContext) {
          recordingState.audioContext.close()
        }
        
        // Cancel animation frame
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current)
        }

        setRecordingState(prev => ({ 
          ...prev, 
          isRecording: false,
          error: null,
          audioContext: null,
          analyzer: null,
          dataArray: null,
          transcription: null
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

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recordingState.audioContext) {
        recordingState.audioContext.close()
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [recordingState.audioContext])

  const orbStates = {
    idle: {
      scale: [1, 1.02, 1],
      rotate: 360,
    },
    listening: {
      scale: [1, 1.1, 1],
      rotate: [0, 180, 360],
    },
    processing: {
      scale: [1, 0.95, 1],
      rotate: [0, -180, -360],
    }
  }

  const getOrbState = () => {
    if (recordingState.isRecording) return "listening"
    if (audioFeedback.isPlaying && !audioFeedback.isError) return "processing"
    return "idle"
  }

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
            {/* Audio Visualization Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              width={window.innerWidth}
              height={window.innerHeight}
            />

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
                  className="absolute inset-0 rounded-full opacity-30 blur-3xl"
                  animate={{
                    opacity: recordingState.isRecording ? [0.4, 0.6, 0.4] : [0.2, 0.3, 0.2],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                  }}
                  style={{
                    background:
                      "radial-gradient(circle, rgba(147,197,253,0.3) 0%, rgba(186,230,253,0.2) 45%, rgba(96,165,250,0.1) 100%)",
                  }}
                />

                {/* Main orb */}
                <motion.div
                  className="absolute inset-0 rounded-full overflow-hidden backdrop-blur-sm"
                  animate={orbStates[getOrbState()]}
                  transition={{
                    duration: recordingState.isRecording ? 2 : 3,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                  style={{
                    background: `
                      radial-gradient(circle at 50% 50%, 
                        rgba(255, 255, 255, 0.9) 0%,
                        rgba(186, 230, 253, 0.7) 25%,
                        rgba(147, 197, 253, 0.6) 50%,
                        rgba(96, 165, 250, 0.5) 75%
                      )
                    `,
                    boxShadow: `
                      inset 0 0 60px rgba(255, 255, 255, 0.5),
                      inset 0 0 40px rgba(186, 230, 253, 0.4),
                      0 0 40px rgba(147, 197, 253, 0.3)
                    `,
                  }}
                >
                  {/* Dynamic wave effect */}
                  <motion.div
                    className="absolute inset-0"
                    animate={{
                      rotate: recordingState.isRecording ? [0, 360] : [-360, 0],
                      scale: recordingState.isRecording ? [1, 1.1, 1] : [1, 1.05, 1],
                    }}
                    transition={{
                      duration: recordingState.isRecording ? 3 : 4,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                    style={{
                      background: `
                        radial-gradient(circle at 30% 30%, transparent 0%, rgba(147, 197, 253, 0.4) 40%, transparent 60%),
                        radial-gradient(circle at 70% 70%, transparent 0%, rgba(186, 230, 253, 0.4) 40%, transparent 60%)
                      `,
                    }}
                  />

                  {/* Ethereal overlay */}
                  <motion.div
                    className="absolute inset-0"
                    animate={{
                      opacity: recordingState.isRecording ? [0.7, 0.9, 0.7] : [0.5, 0.7, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                    }}
                    style={{
                      background: `
                        linear-gradient(
                          135deg,
                          rgba(255, 255, 255, 0.4) 0%,
                          rgba(255, 255, 255, 0.2) 50%,
                          rgba(255, 255, 255, 0.1) 100%
                        )
                      `,
                      backdropFilter: "blur(4px)",
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

