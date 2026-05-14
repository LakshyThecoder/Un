'use client'
import { useState, useRef, useEffect } from 'react'
import { Message, Profile } from '@/types'
import { cn, formatRelative } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import { Send } from 'lucide-react'

interface ChatProps {
  messages: Message[]
  currentUser: Profile
  onSend: (content: string) => void
  otherParty?: Profile
}

export function Chat({ messages, currentUser, onSend, otherParty }: ChatProps) {
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function send() {
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <p className="text-sm font-medium text-slate-400">No messages yet</p>
            {otherParty && (
              <p className="text-xs text-slate-300 mt-1">Start a conversation with {otherParty.full_name}</p>
            )}
          </div>
        )}
        {messages.map(m => {
          const isMe = m.sender_id === currentUser.id
          return (
            <div key={m.id} className={cn('flex gap-2.5', isMe && 'flex-row-reverse')}>
              <Avatar
                name={m.sender?.full_name || (isMe ? currentUser.full_name : otherParty?.full_name || 'User')}
                size="xs"
              />
              <div className={cn('max-w-[78%]', isMe && 'items-end flex flex-col')}>
                <div className={cn(
                  'px-3 py-2 rounded-2xl text-sm leading-relaxed',
                  isMe
                    ? 'bg-slate-900 text-white rounded-tr-sm'
                    : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                )}>
                  {m.content}
                </div>
                <div className={cn('text-[10px] text-slate-400 mt-1 px-1', isMe && 'text-right')}>
                  {formatRelative(m.created_at)}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-slate-100">
        {otherParty && (
          <div className="text-xs text-slate-400 mb-2">
            Message {otherParty.full_name}…
          </div>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Type a message…"
            className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 resize-none min-h-[42px] max-h-32 outline-none focus:ring-2 focus:ring-slate-200 text-slate-800"
            rows={1}
          />
          <button
            onClick={send}
            disabled={!text.trim()}
            className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-30 transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
