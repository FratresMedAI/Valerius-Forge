import { useEffect, useState } from 'react';
import { on } from '../lib/forgeEvents';

export function Hero() {
  const [forging, setForging] = useState(false);

  useEffect(() => {
    const offStart = on('valerius:forge-start', () => setForging(true));
    const offEnd = on('valerius:forge-end', () => setForging(false));
    return () => {
      offStart();
      offEnd();
    };
  }, []);

  return (
    <header className="relative pt-20 pb-6 text-center">
      <div className="flex items-end justify-center gap-3">
        <img
          src="/templar-helm.png"
          alt="Valerius Helm"
          className={
            'valerius-shine h-20 w-auto sm:h-24 ' + (forging ? 'valerius-helm-pulsing is-active' : '')
          }
          draggable={false}
        />
        <h1 className="font-title text-6xl text-templar-sand sm:text-7xl -ml-7">Valerius</h1>
      </div>
      <p className="mx-auto mt-5 font-title text-lg text-templar-sand sm:text-xl">Command Code.</p>
      <div className="mx-auto mt-8 h-px w-24 bg-gradient-to-r from-transparent via-templar-sand to-transparent" />
    </header>
  );
}
