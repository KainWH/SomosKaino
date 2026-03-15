"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"

export default function MessageInput({ conversationId }: { conversationId: string }) {
  const [text, setText]           = useState("")
  const [sending, setSending]     = useState(false)
  const [recording, setRecording] = useState(false)
  const router     = useRouter()
  const textareaRef   = useRef<HTMLTextAreaElement>(null)
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks   = useRef<Blob[]>([])

  // ── Enviar texto ──────────────────────────────────────────────
  async function handleSend() {
    if (!text.trim() || sending) return
    setSending(true)

    const res = await fetch(`/api/conversations/${conversationId}/send`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ message: text.trim() }),
    })

    if (res.ok) {
      setText("")
      router.refresh()
    }

    setSending(false)
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Enviar imagen ─────────────────────────────────────────────
  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setSending(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", "image")

    const res = await fetch(`/api/conversations/${conversationId}/send-media`, {
      method: "POST",
      body:   formData,
    })

    if (res.ok) router.refresh()
    else alert("Error al enviar la imagen")

    // Reset input para permitir subir la misma imagen otra vez
    e.target.value = ""
    setSending(false)
  }

  // ── Grabación de voz ──────────────────────────────────────────
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/ogg"

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorder.current = recorder
      audioChunks.current   = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(audioChunks.current, { type: mimeType })

        setSending(true)
        const formData = new FormData()
        formData.append("file", blob, "voice.ogg")
        formData.append("type", "audio")

        const res = await fetch(`/api/conversations/${conversationId}/send-media`, {
          method: "POST",
          body:   formData,
        })

        if (res.ok) router.refresh()
        else alert("Error al enviar la nota de voz")
        setSending(false)
      }

      recorder.start()
      setRecording(true)
    } catch {
      alert("No se pudo acceder al micrófono")
    }
  }

  function stopRecording() {
    mediaRecorder.current?.stop()
    setRecording(false)
  }

  // ── UI ────────────────────────────────────────────────────────
  return (
    <div className="flex items-end gap-2 px-4 py-3 bg-white border-t flex-shrink-0">

      {/* Botón imagen */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={sending || recording}
        title="Enviar imagen"
        className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 flex-shrink-0"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="M21 15l-5-5L5 21"/>
        </svg>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageChange}
      />

      {/* Texto */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Escribe un mensaje... (Enter para enviar)"
        rows={1}
        disabled={recording || sending}
        className="flex-1 resize-none border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 max-h-32 leading-relaxed disabled:opacity-50"
        style={{ minHeight: "42px" }}
      />

      {/* Botón micrófono / parar grabación */}
      {!text.trim() && (
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          disabled={sending}
          title={recording ? "Suelta para enviar" : "Mantén para grabar"}
          className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors flex-shrink-0 disabled:opacity-40 ${
            recording
              ? "bg-red-500 text-white animate-pulse"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          }`}
        >
          <svg viewBox="0 0 24 24" fill={recording ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
            <rect x="9" y="2" width="6" height="11" rx="3"/>
            <path d="M5 10a7 7 0 0014 0M12 19v3M8 22h8"/>
          </svg>
        </button>
      )}

      {/* Botón enviar texto */}
      {text.trim() && (
        <button
          onClick={handleSend}
          disabled={sending}
          className="w-9 h-9 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors disabled:opacity-40 flex-shrink-0"
        >
          {sending ? (
            <span className="text-xs">...</span>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 rotate-90">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          )}
        </button>
      )}

    </div>
  )
}
