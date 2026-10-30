function SolidIcon({
  size = 22,
  viewBox = "0 0 256 256",
  path,
}: {
  size?: number;
  viewBox?: string;
  path: string;
}) {
  return (
    <svg viewBox={viewBox} width={size} height={size} aria-hidden>
      <path fill="currentColor" d={path} />
    </svg>
  );
}

/** OpenMoji 27A1 “right arrow” (CC BY-SA 4.0), filled so it follows the button color. */
export function HubArrowIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 72 72" width={size} height={size} aria-hidden>
      <polygon
        fill="currentColor"
        points="49.2124,51.5343 67,35.0363 49.2124,18.5382 45.4234,22.6138 55.8191,32.2554 5,32.2554 5,37.8171 55.8191,37.8171 45.4234,47.4587"
      />
    </svg>
  );
}

export function HubCashbackIcon({ size = 22 }: { size?: number }) {
  return (
    <SolidIcon
      size={size}
      path="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm12,152h-4v8a8,8,0,0,1-16,0v-8H104a8,8,0,0,1,0-16h36a12,12,0,0,0,0-24H116a28,28,0,0,1,0-56h4V72a8,8,0,0,1,16,0v8h16a8,8,0,0,1,0,16H116a12,12,0,0,0,0,24h24a28,28,0,0,1,0,56Z"
    />
  );
}

export function HubLoyaltyIcon({ size = 22 }: { size?: number }) {
  return (
    <SolidIcon
      size={size}
      path="M240,102c0,70-103.79,126.66-108.21,129a8,8,0,0,1-7.58,0C119.79,228.66,16,172,16,102A62.07,62.07,0,0,1,78,40c20.65,0,38.73,8.88,50,23.89C139.27,48.88,157.35,40,178,40A62.07,62.07,0,0,1,240,102Z"
    />
  );
}

export function WifiIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path
        d="M2.5 8.5a14 14 0 0 1 19 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
      />
      <path
        d="M5.5 11.8a9.5 9.5 0 0 1 13 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
      />
      <path
        d="M8.6 15a5 5 0 0 1 6.8 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
      />
      <circle cx="12" cy="18.25" r="1.15" fill="currentColor" />
    </svg>
  );
}

/** Google “G” mark — used for Business Profile / review actions. */
export function GoogleBusinessIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
