'use client'

import { useState, useEffect } from 'react'
import { FileText, Plus, Pencil, Trash2 } from 'lucide-react'
import { useStart } from '../../../components/start/StartProvider'
import TemplateEditor from '../../../components/start/TemplateEditor'

interface Template {
  id: string
  name: string
  companyName: string | null
  fields: { key: string; label: string; type: 'text' | 'number' | 'date' | 'textarea'; autoFill: boolean; position: 'header' | 'body' | 'footer' }[]
  html: string
  isDefault: boolean
  createdAt?: number
  updatedAt?: number
}

export default function TemplatesPage() {
  const { apiUrl } = useStart()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${apiUrl}/api/templates`)
        if (res.ok) setTemplates(await res.json())
      } catch {}
      setLoading(false)
    }
    load()
  }, [apiUrl])

  const handleCreate = () => {
    setEditingTemplate(null)
    setShowEditor(true)
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setShowEditor(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this template?')) return
    try {
      await fetch(`${apiUrl}/api/templates/${id}`, { method: 'DELETE' })
      setTemplates((prev) => prev.filter((t) => t.id !== id))
    } catch {}
  }

  const handleSave = (template: Template) => {
    if (editingTemplate) {
      setTemplates((prev) => prev.map((t) => (t.id === template.id ? template : t)))
    } else {
      setTemplates((prev) => [...prev, template])
    }
    setShowEditor(false)
    setEditingTemplate(null)
  }

  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='font-display text-xl font-semibold'>Templates</h2>
        <button
          onClick={handleCreate}
          className='flex items-center gap-1.5 px-3 py-1.5 bg-ink text-lavender text-xs font-medium rounded-xl hover:opacity-90 transition-opacity'
        >
          <Plus className='w-3.5 h-3.5' />
          New Template
        </button>
      </div>

      {loading ? (
        <div className='flex items-center justify-center min-h-[200px]'>
          <div className='w-6 h-6 border-2 border-ink/20 border-t-ink/60 rounded-full animate-spin' />
        </div>
      ) : templates.length === 0 ? (
        <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-8 text-center'>
          <FileText className='w-8 h-8 text-ink/20 mx-auto mb-2' />
          <p className='text-ink/40 text-sm'>No templates yet</p>
          <p className='text-ink/30 text-xs mt-1'>Create your first template to get started.</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {templates.map((template) => (
            <div
              key={template.id}
              className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-5 hover:shadow-[0_4px_20px_rgba(43,36,64,0.1)] transition-shadow'
            >
              <div className='flex items-start justify-between mb-3'>
                <div className='flex items-center gap-2'>
                  <FileText className='w-5 h-5 text-ink/40' />
                  <span className='text-sm font-medium text-ink'>{template.name}</span>
                </div>
                {template.isDefault && (
                  <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-mint/15 text-[#1B7A50]'>Default</span>
                )}
              </div>

              {template.companyName && (
                <p className='text-xs text-ink/40 mb-2'>{template.companyName}</p>
              )}

              <p className='text-xs text-ink/30 mb-4'>
                {template.fields.length} field{template.fields.length !== 1 ? 's' : ''}
              </p>

              <div className='flex items-center gap-2'>
                <button
                  onClick={() => handleEdit(template)}
                  className='flex items-center gap-1 px-3 py-1.5 text-xs text-ink/60 hover:text-ink hover:bg-ink/5 rounded-lg transition-colors'
                >
                  <Pencil className='w-3 h-3' />
                  Edit
                </button>
                {!template.isDefault && (
                  <button
                    onClick={() => handleDelete(template.id)}
                    className='flex items-center gap-1 px-3 py-1.5 text-xs text-coral/60 hover:text-coral hover:bg-coral/5 rounded-lg transition-colors'
                  >
                    <Trash2 className='w-3 h-3' />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showEditor && (
        <TemplateEditor
          template={editingTemplate}
          onSave={handleSave}
          onClose={() => {
            setShowEditor(false)
            setEditingTemplate(null)
          }}
          apiUrl={apiUrl}
        />
      )}
    </div>
  )
}
