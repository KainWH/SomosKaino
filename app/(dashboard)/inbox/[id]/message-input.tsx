"use client"

import { useState, useRef } from "react"

export default function MessageInput({ conversationId }: { conversationId: string }) {
  const [text, setText]       = useState("")
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
      // Realtime subscription in MessagesView will pick up the new message automatically
    }

    setSending(false)
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    // Enter sin Shift envía el mensaje
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex items-end gap-3 px-5 py-3 bg-white border-t flex-shrink-0">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Escribe un mensaje... (Enter para enviar)"
        rows={1}
        className="flex-1 resize-none border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 max-h-32 leading-relaxed"
        style={{ minHeight: "42px" }}
      />
      <button
        onClick={handleSend}
        disabled={!text.trim() || sending}
        className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors disabled:opacity-40 flex-shrink-0"
      >
        {sending ? (
          <span className="text-xs">...</span>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 rotate-90">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        )}
      </button>
    </div>
  )
}
