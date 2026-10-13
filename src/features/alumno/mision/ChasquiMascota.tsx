import React from 'react';

export interface ChasquiMascotaProps {
  estado?: 'normal' | 'festejo' | 'pensando' | 'tranquilo';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ChasquiMascota: React.FC<ChasquiMascotaProps> = ({
  estado = 'normal',
  className = '',
  size = 'md',
}) => {
  const sizeMap = {
    sm: 'w-14 h-14',
    md: 'w-20 h-20 sm:w-24 sm:h-24',
    lg: 'w-28 h-28 sm:w-32 sm:h-32',
  };

  const isFestejo = estado === 'festejo';
  const isPensando = estado === 'pensando';

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${
        sizeMap[size]
      } ${isFestejo ? 'animate-mascota-festejo' : ''} ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        {/* Sombra suave de apoyo debajo de Chasqui */}
        <ellipse cx="50" cy="94" rx="30" ry="5" fill="#201e1d" fillOpacity="0.12" />

        {/* Poncho / Torso */}
        <path
          d="M26 66C26 58 34 52 50 52C66 52 74 58 74 66L78 88C78 90 76 92 73 92H27C24 92 22 90 22 88L26 66Z"
          fill="var(--color-accent-strong, #bf4231)"
        />
        {/* Detalle franja del poncho */}
        <path
          d="M28 74H72L74 84H26L28 74Z"
          fill="var(--color-accent, #e15b47)"
        />
        <path
          d="M36 77L40 81L44 77L48 81L52 77L56 81L60 77L64 81"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Brazos */}
        {isFestejo ? (
          <>
            {/* Brazos arriba festejando */}
            <path
              d="M24 64C16 56 12 42 16 36C18 34 22 36 24 44L28 60"
              fill="var(--color-accent-strong, #bf4231)"
            />
            <circle cx="16" cy="35" r="4.5" fill="#ffd8b3" />
            <path
              d="M76 64C84 56 88 42 84 36C82 34 78 36 76 44L72 60"
              fill="var(--color-accent-strong, #bf4231)"
            />
            <circle cx="84" cy="35" r="4.5" fill="#ffd8b3" />
          </>
        ) : isPensando ? (
          <>
            {/* Brazo izquierdo normal */}
            <path
              d="M26 64C20 68 18 78 20 84C22 85 24 84 26 78L28 66"
              fill="var(--color-accent-strong, #bf4231)"
            />
            {/* Brazo derecho a la barbilla pensando */}
            <path
              d="M74 64C76 56 70 48 60 48C58 48 57 50 58 52C64 54 68 60 68 68"
              fill="var(--color-accent-strong, #bf4231)"
            />
            <circle cx="58" cy="49" r="4.5" fill="#ffd8b3" />
          </>
        ) : (
          <>
            {/* Brazos a los costados saludando */}
            <path
              d="M26 64C20 68 18 76 22 82C24 83 26 82 27 77L28 66"
              fill="var(--color-accent-strong, #bf4231)"
            />
            <circle cx="21" cy="80" r="4" fill="#ffd8b3" />
            <path
              d="M74 64C80 66 84 68 86 64C88 60 84 54 78 52L72 66"
              fill="var(--color-accent-strong, #bf4231)"
            />
            <circle cx="86" cy="62" r="4" fill="#ffd8b3" />
          </>
        )}

        {/* Cuello */}
        <rect x="44" y="46" width="12" height="10" rx="3" fill="#ffd8b3" />

        {/* Cabeza */}
        <circle cx="50" cy="34" r="21" fill="#ffe0c2" />

        {/* Vincha andina con plumita / cinta */}
        <path
          d="M29 32C33 24 41 20 50 20C59 20 67 24 71 32L69 36C65 29 58 25 50 25C42 25 35 29 31 36L29 32Z"
          fill="var(--color-accent-strong, #bf4231)"
        />
        {/* Detalle geométrico de la vincha */}
        <path
          d="M34 29L37 25L40 29L43 25L46 29L49 25L52 29L55 25L58 29L61 25L64 29"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Plumita festiva */}
        <path
          d="M33 25C31 16 35 8 38 6C39 12 37 18 35 24Z"
          fill="#ffaa00"
        />

        {/* Cabello flequillo */}
        <path
          d="M31 30C35 34 38 31 43 32C47 31 53 31 57 32C62 31 66 33 69 30C66 26 59 23 50 23C41 23 34 26 31 30Z"
          fill="#2b1810"
        />

        {/* Ojos */}
        {isFestejo ? (
          <>
            {/* Ojos felices achinados ^ ^ */}
            <path
              d="M40 37C42 34 45 34 47 37"
              stroke="#201e1d"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M53 37C55 34 58 34 60 37"
              stroke="#201e1d"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </>
        ) : isPensando ? (
          <>
            {/* Ojos mirando hacia arriba */}
            <circle cx="43" cy="34" r="3.2" fill="#201e1d" />
            <circle cx="44.2" cy="33" r="1.2" fill="#ffffff" />
            <circle cx="57" cy="34" r="3.2" fill="#201e1d" />
            <circle cx="58.2" cy="33" r="1.2" fill="#ffffff" />
          </>
        ) : (
          <>
            {/* Ojos grandes y amigables con brillo */}
            <circle cx="43" cy="36" r="3.5" fill="#201e1d" />
            <circle cx="44.5" cy="34.5" r="1.3" fill="#ffffff" />
            <circle cx="57" cy="36" r="3.5" fill="#201e1d" />
            <circle cx="58.5" cy="34.5" r="1.3" fill="#ffffff" />
          </>
        )}

        {/* Mejillas sonrosadas */}
        <circle cx="36" cy="40" r="3" fill="#ff7a6b" fillOpacity="0.45" />
        <circle cx="64" cy="40" r="3" fill="#ff7a6b" fillOpacity="0.45" />

        {/* Nariz tierna */}
        <path
          d="M50 37L48.5 40H51.5L50 37Z"
          fill="#e0a07a"
        />

        {/* Sonrisa */}
        {isFestejo ? (
          <path
            d="M44 42C44 47 56 47 56 42H44Z"
            fill="#c42a10"
            stroke="#201e1d"
            strokeWidth="1.5"
          />
        ) : (
          <path
            d="M44 42C46 45 54 45 56 42"
            stroke="#201e1d"
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}

        {/* Destellos de éxito si está en festejo */}
        {isFestejo && (
          <>
            <path
              d="M14 18L17 21M17 18L14 21"
              stroke="#ffaa00"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M84 16L87 19M87 16L84 19"
              stroke="#ffaa00"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="24" cy="12" r="2" fill="var(--color-accent, #e15b47)" />
            <circle cx="76" cy="10" r="2.5" fill="var(--color-accent, #e15b47)" />
          </>
        )}
      </svg>
    </div>
  );
};
