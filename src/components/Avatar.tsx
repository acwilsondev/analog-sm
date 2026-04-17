import Image from 'next/image';

const sizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-24 w-24',
};

const pixelSizes = { sm: 32, md: 40, lg: 48, xl: 96 };

interface AvatarProps {
  seed: string;
  username: string;
  avatarUrl?: string | null;
  size?: keyof typeof sizes;
}

export default function Avatar({ seed, username, avatarUrl, size = 'md' }: AvatarProps) {
  const src = avatarUrl ?? `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed)}`;
  const px = pixelSizes[size];

  return (
    <Image
      src={src}
      alt={`${username}'s avatar`}
      width={px}
      height={px}
      className={`${sizes[size]} rounded-full bg-muted object-cover shrink-0`}
      unoptimized={!avatarUrl}
    />
  );
}
