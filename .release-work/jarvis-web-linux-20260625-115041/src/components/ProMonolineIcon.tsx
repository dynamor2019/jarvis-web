'use client';

export default function ProMonolineIcon({
  className = 'h-5 w-5',
  strokeWidth = 1.8,
  variant = 'pro',
}: {
  className?: string;
  strokeWidth?: number;
  variant?:
    | 'pro'
    | 'ai'
    | 'formula'
    | 'assistant'
    | 'document'
    | 'text'
    | 'paragraph'
    | 'table'
    | 'image'
    | 'library'
    | 'productivity'
    | 'palette'
    | 'theme'
    | 'settings'
    | 'pet'
    | 'spark'
    | 'shield'
    | 'puzzle'
    | 'lightning'
    | 'chat'
    | 'download';
}) {
  const path_map: Record<string, JSX.Element> = {
    pro: (
      <>
        <path d="M12 3 20 8v8l-8 5-8-5V8Z" />
        <path d="M12 7v10" />
        <path d="m8.5 9.5 7 5" />
        <path d="m15.5 9.5-7 5" />
      </>
    ),
    ai: (
      <>
        <rect x="4" y="6" width="16" height="12" rx="3" />
        <path d="M9 10h6M9 14h3" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
      </>
    ),
    formula: (
      <>
        <path d="M4 6h6M4 18h6M9 6 5 12l4 6" />
        <path d="M15 8v8M12 12h6" />
      </>
    ),
    assistant: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="2" />
        <path d="M12 4v2M12 18v2M4 12h2M18 12h2" />
      </>
    ),
    document: (
      <>
        <path d="M7 3h8l4 4v14H7z" />
        <path d="M15 3v4h4M9 12h8M9 16h6" />
      </>
    ),
    text: (
      <>
        <path d="M5 7h14M12 7v10M8 17h8" />
      </>
    ),
    paragraph: (
      <>
        <path d="M6 7h9M6 11h9M6 15h9" />
        <path d="M17 7v10m0 0-2-2m2 2 2-2" />
      </>
    ),
    table: (
      <>
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="M4 10h16M4 14h16M10 5v14M15 5v14" />
      </>
    ),
    image: (
      <>
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <circle cx="9" cy="10" r="1.5" />
        <path d="m6 16 4-3 3 2 3-3 2 4" />
      </>
    ),
    library: (
      <>
        <path d="M4 19h16M6 6h2v13H6zM11 4h2v15h-2zM16 7h2v12h-2z" />
      </>
    ),
    productivity: (
      <>
        <path d="M12 3v8M12 11l3-3M12 11 9 8" />
        <rect x="5" y="13" width="14" height="8" rx="2" />
      </>
    ),
    palette: (
      <>
        <path d="M12 4a8 8 0 1 0 0 16h2a2 2 0 0 0 0-4h-2a2 2 0 0 1 0-4h2" />
        <circle cx="8" cy="9" r="1" />
        <circle cx="11" cy="7" r="1" />
        <circle cx="15" cy="8" r="1" />
      </>
    ),
    theme: (
      <>
        <path d="M12 3v18M3 12h18" />
        <circle cx="12" cy="12" r="6" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4" />
      </>
    ),
    pet: (
      <>
        <path d="M6 14c0-3 2.5-5 6-5s6 2 6 5-2 5-6 5-6-2-6-5Z" />
        <circle cx="9" cy="8" r="1.5" />
        <circle cx="15" cy="8" r="1.5" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 19 6v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" />
        <path d="m9.5 12 2 2 3-3" />
      </>
    ),
    puzzle: (
      <>
        <path d="M8 4h4a2 2 0 1 1 4 0h4v4a2 2 0 1 1 0 4v4h-4a2 2 0 1 1-4 0H8v-4a2 2 0 1 1 0-4z" />
      </>
    ),
    lightning: (
      <>
        <path d="m13 2-7 10h5l-1 10 8-12h-5z" />
      </>
    ),
    chat: (
      <>
        <path d="M5 6h14v9H9l-4 3z" />
      </>
    ),
    download: (
      <>
        <path d="M12 4v10m0 0-4-4m4 4 4-4" />
        <path d="M5 18h14" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {path_map[variant] || path_map.pro}
    </svg>
  );
}
