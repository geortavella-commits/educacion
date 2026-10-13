import React, { createContext, useContext, useEffect, useState } from 'react';
import { NivelEducativo } from '@/lib/types';

interface ModoContextType {
  nivel: NivelEducativo;
  setNivel: (nivel: NivelEducativo) => void;
}

const ModoContext = createContext<ModoContextType>({
  nivel: 'secundaria',
  setNivel: () => {},
});

export const useModo = () => useContext(ModoContext);

interface ModoProviderProps {
  nivel?: NivelEducativo;
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

export const ModoProvider: React.FC<ModoProviderProps> = ({
  nivel: initialNivel = 'secundaria',
  children,
  className = '',
}) => {
  const [nivel, setNivel] = useState<NivelEducativo>(initialNivel);

  useEffect(() => {
    setNivel(initialNivel);
  }, [initialNivel]);

  return (
    <ModoContext.Provider value={{ nivel, setNivel }}>
      <div data-modo={nivel} className={`modo-root contents-wrapper ${className}`}>
        {children}
      </div>
    </ModoContext.Provider>
  );
};
