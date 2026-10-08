'use client';

import React, { useEffect, useState } from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { supabaseStore } from '@/lib/supabase';
import { ContactMessage } from '@/types';
import {
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Trash2,
  Eye,
  Reply,
  X,
  Search,
} from 'lucide-react';

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'replied'>('all');
  const [search, setSearch] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [internalNote, setInternalNote] = useState('');

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [msgToDelete, setMsgToDelete] = useState<ContactMessage | null>(null);

  const loadMessages = async () => {
    const list = await supabaseStore.getMessages();
    setMessages(list);
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const openMessageDetail = async (msg: ContactMessage) => {
    setSelectedMessage(msg);
    setInternalNote(msg.notes || '');
    if (msg.status === 'unread') {
      const updated = await supabaseStore.updateMessageStatus(msg.id, 'read');
      setMessages(updated);
    }
  };

  const updateStatus = async (id: string, status: 'unread' | 'read' | 'replied') => {
    const updated = await supabaseStore.updateMessageStatus(id, status, internalNote);
    setMessages(updated);
    if (selectedMessage && selectedMessage.id === id) {
      setSelectedMessage({ ...selectedMessage, status, notes: internalNote });
    }
  };

  const confirmDelete = async () => {
    if (!msgToDelete) return;
    const updated = await supabaseStore.deleteMessage(msgToDelete.id);
    setMessages(updated);
    setDeleteConfirmOpen(false);
    setMsgToDelete(null);
    if (selectedMessage?.id === msgToDelete.id) {
      setSelectedMessage(null);
    }
  };

  const filtered = messages.filter((m) => {
    const matchesFilter = filter === 'all' || m.status === filter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.firstname.toLowerCase().includes(q) ||
      m.subject.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  return (
    <AdminAuthGuard>
      <AdminHeader
        title="Boîte de Réception des Messages"
        subtitle="Messages envoyés depuis le formulaire de contact du site officiel APS-BÉNIN"
      />

      <main className="p-6 space-y-6 max-w-7xl">
        {/* Filter bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                filter === 'all' ? 'bg-[#92278F] text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Tous ({messages.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                filter === 'unread' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Non lus ({messages.filter(m => m.status === 'unread').length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('read')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                filter === 'read' ? 'bg-[#FF8C00] text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Lus
            </button>
            <button
              type="button"
              onClick={() => setFilter('replied')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                filter === 'replied' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Traités / Répondus
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, email..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#92278F] bg-white"
            />
          </div>
        </div>

        {/* Messages List Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Expéditeur</th>
                  <th className="py-3 px-4">Objet</th>
                  <th className="py-3 px-4">Date de réception</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filtered.map((msg) => (
                  <tr
                    key={msg.id}
                    onClick={() => openMessageDetail(msg)}
                    className={`cursor-pointer transition-colors ${
                      msg.status === 'unread' ? 'bg-purple-50/40 font-semibold' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div>
                        <span className="text-gray-900 block font-bold">
                          {msg.firstname} {msg.name}
                        </span>
                        <span className="text-[11px] text-gray-500">{msg.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="max-w-xs sm:max-w-md">
                        <span className="text-gray-900 block truncate font-medium">
                          {msg.subject}
                        </span>
                        <span className="text-[11px] text-gray-400 truncate block">
                          {msg.message}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                      {new Date(msg.created_at).toLocaleString('fr-FR')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          msg.status === 'unread'
                            ? 'bg-red-100 text-red-800'
                            : msg.status === 'read'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {msg.status === 'unread'
                          ? 'Non lu'
                          : msg.status === 'read'
                          ? 'Lu'
                          : 'Traité / Répondu'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openMessageDetail(msg)}
                          title="Consulter"
                          className="p-1 rounded hover:bg-purple-100 text-[#92278F]"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMsgToDelete(msg);
                            setDeleteConfirmOpen(true);
                          }}
                          title="Supprimer"
                          className="p-1 rounded hover:bg-red-100 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Message Detail Modal */}
        {selectedMessage && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex items-start justify-between pb-4 border-b border-gray-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF8C00]">
                    Message reçu
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 font-heading">
                    {selectedMessage.subject}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Reçu le {new Date(selectedMessage.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="p-1 rounded text-gray-400 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sender Details Card */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-500 font-medium block">Expéditeur :</span>
                  <strong className="text-gray-900 text-sm">
                    {selectedMessage.firstname} {selectedMessage.name}
                  </strong>
                </div>

                <div>
                  <span className="text-gray-500 font-medium block">Email :</span>
                  <a
                    href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                    className="font-bold text-[#92278F] hover:underline"
                  >
                    {selectedMessage.email}
                  </a>
                </div>

                <div>
                  <span className="text-gray-500 font-medium block">Téléphone :</span>
                  <span className="font-semibold text-gray-800">
                    {selectedMessage.phone || 'Non renseigné'}
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 font-medium block">Consentement RGPD :</span>
                  <span className="text-green-700 font-bold">Validé par l'utilisateur</span>
                </div>
              </div>

              {/* Message Content */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Corps du message :
                </label>
                <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 text-xs sm:text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Internal notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Notes internes (Réservé à l'équipe) :
                </label>
                <input
                  type="text"
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Ex : Répondu par Patrice le 02/10, dossier orienté vers la cellule VBG..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateStatus(selectedMessage.id, 'unread')}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50"
                  >
                    Marquer comme non lu
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(selectedMessage.id, 'replied')}
                    className="px-3 py-1.5 rounded-lg bg-green-700 text-white text-xs font-bold hover:bg-green-800"
                  >
                    Marquer comme Traité
                  </button>
                </div>

                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#92278F] text-white text-xs font-bold hover:bg-[#741772]"
                >
                  <Reply className="w-4 h-4 text-[#FF8C00]" />
                  <span>Répondre par email</span>
                </a>
              </div>
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={deleteConfirmOpen}
          title="Supprimer ce message ?"
          message={`Êtes-vous sûr de vouloir supprimer définitivement le message de ${msgToDelete?.firstname} ${msgToDelete?.name} ?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirmOpen(false)}
        />
      </main>
    </AdminAuthGuard>
  );
}
