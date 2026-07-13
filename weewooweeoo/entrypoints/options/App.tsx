import React, { useState } from 'react';
import type { Settings, WebSearchCapability, PromptTemplate } from '../../src/lib/types';
import { refreshCapability } from '../../src/lib/search/index';
import { PROVIDER_PRESETS, getPreset } from '../../src/lib/provider-presets';
import { fetchModels, type ModelInfo } from '../../src/lib/model-discovery';
import { t, type Language } from '../../src/lib/i18n';
import { createPromptTemplate } from '../../src/lib/prompt-bank';
import { DARK, LIGHT, type ThemeTokens } from '../../src/lib/theme';

const AVAILABLE_ACTIONS = [
  { id: 'explain' },
  { id: 'summary' },
  { id: 'search' },
  { id: 'task' },
];

export function OptionsForm({
  initial,
  onSave,
}: {
  initial: Settings;
  onSave: (s: Settings) => Promise<void>;
}) {
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl);
  const [apiKey, setApiKey] = useState(initial.apiKey);
  const [model, setModel] = useState(initial.model);
  const [maxTokens, setMaxTokens] = useState(initial.maxTokens ?? 2048);
  const [presetId, setPresetId] = useState(initial.presetId ?? '');
  const [slots, setSlots] = useState<string[]>(initial.slots);
  const [searchPrompt, setSearchPrompt] = useState(
    initial.search?.searchPrompt ?? '',
  );
  const [searchDepth, setSearchDepth] = useState(
    initial.search?.searchDepth ?? 'top 3 most relevant results',
  );
  const [searchMode, setSearchMode] = useState(initial.searchMode ?? 'knowledge');
  const [capability, setCapability] = useState<WebSearchCapability | null>(
    initial.webSearchCapability ?? null,
  );
  const [probing, setProbing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [discoveredModels, setDiscoveredModels] = useState<ModelInfo[]>([]);
  const [language, setLanguage] = useState<Language>(initial.language ?? 'en');
  const [theme, setTheme] = useState(initial.theme ?? 'dark');
  const [wheelTrigger, setWheelTrigger] = useState(initial.wheelTrigger ?? 'highlight');
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>(initial.promptTemplates ?? []);
  const [activePromptId, setActivePromptId] = useState<Record<string, string>>(initial.activePromptId ?? {});
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);
  const [newPromptAction, setNewPromptAction] = useState<string | null>(null);

  const tk = theme === 'dark' ? DARK : LIGHT;

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      baseUrl,
      apiKey,
      model,
      maxTokens,
      presetId,
      slots: slots as [string, string, string],
      search: { searchPrompt, searchDepth },
      searchMode,
      webSearchCapability: capability,
      language,
      theme,
      wheelSkin: 'doodle',
      wheelTrigger,
      promptTemplates,
      activePromptId,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRecheck = async () => {
    setProbing(true);
    try {
      const cap = await refreshCapability({
        baseUrl,
        apiKey,
        model,
        maxTokens,
      });
      setCapability(cap);
    } catch {
      setCapability({
        toolCalling: false,
        probedAt: Date.now(),
        probedBaseUrl: baseUrl,
        probedModel: model,
      });
    }
    setProbing(false);
  };

  const handlePresetChange = (id: string) => {
    setPresetId(id);
    const preset = getPreset(id);
    if (preset) {
      setBaseUrl(preset.baseUrl);
      setModel(preset.defaultModel);
      setMaxTokens(preset.defaultMaxTokens);
      setCapability(null);
      setDiscoveredModels([]);
    }
  };

  const handleDiscoverModels = async () => {
    if (!apiKey.trim()) {
      // Fall back to preset's hardcoded list
      const preset = getPreset(presetId);
      if (preset) {
        setDiscoveredModels(
          preset.models.map((id) => ({ id, contextLength: 0 })),
        );
      }
      return;
    }
    setDiscovering(true);
    try {
      const models = await fetchModels(baseUrl, apiKey, presetId);
      setDiscoveredModels(models);
    } catch {
      // Fallback to preset list
      const preset = getPreset(presetId);
      if (preset) {
        setDiscoveredModels(
          preset.models.map((id) => ({ id, contextLength: 0 })),
        );
      }
    }
    setDiscovering(false);
  };

  const setSlot = (index: number, value: string) => {
    const next = [...slots];
    next[index] = value;
    setSlots(next);
  };

  return (
    <div
      style={{
        maxWidth: 480,
        margin: '0 auto',
        padding: 24,
        minHeight: '100vh',
        background: tk.bg,
        color: tk.text,
        fontFamily: tk.fontFamily,
      }}
    >
      <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
        {t('settings.title', language)}
      </h1>

      {/* Language + Theme */}
      <fieldset style={fieldsetStyle(tk)}>
        <legend style={legendStyle(tk)}>{t('settings.languageAndTheme', language)}</legend>
        <select
          aria-label="Language"
          value={language}
          onChange={async (e) => {
            const lang = e.target.value as Language;
            setLanguage(lang);
            await saveSettings({ language: lang });
          }}
          style={{ ...inputStyle(tk), width: '100%', marginBottom: 10 }}
        >
          <option value="en">English</option>
          <option value="zh">中文（简体）</option>
        </select>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['dark', 'light'] as const).map((th) => (
            <button
              key={th}
              onClick={async () => {
                setTheme(th);
                await saveSettings({ theme: th });
              }}
              style={{
                flex: 1,
                background: theme === th ? 'rgba(100,140,255,0.15)' : 'rgba(255,255,255,0.04)',
                color: theme === th ? '#b0c8ff' : '#888',
                border: theme === th ? '1px solid rgba(100,140,255,0.3)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 6,
                padding: '6px 10px',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            >
              {th === 'dark' ? t('settings.dark', language) : t('settings.light', language)}
            </button>
          ))}
        </div>
        <label style={{ ...labelStyle, marginTop: 12 }}>{t('settings.wheelTrigger', language)}</label>
        <select
          aria-label="Wheel Trigger"
          value={wheelTrigger}
          onChange={async (e) => {
            const v = e.target.value as 'highlight' | 'rightclick';
            setWheelTrigger(v);
            await saveSettings({ wheelTrigger: v });
          }}
          style={{ ...inputStyle(tk), width: '100%' }}
        >
          <option value="highlight">{t('settings.wheelTriggerHighlight', language)}</option>
          <option value="rightclick">{t('settings.wheelTriggerRightClick', language)}</option>
        </select>
      </fieldset>

      {/* Provider */}
      <fieldset style={fieldsetStyle(tk)}>
        <legend style={legendStyle(tk)}>{t('settings.provider', language)}</legend>

        <label style={labelStyle}>{t('settings.providerLabel', language)}</label>
        <select
          aria-label="Provider Preset"
          value={presetId}
          onChange={(e) => handlePresetChange(e.target.value)}
          style={{ ...inputStyle(tk), width: '100%' }}
        >
          <option value="">{t('preset.custom', language)}</option>
          {PROVIDER_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.icon} {p.name}
            </option>
          ))}
        </select>

        <label style={labelStyle}>{t('settings.baseUrl', language)}</label>
        <input
          aria-label="Base URL"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://api.openai.com/v1"
          style={inputStyle(tk)}
        />

        <label style={labelStyle}>{t('settings.apiKey', language)}</label>
        <input
          aria-label="API Key"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-…"
          style={inputStyle(tk)}
        />

        <label style={labelStyle}>{t('settings.model', language)}</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {discoveredModels.length > 0 ? (
            <select
              aria-label="Model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{ ...inputStyle(tk), flex: 1 }}
            >
              {discoveredModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id}
                  {m.contextLength > 0
                    ? ` (${(m.contextLength / 1000).toFixed(0)}k ctx)`
                    : ''}
                </option>
              ))}
            </select>
          ) : (
            <input
              aria-label="Model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gpt-4o-mini"
              style={{ ...inputStyle(tk), flex: 1 }}
            />
          )}
          <button
            onClick={handleDiscoverModels}
            disabled={discovering}
            style={{
              background: 'rgba(100,140,255,0.1)',
              color: '#8899cc',
              border: '1px solid rgba(100,140,255,0.2)',
              borderRadius: 4,
              padding: '0 10px',
              cursor: 'pointer',
              fontSize: 11,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {discovering ? t('settings.discovering', language) : t('settings.discover', language)}
          </button>
        </div>

        <label style={labelStyle}>{t('settings.maxTokens', language)}</label>
        <input
          aria-label="Max Tokens"
          type="number"
          value={maxTokens}
          onChange={(e) => setMaxTokens(Number(e.target.value) || 256)}
          min={64}
          max={128000}
          style={inputStyle(tk)}
        />
      </fieldset>

      {/* Wheel slots */}
      <fieldset style={fieldsetStyle(tk)}>
        <legend style={legendStyle(tk)}>{t('settings.slots', language)}</legend>
        <p style={{ fontSize: 12, color: '#888', margin: '0 0 10px' }}>
          {t('settings.slotDesc', language)}
        </p>
        {slots.map((slotId, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <label style={labelStyle}>{t('settings.slot', language)} {i + 1}</label>
            <select
              aria-label={`Slot ${i + 1}`}
              value={slotId}
              onChange={(e) => setSlot(i, e.target.value)}
              style={{ ...inputStyle(tk), width: '100%' }}
            >
              {AVAILABLE_ACTIONS.map((a) => (
                <option key={a.id} value={a.id}>
                  {t('wheel.' + a.id, language)}
                </option>
              ))}
            </select>
          </div>
        ))}
      </fieldset>

      {/* Search Settings */}
      <fieldset style={fieldsetStyle(tk)}>
        <legend style={legendStyle(tk)}>{t('settings.searchSettings', language)}</legend>
        <p style={{ fontSize: 12, color: '#888', margin: '0 0 10px' }}>
          {t('settings.searchSettingsDesc', language)}
        </p>

        <label style={labelStyle}>{t('settings.searchDepth', language)}</label>
        <select
          aria-label="Search Depth"
          value={searchDepth}
          onChange={(e) => setSearchDepth(e.target.value)}
          style={{ ...inputStyle(tk), width: '100%' }}
        >
          <option value="top 3 most relevant results">{t('settings.searchDepthTop3', language)}</option>
          <option value="top 5 most relevant results">{t('settings.searchDepthTop5', language)}</option>
          <option value="comprehensive results">{t('settings.searchDepthComprehensive', language)}</option>
        </select>

        <label style={labelStyle}>{t('settings.customPrompt', language)}</label>
        <textarea
          aria-label="Custom Search Prompt"
          value={searchPrompt}
          onChange={(e) => setSearchPrompt(e.target.value)}
          placeholder={t('settings.customPromptPlaceholder', language)}
          rows={4}
          style={{ ...inputStyle(tk), resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }}
        />
      </fieldset>

      {/* Web Search Mode */}
      <fieldset style={fieldsetStyle(tk)}>
        <legend style={legendStyle(tk)}>{t('settings.webSearch', language)}</legend>
        <p style={{ fontSize: 12, color: '#888', margin: '0 0 10px' }}>
          {t('settings.webSearchDesc', language)}
        </p>

        <label style={labelStyle}>{t('settings.searchMode', language)}</label>
        <select
          aria-label="Search Mode"
          value={searchMode}
          onChange={(e) => setSearchMode(e.target.value as 'agentic' | 'knowledge')}
          style={{ ...inputStyle(tk), width: '100%' }}
        >
          <option value="knowledge">
            {t('settings.knowledgeOnly', language)}
          </option>
          <option value="agentic">
            {t('settings.agentic', language)}
          </option>
        </select>

        {searchMode === 'agentic' && (
          <div style={{ marginTop: 10 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 12, color: '#aaa' }}>
                {capability?.toolCalling === true
                  ? t('settings.toolCallingSupported', language)
                  : capability?.toolCalling === false
                    ? t('settings.toolCallingNotSupported', language)
                    : t('settings.toolCallingUnknown', language)}
              </span>
              <button
                onClick={handleRecheck}
                disabled={probing}
                style={{
                  background: 'rgba(100,140,255,0.1)',
                  color: '#8899cc',
                  border: '1px solid rgba(100,140,255,0.2)',
                  borderRadius: 4,
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontSize: 11,
                  whiteSpace: 'nowrap',
                }}
              >
                {probing ? t('settings.testing', language) : t('settings.recheck', language)}
              </button>
            </div>
            <p style={{ fontSize: 11, color: '#666', margin: '6px 0 0' }}>
              {t('settings.tierDescription', language)}
            </p>
          </div>
        )}
      </fieldset>

      {/* Prompt Bank */}
      <fieldset style={fieldsetStyle(tk)}>
        <legend style={legendStyle(tk)}>{t('settings.promptBank', language)}</legend>
        <p style={{ fontSize: 12, color: '#888', margin: '0 0 10px' }}>
          {t('settings.promptBankDesc', language)}
        </p>
        {AVAILABLE_ACTIONS.map((action) => {
          const actionPrompts = promptTemplates.filter((p) => p.actionId === action.id);
          const activeId = activePromptId[action.id] || '';
          
          return (
            <div key={action.id} style={{ marginBottom: 12, padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#b0c8ff' }}>{t('wheel.' + action.id, language)}</span>
                <select
                  value={activeId}
                  onChange={(e) => setActivePromptId({ ...activePromptId, [action.id]: e.target.value })}
                  style={{ flex: 1, fontSize: 11, background: tk.bg, color: tk.textSecondary, border: `1px solid ${tk.border}`, borderRadius: 4, padding: '2px 6px' }}
                >
                  <option value="">{t('settings.builtInDefault', language)}</option>
                  {actionPrompts.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}{p.isDefault ? t('settings.promptDefault', language) : ''}</option>
                  ))}
                </select>
                <button
                  onClick={() => setNewPromptAction(action.id)}
                  style={{ fontSize: 11, background: 'rgba(100,200,100,0.1)', color: '#8a8', border: '1px solid rgba(100,200,100,0.2)', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  + {t('settings.promptNew', language)}
                </button>
              </div>
              {/* Inline editor for new prompt */}
              {newPromptAction === action.id && (
                <PromptEditor
                  actionId={action.id}
                  tk={tk}
                  language={language}
                  onSave={(p) => {
                    setPromptTemplates([...promptTemplates, p]);
                    setActivePromptId({ ...activePromptId, [action.id]: p.id });
                    setNewPromptAction(null);
                  }}
                  onCancel={() => setNewPromptAction(null)}
                />
              )}
              {/* Edit existing custom prompts */}
              {actionPrompts.filter(p => !p.isDefault).map((p) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, padding: '2px 6px', background: 'rgba(255,255,255,0.02)', borderRadius: 4 }}>
                  <span style={{ flex: 1, fontSize: 11, color: '#777' }}>{p.name}</span>
                  <button onClick={() => setEditingPrompt(p)} style={{ ...tinyBtnStyle, fontSize: 10, padding: '1px 6px' }}>✏️</button>
                  <button onClick={() => {
                    setPromptTemplates(promptTemplates.filter(t => t.id !== p.id));
                    if (activePromptId[action.id] === p.id) {
                      setActivePromptId({ ...activePromptId, [action.id]: '' });
                    }
                  }} style={{ ...tinyBtnStyle, fontSize: 10, padding: '1px 6px', color: '#c66' }}>🗑️</button>
                </div>
              ))}
            </div>
          );
        })}
        {/* Edit modal */}
        {editingPrompt && (
          <PromptEditor
            actionId={editingPrompt.actionId}
            existing={editingPrompt}
            tk={tk}
            language={language}
            onSave={(p) => {
              setPromptTemplates(promptTemplates.map(t => t.id === p.id ? p : t));
              setEditingPrompt(null);
            }}
            onCancel={() => setEditingPrompt(null)}
          />
        )}
      </fieldset>

      {/* Privacy notice */}
      <div
        style={{
          background: 'rgba(100,200,100,0.06)',
          border: '1px solid rgba(100,200,100,0.15)',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 16,
        }}
      >
        <p style={{ fontSize: 11, color: '#8a8', margin: 0, lineHeight: 1.5 }}>
          {t('settings.privacyNotice', language)}
        </p>
      </div>

      {/* Save */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}
      >
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: 'rgba(100,140,255,0.15)',
            color: '#b0c8ff',
            border: '1px solid rgba(100,140,255,0.3)',
            borderRadius: 6,
            padding: '8px 24px',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {saving ? t('settings.saving', language) : t('settings.save', language)}
        </button>
        {saved && (
          <span style={{ fontSize: 12, color: '#6a6' }}>{t('settings.saved', language)}</span>
        )}
      </div>
    </div>
  );
}

