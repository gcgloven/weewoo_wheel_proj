import React, { useState } from 'react';
import type { CardType, NewCard } from '../../src/lib/types';

interface SourceInfo {
  url: string;
  title: string;
  originalText: string;
}

interface ResultPanelProps {
  result: {
    ok: boolean;
    cardType: CardType;
    title: string;
    body: string;
    error?: string;
  };
  source: SourceInfo;
  onSave: (card: NewCard) => void;
  onClose: () => void;
}

export function ResultPanel({
  result,
  source,
  onSave,
  onClose,
}: ResultPanelProps) {
  const [title, setTitle] = useState(result.title || '');
  const [body, setBody] = useState(result.body || '');

  if (!result.ok) {
    return (
      <div
        role="alert"
        style={{
          background: '#1a0a0a',
          color: '#ffb0b0',
          padding: 28,
          borderRadius: 16,
          minWidth: 380,
          maxWidth: 500,
          border: '2px solid rgba(255, 60, 60, 0.5)',
          boxShadow: '0 8px 48px rgba(255,0,0,0.35), 0 0 0 1px rgba(255,60,60,0.2)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 8 }}>⚠️</div>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
          WeeWoo² Wheel
        </div>
        <div style={{ fontWeight: 700, marginBottom: 6, color: '#ff4444', fontSize: 14 }}>
          {result.error || 'Unknown error'}
        </div>
        <div style={{ fontSize: 12, opacity: 0.9, color: '#ffcccc', marginBottom: 16 }}>
          Open side panel (click extension icon) → Settings → enter API key
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: 4,
            background: 'rgba(255,60,60,0.2)',
            color: '#ffcccc',
            border: '1px solid rgba(255,60,60,0.4)',
            borderRadius: 8,
            padding: '8px 20px',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#1e1e2a',
        color: '#e0e0e0',
        padding: 16,
        borderRadius: 12,
        maxWidth: 380,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Title */}
      <div>
        <label
          htmlFor="rp-title"
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            color: '#888',
            marginBottom: 4,
            display: 'block',
          }}
        >
          Title
        </label>
        <input
          id="rp-title"
          aria-label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            background: '#12121a',
            color: '#e0e0e0',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: 14,
            fontWeight: 600,
          }}
        />
      </div>

      {/* Body */}
      <div>
        <label
          htmlFor="rp-body"
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            color: '#888',
            marginBottom: 4,
            display: 'block',
          }}
        >
          Body
        </label>
        <textarea
          id="rp-body"
          aria-label="Body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            background: '#12121a',
            color: '#e0e0e0',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            padding: '8px 10px',
            fontSize: 13,
            lineHeight: 1.5,
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Source hint */}
      <div
        style={{
          fontSize: 11,
          color: '#666',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        from {source.title}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            color: '#999',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            padding: '6px 14px',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          Cancel
        </button>
        <button
          onClick={() =>
            onSave({
              type: result.cardType,
              title,
              body,
              tags: [],
              folder: 'no_folder',
              sourceUrl: source.url,
              sourceTitle: source.title,
              originalText: source.originalText,
            })
          }
          style={{
            background: 'rgba(100, 140, 255, 0.15)',
            color: '#b0c8ff',
            border: '1px solid rgba(100, 140, 255, 0.3)',
            borderRadius: 6,
            padding: '6px 18px',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Save card
        </button>
      </div>
    </div>
  );
}
