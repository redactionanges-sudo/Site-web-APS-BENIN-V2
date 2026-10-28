'use client';

import React, { useState, useEffect } from 'react';
import { Eye, Heart, Share2, Copy, Check, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { SocialPlatformIcon } from '@/components/admin/SocialPlatformIcon';

interface ContentEngagementBarProps {
  type: 'project' | 'news';
  id: string;
  title: string;
  initialViews?: number;
  initialLikes?: number;
  className?: string;
}

export const ContentEngagementBar: React.FC<ContentEngagementBarProps> = ({
  type,
  id,
  title,
  initialViews = 0,
  initialLikes = 0,
  className = '',
}) => {
  const { language } = useLanguage();
  const [views, setViews] = useState<number>(initialViews);
  const [likes, setLikes] = useState<number>(initialLikes);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isLiking, setIsLiking] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [shareOpen, setShareOpen] = useState<boolean>(false);

  const storageKey = `aps_liked_${type}_${id}`;
  const viewSessionKey = `aps_viewed_${type}_${id}`;

  useEffect(() => {
    try {
      const alreadyLiked = localStorage.getItem(storageKey) === 'true';
      setIsLiked(alreadyLiked);
    } catch {
      // Ignorer si localStorage restreint
    }

    fetch(`/api/interactions?type=${type}&id=${encodeURIComponent(id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (typeof data.views === 'number') setViews(data.views);
          if (typeof data.likes === 'number') setLikes(data.likes);
        }
      })
      .catch(() => {});

    try {
      const alreadyViewed = sessionStorage.getItem(viewSessionKey);
      if (!alreadyViewed) {
        sessionStorage.setItem(viewSessionKey, 'true');
        fetch('/api/interactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, id, action: 'view' }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success && typeof data.views === 'number') {
              setViews(data.views);
            }
          })
          .catch(() => {});
      }
    } catch {
      // Ignorer si sessionStorage restreint
    }
  }, [type, id, storageKey, viewSessionKey]);

  const handleToggleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    const nextLikedState = !isLiked;
    const action = nextLikedState ? 'like' : 'unlike';

    setIsLiked(nextLikedState);
    setLikes((prev) => (nextLikedState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      if (nextLikedState) {
        localStorage.setItem(storageKey, 'true');
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch {
      // fallback
    }

    try {
      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, action }),
      });
      const data = await res.json();
      if (data.success && typeof data.likes === 'number') {
        setLikes(data.likes);
      }
    } catch (err) {
      console.warn('Failed to persist like action:', err);
    } finally {
      setIsLiking(false);
    }
  };

  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '';
  };

  const handleCopyLink = () => {
    const url = getShareUrl();
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleNativeShare = () => {
    const url = getShareUrl();
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      (navigator as any)
        .share({
          title,
          url,
        })
        .catch(() => {});
    } else {
      setShareOpen(!shareOpen);
    }
  };

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-white border border-gray-200/90 shadow-2xs ${className}`}
    >
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200/80 text-gray-700 text-xs font-semibold"
          title={
            language === 'en'
              ? `${views} total views for this publication`
              : `${views} vue${views > 1 ? 's' : ''} au total pour cette publication`
          }
        >
          <Eye className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-bold text-gray-900">{views}</span>
          <span className="text-gray-500">
            {language === 'en' ? (views > 1 ? 'views' : 'view') : views > 1 ? 'vues' : 'vue'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleToggleLike}
          disabled={isLiking}
          aria-label={isLiked ? "Je n'aime plus cette publication" : "J'aime cette publication"}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
            isLiked
              ? 'bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs'
              : 'bg-gray-50 hover:bg-rose-50/60 text-gray-700 hover:text-rose-600 border border-gray-200/80'
          }`}
          title={
            isLiked
              ? language === 'en'
                ? 'You liked this content (click to unlike)'
                : 'Vous aimez ce contenu (cliquer pour retirer votre mention)'
              : language === 'en'
              ? 'Like this content'
              : 'Aimer ce contenu'
          }
        >
          <Heart
            className={`w-4 h-4 transition-transform duration-200 ${
              isLiked ? 'fill-rose-500 text-rose-500 scale-110' : 'text-gray-400'
            }`}
          />
          <span className="font-bold">{likes}</span>
          <span className="hidden xs:inline font-medium">
            {language === 'en' ? "Like" : "J’aime"}
          </span>
        </button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-bold text-gray-400 mr-1 hidden sm:inline">
          {language === 'en' ? 'Share:' : 'Partager :'}
        </span>

        <a
          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
            `${title} - APS-BÉNIN : ${getShareUrl()}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Partager sur WhatsApp"
          aria-label="Partager sur WhatsApp"
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-50 hover:bg-green-100 text-green-600 border border-green-200 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
        </a>

        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Partager sur Facebook"
          aria-label="Partager sur Facebook"
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-[#1877F2] border border-blue-200 transition-colors"
        >
          <SocialPlatformIcon platform="facebook" size={16} />
        </a>

        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
            title
          )}&url=${encodeURIComponent(getShareUrl())}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Partager sur X (Twitter)"
          aria-label="Partager sur X"
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 transition-colors"
        >
          <SocialPlatformIcon platform="twitter" size={14} />
        </a>

        <button
          type="button"
          onClick={handleCopyLink}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            copied
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
          }`}
          title="Copier l'adresse de cette page"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'en' ? 'Copied!' : 'Copié !'}</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-gray-500" />
              <span className="hidden xs:inline">{language === 'en' ? 'Copy link' : 'Copier'}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleNativeShare}
          className="sm:hidden w-8 h-8 rounded-lg flex items-center justify-center bg-purple-50 hover:bg-purple-100 text-[#92278F] border border-purple-200"
          title="Partager"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