// ── Prompt Editor (inline) ──────────────────────────────────────

function PromptEditor({
  actionId,
  existing,
  onSave,
  onCancel,
  tk,
  language,
}: {
  actionId: string;
  existing?: PromptTemplate;
  onSave: (p: PromptTemplate) => void;
  onCancel: () => void;
  tk: ThemeTokens;
  language: Language;
}) {
  const [name, setName] = useState(existing?.name ?? '');
  const [systemPrompt, setSystemPrompt] = useState(existing?.systemPrompt ?? '');

  return (
    <div style={{ marginTop: 8, padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: 6 }}>
      <input
        placeholder={t('settings.promptNamePlaceholder', language)}
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ ...inputStyle(tk), marginBottom: 6, fontSize: 12 }}
      />
      <textarea
        placeholder={t('settings.promptTextPlaceholder', language)}
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
        rows={5}
        style={{ ...inputStyle(tk), resize: 'vertical', fontFamily: 'monospace', fontSize: 11, marginBottom: 6 }}
      />
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => {
            if (!name.trim()) return;
            onSave(
              existing
                ? { ...existing, name: name.trim(), systemPrompt }
                : createPromptTemplate(name.trim(), actionId, systemPrompt),
            );
          }}
          style={{ ...tinyBtnStyle, color: '#8a8' }}
        >
          {existing ? t('settings.promptUpdate', language) : t('settings.promptSave', language)}
        </button>
        <button onClick={onCancel} style={tinyBtnStyle}>{t('settings.promptCancel', language)}</button>
      </div>
    </div>
  );
}

const tinyBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  color: '#aaa',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 4,
  padding: '3px 10px',
  cursor: 'pointer',
  fontSize: 11,
};

const fieldsetStyle = (tk: ThemeTokens): React.CSSProperties => ({
  border: `1px solid ${tk.border}`,
  borderRadius: 8,
  padding: '12px 16px',
  marginBottom: 16,
  background: tk.surface,
});

const legendStyle = (tk: ThemeTokens): React.CSSProperties => ({
  fontSize: 13,
  fontWeight: 700,
  color: tk.accent,
  padding: '0 4px',
});

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: '#888',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  marginBottom: 4,
  marginTop: 8,
};

const inputStyle = (tk: ThemeTokens): React.CSSProperties => ({
  width: '100%',
  boxSizing: 'border-box',
  background: tk.bg,
  color: tk.text,
  border: `1px solid ${tk.border}`,
  borderRadius: 6,
  padding: '6px 10px',
  fontSize: 13,
});

// ── Wrapper (wired to chrome.storage) ────────────────────────────

import { getSettings, saveSettings } from '../../src/lib/settings';

export default function App() {
  const [settings, setSettings] = useState<Settings | null>(null);

  React.useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  if (!settings) {
    return (
      <p style={{ textAlign: 'center', color: '#666', marginTop: 40 }}>
        {t('settings.loading', 'en')}
      </p>
    );
  }

  return (
    <OptionsForm
      initial={settings}
      onSave={async (s) => {
        await saveSettings(s);
      }}
    />
  );
}
