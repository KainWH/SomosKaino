"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Send, Image, Mic, MicOff } from "lucide-react"

export default function MessageInput({ conversationId }: { conversationId: string }) {
  const [text, setText]           = useState("")
  const [sending, setSending]     = useState(false)
  const [recording, setRecording] = useState(false)
  const router        = useRouter()
  const textareaRef   = useRef<HTMLTextAreaElement>(null)
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks   = useRef<Blob[]>([])

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

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
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

  async function startRecording() {
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/ogg"
      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorder.current = recorder
      audioChunks.current   = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.current.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        setSending(true)
        const blob = new Blob(audioChunks.current, { type: mimeType })
        const formData = new FormData()
        formData.append("file", blob, "voice.ogg")
        formData.append("type", "audio")
        const res = await fetch(`/api/conversations/${conversationId}/send-media`, { method: "POST", body: formData })
        if (res.ok) router.refresh()
        else alert("Error al enviar la nota de voz")
        setSending(false)
      }
      recorder.start()
      setRecording(true)
    } catch { alert("No se pudo acceder al micrófono") }
  }

  function stopRecording() { mediaRecorder.current?.stop(); setRecording(false) }

  return (
    <div className="flex items-end gap-2.5 px-4 py-3.5 bg-slate-900/80 backdrop-blur-md border-t border-slate-800/60 shrink-0">

      {/* Imagen */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={sending || recording}
        className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-all disabled:opacity-40 shrink-0"
      >
        <Image size={18} />
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Escribe un mensaje..."
        rows={1}
        disabled={recording || sending}
        className="flex-1 resize-none bg-slate-800/60 border border-slate-700/40 rounded-2xl px-4 py-2.5
          text-sm text-slate-200 placeholder-slate-600
          focus:outline-none focus:ring-1 focus:ring-green-500/40 focus:border-green-500/40
          max-h-32 leading-relaxed disabled:opacity-50 transition-all"
        style={{ minHeight: "42px" }}
      />

      {/* Micrófono */}
      {!text.trim() && (
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          disabled={sending}
          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shrink-0 disabled:opacity-40 ${
            recording
              ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
              : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"
          }`}
        >
          {recording ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
      )}

      {/* Enviar */}
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
