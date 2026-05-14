'use client'
import { ManuscriptFile } from '@/types'
import { cn, formatBytes } from '@/lib/utils'
import { FileText, Image, FileCode, File, Plus, ExternalLink } from 'lucide-react'

interface FilePanelProps {
  files: ManuscriptFile[]
  activeFileId?: string
  onSelect: (file: ManuscriptFile) => void
  onUpload?: () => void
}

function FileIcon({ type }: { type: string }) {
  const cls = 'w-4 h-4 flex-shrink-0'
  if (type === 'pdf') return <FileText className={cn(cls, 'text-red-500')} />
  if (type === 'image' || type === 'img') return <Image className={cn(cls, 'text-purple-500')} />
  if (type === 'latex' || type === 'tex') return <FileCode className={cn(cls, 'text-green-600')} />
  return <File className={cn(cls, 'text-slate-400')} />
}

export function FilePanel({ files, activeFileId, onSelect, onUpload }: FilePanelProps) {
  return (
    <div className="w-[200px] flex-shrink-0 flex flex-col border-r border-slate-200 bg-white">
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Files</div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {files.map(f => (
          <button
            key={f.id}
            onClick={() => onSelect(f)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-colors',
              activeFileId === f.id
                ? 'bg-cyan-50 border border-cyan-200'
                : 'hover:bg-slate-50 border border-transparent'
            )}
          >
            <FileIcon type={f.type} />
            <div className="flex-1 min-w-0">
              <div className={cn(
                'text-xs font-medium truncate',
                activeFileId === f.id ? 'text-cyan-700' : 'text-slate-700'
              )}>
                {f.name}
              </div>
              <div className="text-[10px] text-slate-400">{formatBytes(f.size)}</div>
            </div>
          </button>
        ))}
        {files.length === 0 && (
          <div className="py-6 text-center text-xs text-slate-400">No files</div>
        )}
      </div>
      {onUpload && (
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={onUpload}
            className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-slate-600 border border-dashed border-slate-200 hover:border-slate-300 rounded-lg py-2.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Upload file
          </button>
        </div>
      )}
    </div>
  )
}
