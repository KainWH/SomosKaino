"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Send, ImagePlus, Mic, MicOff, Camera } from "lucide-react"

export default function MessageInput({ conversationId }: { conversationId: string }) {
  const [text, setText]               = useState("")
  const [sending, setSending]         = useState(false)
  const [recording, setRecording]     = useState(false)
  const [recordingSecs, setRecordingSecs] = useState(0)
  const router          = useRouter()
  const textareaRef     = useRef<HTMLTextAreaElement>(null)
  const fileInputRef    = useRef<HTMLInputElement>(null)
  const cameraInputRef  = useRef<HTMLInputElement>(null)
  const mediaRecorder   = useRef<MediaRecorder | null>(null)
  const audioChunks     = useRef<Blob[]>([])
  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null)

  async function handleSend() {
    if (!text.trim() || sending) return
    setSending(true)
    const res = await fetch(`/api/conversations/${conversationId}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text.trim() }),
    })
    if (res.ok) { setText(""); router.refresh() }
    setSending(false)
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSending(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", "image")
    const res = await fetch(`/api/conversations/${conversationId}/send-media`, { method: "POST", body: formData })
    if (res.ok) router.refresh()
    else alert("Error al enviar la imagen")
    e.target.value = ""
    setSending(false)
  }

  function getBestMimeType() {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ]
    return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? ""
  }

  async function toggleRecording() {
    if (recording) {
      // Detener
      mediaRecorder.current?.stop()
      if (timerRef.current) clearInterval(timerRef.current)
      setRecording(false)
      setRecordingSecs(0)
      return
    }

    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = getBestMimeType()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorder.current = recorder
      audioChunks.current   = []

      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.current.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        setSending(true)
        const blob     = new Blob(audioChunks.current, { type: mimeType || "audio/ogg" })
        const ext      = mimeType.includes("mp4") ? "m4a" : "ogg"
        const formData = new FormData()
        formData.append("file", blob, `voice.${ext}`)
        formData.append("type", "audio")
        const res = await fetch(`/api/conversations/${conversationId}/send-media`, { method: "POST", body: formData })
        if (res.ok) router.refresh()
        else alert("Error al enviar la nota de voz")
        setSending(false)
      }

      recorder.start(250)
      setRecording(true)
      setRecordingSecs(0)
      timerRef.current = setInterval(() => setRecordingSecs((s) => s + 1), 1000)
    } catch {
      alert("No se pudo acceder al micrófono")
    }
  }

  function formatSecs(s: number) {
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
  }

  return (
    <div className="flex items-end gap-2 px-3 py-3 bg-slate-900/80 backdrop-blur-md border-t border-slate-800/60 shrink-0">

      {/* Inputs de archivo ocultos */}
      <input ref={fileInputRef}   type="file" accept="image/*"          className="hidden" onChange={handleFileChange} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

      {/* Botones de adjuntos — solo cuando no está grabando */}
      {!recording && (
        <>
          {/* Galería */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            title="Enviar imagen de galería"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-all disabled:opacity-40 shrink-0"
          >
            <ImagePlus size={18} />
          </button>

          {/* Cámara (mobile) */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={sending}
            title="Tomar foto"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-all disabled:opacity-40 shrink-0 md:hidden"
          >
            <Camera size={18} />
          </button>
        </>
      )}

      {/* Textarea / indicador de grabación */}
      {recording ? (
        <div className="flex-1 flex items-center gap-3 bg-slate-800/60 border border-red-500/30 rounded-2xl px-4 py-2.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
          <span className="text-sm text-red-400 font-medium">Grabando…</span>
          <span className="text-sm text-slate-400 tabular-nums ml-auto">{formatSecs(recordingSecs)}</span>
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          rows={1}
          disabled={sending}
          className="flex-1 resize-none bg-slate-800/60 border border-slate-700/40 rounded-2xl px-4 py-2.5
            text-sm text-slate-200 placeholder-slate-600
            focus:outline-none focus:ring-1 focus:ring-green-500/40 focus:border-green-500/40
            max-h-32 leading-relaxed disabled:opacity-50 transition-all"
          style={{ minHeight: "42px" }}
        />
      )}

      {/* Micrófono (tap para iniciar/detener) — solo cuando no hay texto */}
      {!text.trim() && (
        <button
          onClick={toggleRecording}
          disabled={sending}
          title={recording ? "Detener grabación" : "Grabar nota de voz"}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shrink-0 disabled:opacity-40 ${
            recording
              ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
              : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"
          }`}
        >
          {recording ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
      )}

      {/* Enviar texto */}
      {text.trim() && (
        <button
          onClick={handleSend}
          disabled={sending}
          className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-40 shadow-lg shadow-green-500/20 shrink-0"
        >
          {sending ? <span className="text-xs font-bold">...</span> : <Send size={16} />}
        </button>
      )}
    </div>
  )
}
