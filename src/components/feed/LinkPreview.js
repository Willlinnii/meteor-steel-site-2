import React from 'react';

const PLATFORM_ICONS = {
  'instagram.com': { label: 'Instagram', icon: '\uD83D\uDCF7' },
  'facebook.com': { label: 'Facebook', icon: '\uD83D\uDC64' },
  'linkedin.com': { label: 'LinkedIn', icon: '\uD83D\uDCBC' },
  'youtube.com': { label: 'YouTube', icon: '\u25B6\uFE0F' },
  'youtu.be': { label: 'YouTube', icon: '\u25B6\uFE0F' },
  'twitter.com': { label: 'Twitter', icon: '\uD83D\uDC26' },
  'x.com': { label: 'X', icon: '\uD83D\uDC26' },
  'tiktok.com': { label: 'TikTok', icon: '\uD83C\uDFB5' },
};

function getPlatformInfo(url) {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    for (const [domain, info] of Object.entries(PLATFORM_ICONS)) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return info;
      }
    }
    return { label: hostname, icon: '\uD83D\uDD17' };
  } catch {
    return { label: 'Link', icon: '\uD83D\uDD17' };
  }
}

function getDisplayPath(url) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/$/, '');
    return path.length > 1 ? path : parsed.hostname;
  } catch {
    return url;
  }
}

export default function LinkPreview({ url }) {
  if (!url) return null;

  const platform = getPlatformInfo(url);
  const displayPath = getDisplayPath(url);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="feed-link-preview"
    >
      <span className="feed-link-preview-icon">{platform.icon}</span>
      <div className="feed-link-preview-info">
        <div className="feed-link-preview-platform">{platform.label}</div>
        <div className="feed-link-preview-path">{displayPath}</div>
      </div>
    </a>
  );
}
