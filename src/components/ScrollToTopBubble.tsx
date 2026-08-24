import React, { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

const SHOW_AFTER_PX = 240;

const getScrollOffset = () => {
  let max = window.scrollY || document.documentElement.scrollTop || 0;
  document.querySelectorAll<HTMLElement>('[class*="overflow-y-auto"], [class*="overflow-auto"]').forEach((el) => {
    if (el.scrollTop > max) max = el.scrollTop;
  });
  return max;
};

const scrollEverythingToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
  document.body.scrollTo({ top: 0, behavior: 'smooth' });
  document.querySelectorAll<HTMLElement>('[class*="overflow-y-auto"], [class*="overflow-auto"]').forEach((el) => {
    el.scrollTo({ top: 0, behavior: 'smooth' });
  });
};

export const ScrollToTopBubble: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(getScrollOffset() > SHOW_AFTER_PX);
    update();
    window.addEventListener('scroll', update, { capture: true, passive: true });
    return () => window.removeEventListener('scroll', update, true);
  }, []);

  return (
    <button
      type="button"
      onClick={scrollEverythingToTop}
      aria-label="Ir arriba"
      title="Ir arriba"
      className={`fixed bottom-6 left-4 z-[55] w-12 h-12 rounded-full bg-[#0A3D62]/30 text-white shadow-lg border-2 border-[#2ECC71]/40 backdrop-blur-sm flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105 hover:bg-[#0A3D62]/55 ${
        visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
    >
      <ChevronUp className="w-6 h-6" strokeWidth={2.4} />
    </button>
  );
};
