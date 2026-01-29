"use client";

import Link from 'next/link';
import { FaYoutube, FaInstagram, FaTiktok, FaFacebook, FaTwitter, FaTelegram, FaTwitch, FaDiscord } from 'react-icons/fa';
import { SiThreads } from 'react-icons/si';
import { cn } from '@/lib/utils';

const PLATFORM_FILTERS = [
  { id: 'all', label: '전체', icon: null, color: 'white' },
  { id: '유튜브', label: '유튜브', icon: FaYoutube, color: '#FF0000' },
  { id: '인스타그램', label: '인스타그램', icon: FaInstagram, color: '#E4405F' },
  { id: '틱톡', label: '틱톡', icon: FaTiktok, color: '#00f2ea' },
  { id: '페이스북', label: '페이스북', icon: FaFacebook, color: '#1877F2' },
  { id: '트위터', label: 'X(트위터)', icon: FaTwitter, color: '#1DA1F2' },
  { id: '텔레그램', label: '텔레그램', icon: FaTelegram, color: '#0088CC' },
  { id: '트위치', label: '트위치', icon: FaTwitch, color: '#9146FF' },
  { id: '디스코드', label: '디스코드', icon: FaDiscord, color: '#5865F2' },
  { id: '스레드', label: '스레드', icon: SiThreads, color: '#ffffff' },
  { id: 'SMM', label: 'SMM 팁', icon: null, color: '#00C896' },
] as const;

export function PlatformFilter({
  currentPlatform
}: {
  currentPlatform: string;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2 mb-8">
      {PLATFORM_FILTERS.map((filter) => {
        const isActive = currentPlatform === filter.id || (currentPlatform === '' && filter.id === 'all');
        const Icon = filter.icon;

        return (
          <Link
            key={filter.id}
            href={filter.id === 'all' ? '/blog' : `/blog?platform=${encodeURIComponent(filter.id)}`}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-white/10 border border-white/20 text-white'
                : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
            )}
            style={isActive && filter.color !== 'white' ? {
              borderColor: `${filter.color}50`,
              backgroundColor: `${filter.color}15`
            } : undefined}
          >
            {Icon && <Icon className="w-4 h-4" style={{ color: filter.color }} />}
            {filter.label}
          </Link>
        );
      })}
    </div>
  );
}

export { PLATFORM_FILTERS };

