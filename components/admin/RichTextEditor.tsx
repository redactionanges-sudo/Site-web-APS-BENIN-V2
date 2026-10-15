'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  Heading4,
  Pilcrow,
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Quote,
  Minus,
  Undo2,
  Redo2,
  RemoveFormatting,
  Palette,
  Eye,
  Edit3,
  Type,
  ExternalLink,
  X,
  Check,
} from 'lucide-react';
import { RichTextContent } from '@/components/RichTextContent';
import { sanitizeRichHtml } from '@/lib/sanitize';

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  minHeight?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  langTag?: 'FR' | 'EN';
}

const COLOR_PRESETS = [
  { label: 'Violet Institutionnel', color: '#92278F' },
  { label: 'Orange APS', color: '#FF8C00' },
  { label: 'Vert Action', color: '#15803D' },
  { label: 'Bleu Officiel', color: '#1E40AF' },
  { label: 'Gris Foncé (Lecture)', color: '#1F2937' },
  { label: 'Rouge Alerte', color: '#DC2626' },
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Rédigez ou mettez en forme votre contenu ici...',
  minHeight = '220px',
  helpText,
  required = false,
  disabled = false,
  id,
  langTag,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkOpenNewTab, setLinkOpenNewTab] = useState(true);
  const [activeStyles, setActiveStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    heading: 'p',
    font: 'Open Sans',
    align: 'left',
  });

  const lastHtmlRef = useRef(value || '');

  // Synchronize incoming external value only if it changes outside user typing
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      if (value !== lastHtmlRef.current) {
        editorRef.current.innerHTML = value || '';
        lastHtmlRef.current = value || '';
      }
    }
  }, [value]);

  // Update active formatting indicators based on current selection
  const updateActiveState = useCallback(() => {
    if (!document) return;
    try {
      const bold = document.queryCommandState('bold');
      const italic = document.queryCommandState('italic');
      const underline = document.queryCommandState('underline');
      const strike = document.queryCommandState('strikeThrough');

      let heading = 'p';
      const block = document.queryCommandValue('formatBlock');
      if (block && typeof block === 'string') {
        const lower = block.toLowerCase();
        if (lower.includes('h2')) heading = 'h2';
        else if (lower.includes('h3')) heading = 'h3';
        else if (lower.includes('h4')) heading = 'h4';
      }

      let align = 'left';
      if (document.queryCommandState('justifyCenter')) align = 'center';
      else if (document.queryCommandState('justifyRight')) align = 'right';
      else if (document.queryCommandState('justifyFull')) align = 'justify';

      setActiveStyles({
        bold,
        italic,
        underline,
        strike,
        heading,
        font: 'Open Sans',
        align,
      });
    } catch {
      // Ignored for environments where queryCommandState isn't available
    }
  }, []);

  const handleInput = () => {
    if (!editorRef.current) return;
    let html = editorRef.current.innerHTML;

    // Normalize empty tags
    if (html === '<p><br></p>' || html === '<p></p>' || html === '<br>') {
      html = '';
    }

    lastHtmlRef.current = html;
    onChange(html);
    updateActiveState();
  };

  const exec = (command: string, arg: string | undefined = undefined) => {
    if (disabled || viewMode === 'preview') return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, arg);
    handleInput();
  };

  // Heading format
  const handleFormatBlock = (tag: string) => {
    if (tag === 'p') {
      exec('formatBlock', '<p>');
    } else {
      exec('formatBlock', `<${tag}>`);
    }
  };

  // Font family format
  const handleFontFamily = (family: string) => {
    if (family === 'Montserrat') {
      exec('fontName', 'Montserrat, sans-serif');
    } else {
      exec('fontName', 'Open Sans, sans-serif');
    }
  };

  // Color format
  const handleApplyColor = (color: string) => {
    exec('foreColor', color);
    setIsColorPickerOpen(false);
  };

  // Link management
  const openLinkModal = () => {
    const selection = window.getSelection();
    if (selection && selection.anchorNode) {
      const parentLink = (selection.anchorNode as HTMLElement).parentElement?.closest('a');
      if (parentLink) {
        setLinkUrl(parentLink.getAttribute('href') || '');
      } else {
        setLinkUrl('');
      }
    }
    setIsLinkModalOpen(true);
  };

  const handleInsertLink = () => {
    if (!linkUrl.trim()) {
      exec('unlink');
    } else {
      let finalUrl = linkUrl.trim();
      if (!/^https?:\/\//i.test(finalUrl) && !/^mailto:/i.test(finalUrl) && !/^tel:/i.test(finalUrl) && !finalUrl.startsWith('/')) {
        finalUrl = `https://${finalUrl}`;
      }
      exec('createLink', finalUrl);

      // Add target="_blank" and rel="noopener noreferrer" if requested
      if (editorRef.current && linkOpenNewTab) {
        const links = editorRef.current.querySelectorAll('a');
        links.forEach((a) => {
          if (a.getAttribute('href') === finalUrl) {
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener noreferrer');
          }
        });
        handleInput();
      }
    }
    setIsLinkModalOpen(false);
    setLinkUrl('');
  };

  // Word count & character count
  const plainText = (value || '').replace(/<[^>]*>/g, '').trim();
  const charCount = plainText.length;
  const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="space-y-1.5 w-full">
      {/* Header with Label and Preview Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {label && (
          <label htmlFor={id} className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            {label} {required && <span className="text-red-500">*</span>}
            {langTag && (
              <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                langTag === 'FR' ? 'bg-purple-100 text-[#92278F]' : 'bg-orange-100 text-[#FF8C00]'
              }`}>
                {langTag}
              </span>
            )}
          </label>
        )}

        <div className="flex items-center gap-1 ml-auto">
          <div className="inline-flex rounded-lg bg-gray-100 p-0.5 border border-gray-200 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-all ${
                viewMode === 'edit'
                  ? 'bg-white text-[#92278F] shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Passer en mode rédaction WYSIWYG"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#92278F]" />
              <span>Éditeur</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-all ${
                viewMode === 'preview'
                  ? 'bg-white text-[#FF8C00] shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Prévisualiser le rendu final du site public"
            >
              <Eye className="w-3.5 h-3.5 text-[#FF8C00]" />
              <span>Aperçu public</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor Main Container */}
      <div className="rounded-xl border border-gray-300 focus-within:border-[#92278F] focus-within:ring-2 focus-within:ring-[#92278F]/20 bg-white shadow-2xs overflow-hidden transition-all">
        {/* Toolbar - Only visible in edit mode */}
        {viewMode === 'edit' && (
          <div className="bg-gray-50 border-b border-gray-200 px-2 py-1.5 flex flex-wrap items-center gap-1 select-none overflow-x-auto text-xs">
            {/* History */}
            <div className="flex items-center gap-0.5 pr-1 border-r border-gray-200">
              <button
                type="button"
                onClick={() => exec('undo')}
                className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors"
                title="Annuler (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => exec('redo')}
                className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors"
                title="Rétablir (Ctrl+Y)"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Block formatting: Paragraph, H2, H3, H4 */}
            <div className="flex items-center gap-0.5 pr-1 border-r border-gray-200">
              <select
                value={activeStyles.heading}
                onChange={(e) => handleFormatBlock(e.target.value)}
                className="text-xs bg-white border border-gray-300 rounded px-2 py-1 font-semibold text-gray-700 hover:border-gray-400 focus:outline-hidden cursor-pointer"
                title="Style de paragraphe et niveaux de titres"
              >
                <option value="p">Normal (Paragraphe)</option>
                <option value="h2">Titre Principal (H2)</option>
                <option value="h3">Sous-titre (H3)</option>
                <option value="h4">Titre de Section (H4)</option>
              </select>
            </div>

            {/* Font Family: Open Sans vs Montserrat */}
            <div className="flex items-center gap-0.5 pr-1 border-r border-gray-200">
              <select
                onChange={(e) => handleFontFamily(e.target.value)}
                className="text-xs bg-white border border-gray-300 rounded px-2 py-1 font-semibold text-gray-700 hover:border-gray-400 focus:outline-hidden cursor-pointer"
                title="Police institutionnelle"
                defaultValue="Open Sans"
              >
                <option value="Open Sans">Open Sans (Corps)</option>
                <option value="Montserrat">Montserrat (Titres)</option>
              </select>
            </div>

            {/* Basic Formatting: Bold, Italic, Underline, Strikethrough */}
            <div className="flex items-center gap-0.5 pr-1 border-r border-gray-200">
              <button
                type="button"
                onClick={() => exec('bold')}
                className={`p-1.5 rounded transition-colors ${
                  activeStyles.bold ? 'bg-[#92278F] text-white' : 'hover:bg-gray-200 text-gray-700'
                }`}
                title="Gras (Ctrl+B)"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => exec('italic')}
                className={`p-1.5 rounded transition-colors ${
                  activeStyles.italic ? 'bg-[#92278F] text-white' : 'hover:bg-gray-200 text-gray-700'
                }`}
                title="Italique (Ctrl+I)"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => exec('underline')}
                className={`p-1.5 rounded transition-colors ${
                  activeStyles.underline ? 'bg-[#92278F] text-white' : 'hover:bg-gray-200 text-gray-700'
                }`}
                title="Souligné (Ctrl+U)"
              >
                <Underline className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => exec('strikeThrough')}
                className={`p-1.5 rounded transition-colors ${
                  activeStyles.strike ? 'bg-[#92278F] text-white' : 'hover:bg-gray-200 text-gray-700'
                }`}
                title="Barré"
              >
                <Strikethrough className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Color Palette Popover */}
            <div className="relative pr-1 border-r border-gray-200">
              <button
                type="button"
                onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                className="p-1.5 rounded hover:bg-gray-200 text-gray-700 flex items-center gap-1 transition-colors"
                title="Couleur de texte institutionnelle"
              >
                <Palette className="w-3.5 h-3.5 text-[#92278F]" />
              </button>

              {isColorPickerOpen && (
                <div className="absolute top-full left-0 mt-1 z-30 p-2.5 bg-white rounded-xl shadow-lg border border-gray-200 w-52 space-y-2 animate-in fade-in">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Couleurs de la charte
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.color}
                        type="button"
                        onClick={() => handleApplyColor(preset.color)}
                        className="flex items-center gap-1.5 p-1 rounded hover:bg-gray-50 text-[11px] font-medium text-gray-700 text-left"
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: preset.color }}
                        />
                        <span className="truncate">{preset.label.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                    <label className="text-gray-500 font-medium">Autre couleur :</label>
                    <input
                      type="color"
                      onChange={(e) => handleApplyColor(e.target.value)}
                      className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                      title="Choisir une couleur personnalisée"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyColor('#374151')}
                    className="w-full text-center text-[10px] font-semibold text-gray-500 hover:text-gray-800 pt-1"
                  >
                    Réinitialiser couleur
                  </button>
                </div>
              )}
            </div>

            {/* Alignments */}
            <div className="flex items-center gap-0.5 pr-1 border-r border-gray-200">
              <button
                type="button"
                onClick={() => exec('justifyLeft')}
                className={`p-1.5 rounded transition-colors ${
                  activeStyles.align === 'left' ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-200 text-gray-700'
                }`}
                title="Aligner à gauche"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => exec('justifyCenter')}
                className={`p-1.5 rounded transition-colors ${
                  activeStyles.align === 'center' ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-200 text-gray-700'
                }`}
                title="Centrer"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => exec('justifyRight')}
                className={`p-1.5 rounded transition-colors ${
                  activeStyles.align === 'right' ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-200 text-gray-700'
                }`}
                title="Aligner à droite"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => exec('justifyFull')}
                className={`p-1.5 rounded transition-colors ${
                  activeStyles.align === 'justify' ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-200 text-gray-700'
                }`}
                title="Justifier"
              >
                <AlignJustify className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Lists: Bullets & Numbers */}
            <div className="flex items-center gap-0.5 pr-1 border-r border-gray-200">
              <button
                type="button"
                onClick={() => exec('insertUnorderedList')}
                className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors"
                title="Liste à puces"
              >
                <List className="w-3.5 h-3.5 text-[#92278F]" />
              </button>
              <button
                type="button"
                onClick={() => exec('insertOrderedList')}
                className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors"
                title="Liste numérotée"
              >
                <ListOrdered className="w-3.5 h-3.5 text-[#FF8C00]" />
              </button>
            </div>

            {/* Quote & Horizontal Separator */}
            <div className="flex items-center gap-0.5 pr-1 border-r border-gray-200">
              <button
                type="button"
                onClick={() => exec('formatBlock', '<blockquote>')}
                className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors"
                title="Citation institutionnelle"
              >
                <Quote className="w-3.5 h-3.5 text-[#92278F]" />
              </button>
              <button
                type="button"
                onClick={() => exec('insertHorizontalRule')}
                className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors"
                title="Ligne séparatrice (HR)"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Links */}
            <div className="flex items-center gap-0.5 pr-1 border-r border-gray-200">
              <button
                type="button"
                onClick={openLinkModal}
                className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors"
                title="Insérer ou modifier un lien hypertexte"
              >
                <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
              </button>
              <button
                type="button"
                onClick={() => exec('unlink')}
                className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors"
                title="Supprimer le lien"
              >
                <Unlink className="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>

            {/* Clear formatting */}
            <div className="flex items-center ml-auto">
              <button
                type="button"
                onClick={() => exec('removeFormat')}
                className="p-1.5 rounded hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors"
                title="Supprimer toute la mise en forme"
              >
                <RemoveFormatting className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        {viewMode === 'edit' ? (
          <div
            id={id}
            ref={editorRef}
            contentEditable={!disabled}
            onInput={handleInput}
            onKeyUp={updateActiveState}
            onMouseUp={updateActiveState}
            onPaste={(e) => {
              // Standard paste handling
              setTimeout(handleInput, 10);
            }}
            data-placeholder={placeholder}
            style={{ minHeight }}
            className={`p-4 outline-hidden text-sm text-gray-800 leading-relaxed font-sans overflow-y-auto ${
              !value || value === '<p><br></p>' ? 'empty-editor' : ''
            }`}
          />
        ) : (
          <div
            style={{ minHeight }}
            className="p-6 bg-purple-50/20 border-t border-purple-100 overflow-y-auto"
          >
            <div className="mb-4 pb-2 border-b border-purple-200/60 flex items-center justify-between text-xs text-[#92278F] font-bold">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-[#FF8C00]" />
                <span>Rendu public fidèle (Sanitisation et feuille de style APS-BÉNIN activées)</span>
              </span>
              <span className="text-[11px] font-normal text-gray-500">
                Aperçu non encore publié
              </span>
            </div>

            {value && value.trim() ? (
              <RichTextContent content={value} />
            ) : (
              <p className="text-gray-400 italic text-xs">
                Aucun contenu saisi à prévisualiser pour l&apos;instant.
              </p>
            )}
          </div>
        )}

        {/* Footer info: Character and Word count */}
        <div className="bg-gray-50/80 border-t border-gray-100 px-3 py-1.5 flex items-center justify-between text-[11px] text-gray-400 select-none">
          <div className="flex items-center gap-3">
            <span>{wordCount} mot{wordCount > 1 ? 's' : ''}</span>
            <span>•</span>
            <span>{charCount} caractère{charCount > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span>Open Sans / Montserrat</span>
            <span>•</span>
            <span className="text-emerald-600 font-medium">WYSIWYG Actif</span>
          </div>
        </div>
      </div>

      {helpText && (
        <p className="text-[11px] text-gray-500 mt-1">
          {helpText}
        </p>
      )}

      {/* Link Insertion Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xl max-w-md w-full space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-[#92278F]" />
                <span>Insérer ou modifier un lien</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Adresse URL cible *
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://exemple.org ou /projets/mon-projet..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:border-[#92278F] focus:outline-hidden"
                  autoFocus
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Vous pouvez saisir une adresse web externe sécurisée (https://) ou une route relative interne (/...).
                </p>
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={linkOpenNewTab}
                  onChange={(e) => setLinkOpenNewTab(e.target.checked)}
                  className="rounded border-gray-300 text-[#92278F] focus:ring-[#92278F] w-4 h-4"
                />
                <span>Ouvrir dans un nouvel onglet (recommandé pour les liens externes)</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-colors shadow-2xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Appliquer le lien</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
