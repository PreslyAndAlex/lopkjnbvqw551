import type { ProductId } from '../data/catalog'

/**
 * Технически рисунки на артикулите — линия, без запълване, като чертеж от
 * сервизно ръководство. Всеки има един акцентен елемент в цвета на артикула;
 * точно той изчезва пръв, когато слезеш достатъчно.
 */

const ACCENT: Record<string, string> = {
  signal: 'var(--signal)',
  nitrox: 'var(--nitrox)',
  steel: 'var(--rail)',
  foam: 'var(--foam)',
}

type Props = { id: ProductId; accent?: string; className?: string }

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function KitArt({ id, accent = 'steel', className }: Props) {
  const a = ACCENT[accent] ?? ACCENT.steel
  return (
    <svg
      viewBox="0 0 120 90"
      className={className}
      role="presentation"
      aria-hidden="true"
      style={{ color: 'var(--haze)' }}
    >
      <g {...base}>{shapes(id, a)}</g>
    </svg>
  )
}

function shapes(id: ProductId, a: string) {
  switch (id) {
    case 'mask':
      return (
        <>
          <path d="M26 34c0-6 5-10 12-10h44c7 0 12 4 12 10v14c0 8-6 13-14 13h-8c-5 0-7-3-10-3s-5 3-10 3h-8c-8 0-14-5-14-13z" />
          <path d="M33 33c0-3 3-5 7-5h16c4 0 6 2 6 5v11c0 4-3 7-7 7h-13c-5 0-9-3-9-8z" stroke={a} />
          <path d="M64 33c0-3 3-5 7-5h11c4 0 6 2 6 5v10c0 5-4 8-9 8h-8c-4 0-7-3-7-7z" stroke={a} />
          <path d="M26 40 12 36M94 40l14-4" />
          <path d="M12 30v14M108 30v14" />
          <path d="M56 58c0 5 3 8 8 8" opacity="0.55" />
        </>
      )
    case 'fins':
      return (
        <>
          <path d="M34 12c-7 0-11 5-11 11 0 14 3 34 8 46 2 5 6 8 11 8s8-4 9-9c3-15 4-33 4-45 0-7-4-11-11-11z" />
          <path d="M28 24h26" stroke={a} />
          <path d="M31 34h20M32 46h17M34 58h13" opacity="0.5" />
          <path d="M78 12c-7 0-11 5-11 11 0 14 3 34 8 46 2 5 6 8 11 8s8-4 9-9c3-15 4-33 4-45 0-7-4-11-11-11z" opacity="0.55" />
          <path d="M72 24h26" stroke={a} opacity="0.7" />
        </>
      )
    case 'smb':
    case 'deco':
      return (
        <>
          <path d="M46 8h20c3 0 5 2 5 5v48c0 4-2 7-5 9l-6 4c-3 2-6 2-9 0l-6-4c-3-2-5-5-5-9V13c0-3 2-5 5-5z" />
          <path d="M41 20h35" stroke={a} />
          <path d="M41 32h35" stroke={id === 'deco' ? 'var(--amber)' : a} opacity="0.8" />
          <path d="M41 44h35" opacity="0.45" />
          <circle cx="26" cy="66" r="13" />
          <circle cx="26" cy="66" r="4" stroke={a} />
          <path d="M52 74v8M60 74v8" opacity="0.6" />
          <path d="M39 66h-13" opacity="0.5" />
        </>
      )
    case 'wetsuit5':
    case 'wetsuit7':
    case 'drysuit':
      return (
        <>
          <path d="M44 10h32l14 10-6 12-6-3v25c0 6-1 12-2 18l-2 15H48l-2-15c-1-6-2-12-2-18V29l-6 3-6-12z" />
          <path d="M60 12v63" stroke={a} />
          {id !== 'wetsuit5' && <path d="M44 22h32" opacity="0.5" />}
          {id === 'drysuit' && (
            <>
              <path d="M30 32 20 44l6 5" stroke={a} />
              <path d="M90 32l10 12-6 5" stroke={a} />
              <path d="M48 80h24" opacity="0.6" />
            </>
          )}
          {id === 'wetsuit7' && <path d="M46 66h28" stroke={a} opacity="0.75" />}
          <circle cx="60" cy="18" r="2.4" stroke={a} />
        </>
      )
    case 'bcd':
      return (
        <>
          <path d="M40 16c-9 0-15 7-15 16v22c0 11 7 19 17 19h36c10 0 17-8 17-19V32c0-9-6-16-15-16z" />
          <rect x="50" y="8" width="20" height="60" rx="9" stroke={a} />
          <path d="M60 8V2" stroke={a} />
          <path d="M25 34H14M95 34h11" opacity="0.6" />
          <path d="M32 68l-4 14M88 68l4 14" opacity="0.6" />
          <path d="M40 46h-8M88 46h-8" opacity="0.45" />
        </>
      )
    case 'reg':
    case 'trimix':
      return (
        <>
          <rect x="14" y="26" width="26" height="26" rx="4" />
          <path d="M14 34H6v10h8" stroke={a} />
          <path d="M40 32c14 0 22 4 30 12" />
          <path d="M40 46c10 2 16 8 20 18" opacity="0.7" />
          <circle cx="84" cy="46" r="14" />
          <circle cx="84" cy="46" r="5" stroke={a} />
          <path d="M84 32v-6M98 46h6" opacity="0.6" />
          {id === 'trimix' && (
            <>
              <circle cx="30" cy="70" r="11" stroke={a} />
              <path d="M30 63v7l5 3" />
              <path d="M60 64c8 0 14-3 19-8" opacity="0.5" />
            </>
          )}
        </>
      )
    case 'octo':
      return (
        <>
          <circle cx="78" cy="52" r="16" stroke={a} />
          <circle cx="78" cy="52" r="6" />
          <path d="M78 36v-5M94 52h5" opacity="0.6" />
          <path d="M62 52c-10 0-14-8-22-8s-12 8-22 8" />
          <path d="M18 52c0-8 6-12 12-12" opacity="0.6" />
          <path d="M30 40c0-10 6-16 14-18" opacity="0.45" />
          <path d="M44 22c8-2 14-4 20-4" opacity="0.35" />
        </>
      )
    case 'torch':
      return (
        <>
          <rect x="16" y="34" width="46" height="22" rx="5" />
          <path d="M62 30h10v30H62z" stroke={a} />
          <path d="M72 34l30-14v50l-30-14z" stroke={a} opacity="0.55" />
          <path d="M24 40h26M24 50h18" opacity="0.4" />
          <path d="M16 40H8v10h8" opacity="0.6" />
        </>
      )
    case 'computer':
      return (
        <>
          <rect x="30" y="16" width="60" height="58" rx="10" />
          <rect x="38" y="26" width="44" height="38" rx="4" stroke={a} />
          <path d="M44 36h14M44 44h22M44 52h10" opacity="0.75" />
          <path d="M70 36h8M70 52h8" opacity="0.45" />
          <path d="M30 30H20v14h10M90 30h10v14H90" opacity="0.6" />
          <circle cx="94" cy="60" r="3" stroke={a} />
        </>
      )
    case 'twinset':
      return (
        <>
          <rect x="26" y="18" width="28" height="60" rx="13" />
          <rect x="66" y="18" width="28" height="60" rx="13" />
          <path d="M40 18v-8M80 18v-8" stroke={a} />
          <path d="M40 10h40" stroke={a} />
          <circle cx="60" cy="10" r="4" stroke={a} />
          <path d="M54 34h12M54 50h12" opacity="0.45" />
          <path d="M30 66h20M70 66h20" opacity="0.4" />
        </>
      )
    default:
      return <rect x="24" y="20" width="72" height="50" rx="6" />
  }
}
