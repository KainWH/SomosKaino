"use client"

import { useState } from "react"
import type { KnowledgeDocument } from "@/types"

type Props = {
  documents: KnowledgeDocument[]
}

export default function DocumentsSource({ documents: initial }: Props) {
  const [docs, setDocs]         = useState<KnowledgeDocument[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<KnowledgeDocument | null>(null)
  const [name, setName]         = useState("")
  const [content, setContent]   = useState("")
  const [saving, setSaving]     = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const activeCount = docs.filter(d => d.enabled).length

  function openCreate() {
    setEditing(null)
    setName("")
    setContent("")
    setErrorMsg("")
    setShowForm(true)
  }

  function openEdit(doc: KnowledgeDocument) {
    setEditing(doc)
    setName(doc.name)
    setContent(doc.content)
    setErrorMsg("")
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditing(null)
    setName("")
    setContent("")
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrorMsg("")

    if (editing) {
      // UPDATE
      const res  = await fetch(`/api/knowledge/documents/${editing.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name, content }),
      })
      const data = await res.json()

      if (data.error) {
        setErrorMsg(data.error)
      } else {
        setDocs(prev => prev.map(d => d.id === editing.id ? data : d))
        cancelForm()
      }
    } else {
      // CREATE
      const res  = await fetch("/api/knowledge/documents", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name, content }),
      })
      const data = await res.json()

      if (data.error) {
        setErrorMsg(data.error)
      } else {
        setDocs(prev => [...prev, data])
        cancelForm()
      }
    }

    setSaving(false)
  }

  async function toggleEnabled(doc: KnowledgeDocument) {
    const res  = await fetch(`/api/knowledge/documents/${doc.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ enabled: !doc.enabled }),
    })
    const data = await res.json()
    if (!data.error) {
      setDocs(prev => prev.map(d => d.id === doc.id ? data : d))
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este documento? No se puede deshacer.")) return

    const res = await fetch(`/api/knowledge/documents/${id}`, { method: "DELETE" })
    if (res.ok) {
      setDocs(prev => prev.filter(d => d.id !== id))
    }
  }

  return (
    <section className="bg-white border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-lg">
            📄
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Documentos de Conocimiento</h2>
            <p className="text-xs text-gray-500">FAQ, precios, políticas, información personalizada</p>
          </div>
        </div>

        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
          activeCount > 0
            ? "bg-purple-50 text-purple-700 border border-purple-200"
            : "bg-gray-100 text-gray-500"
        }`}>
          {activeCount > 0 ? `${activeCount} activo${activeCount > 1 ? "s" : ""}` : "Sin documentos"}
        </span>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-4">

        {/* Lista de documentos */}
        {docs.length > 0 && (
          <div className="flex flex-col gap-2">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className={`border rounded-lg p-3 flex items-start gap-3 transition-colors ${
                  doc.enabled ? "bg-white" : "bg-gray-50 opacity-60"
                }`}
              >
                {/* Toggle */}
                <button
                  onClick={() => toggleEnabled(doc)}
                  className={`mt-0.5 relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                    doc.enabled ? "bg-purple-500" : "bg-gray-300"
                  }`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow ${
                    doc.enabled ? "translate-x-4" : "translate-x-1"
                  }`} />
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {doc.content.length > 120 ? doc.content.substring(0, 120) + "..." : doc.content}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(doc)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form inline */}
        {showForm ? (
          <form onSubmit={handleSave} className="border border-purple-200 rounded-xl p-4 flex flex-col gap-3 bg-purple-50/30">
            <h3 className="text-sm font-semibold text-gray-800">
              {editing ? "Editar documento" : "Nuevo documento"}
            </h3>

            <div>
              <label className="text-xs font-medium text-gray-700">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej: Lista de precios, FAQ, Políticas de envío..."
                required
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">Contenido</label>
              <p className="text-xs text-gray-400 mb-1">
                Pega o escribe el texto que el agente debe conocer
              </p>
              <textarea
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Ej: Precio del producto A: $99. Envíos en 3-5 días hábiles. Aceptamos pagos con tarjeta y transferencia..."
                required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
                {errorMsg}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? "Guardando..." : editing ? "Actualizar" : "Guardar documento"}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="text-sm px-4 py-2 rounded-lg border hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 text-sm text-purple-700 font-medium border border-purple-200 border-dashed rounded-lg px-4 py-3 hover:bg-purple-50 transition-colors"
          >
            <span className="text-lg">+</span>
            Agregar documento de conocimiento
          </button>
        )}

        {docs.length === 0 && !showForm && (
          <div className="text-center text-sm text-gray-400 py-2">
            Agrega documentos como preguntas frecuentes, listas de precios o políticas de tu negocio.
          </div>
        )}
      </div>
    </section>
  )
}
