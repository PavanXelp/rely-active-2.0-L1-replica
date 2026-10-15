import { FileText, Mic } from 'lucide-react'
import type { DiagnosisFile } from '@/lib/types/diagnosis'

interface DiagnosisFileListProps {
  attachments: DiagnosisFile[]
  voiceNotes: DiagnosisFile[]
}

export function DiagnosisFileList({ attachments, voiceNotes }: DiagnosisFileListProps) {
  const images = attachments.filter((f) => f.fileType === 'IMAGE')
  const pdfs = attachments.filter((f) => f.fileType !== 'IMAGE')

  if (images.length === 0 && pdfs.length === 0 && voiceNotes.length === 0) return null

  return (
    <div className="space-y-2">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((file) => (
            <a key={file.id} href={file.url} target="_blank" rel="noopener noreferrer">
              <img
                src={file.url}
                alt={file.name}
                className="w-14 h-14 rounded-xl object-cover border border-border/60"
              />
            </a>
          ))}
        </div>
      )}

      {pdfs.length > 0 && (
        <div className="space-y-1.5">
          {pdfs.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-2.5 py-2"
            >
              <FileText className="w-4 h-4 text-red-500 shrink-0" />
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-0 truncate text-xs font-semibold text-[#005390] dark:text-sky-400 hover:underline"
              >
                {file.name}
              </a>
            </div>
          ))}
        </div>
      )}

      {voiceNotes.length > 0 && (
        <div className="space-y-1.5">
          {voiceNotes.map((file, idx) => (
            <div
              key={file.id}
              className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-2.5 py-1.5"
            >
              <Mic className="w-4 h-4 text-sky-500 shrink-0" />
              <span className="text-[11px] font-bold text-muted-foreground shrink-0">#{idx + 1}</span>
              <audio controls preload="metadata" src={file.url} className="flex-1 min-w-0 h-8">
                <track kind="captions" />
              </audio>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DiagnosisFileList
