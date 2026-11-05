import { useEffect, useRef } from 'react';

/**
 * Escape closes only the topmost open layer (modal, drawer, dropdown, lightbox),
 * never everything at once. Layers stack in the order they opened; one capture
 * listener on window handles the key, so neither the layers below nor an
 * embedded viewer see it while a layer is open.
 */
type Layer = { close: () => void };

const stack: Layer[] = [];
let listening = false;

const onKeyDown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !stack.length) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  stack[stack.length - 1].close();
};

const useEscapeLayer = (onClose: () => void, active = true) => {
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    if (!active) return;
    const layer: Layer = { close: () => close.current() };
    stack.push(layer);
    if (!listening) {
      window.addEventListener('keydown', onKeyDown, true);
      listening = true;
    }
    return () => {
      const index = stack.indexOf(layer);
      if (index >= 0) stack.splice(index, 1);
    };
  }, [active]);
};

export default useEscapeLayer;
