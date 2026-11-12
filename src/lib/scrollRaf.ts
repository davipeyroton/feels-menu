export type ScrollRafHandler = (() => void) & { cancel: () => void };

export function createScrollRafHandler(run: () => void): ScrollRafHandler {
  let raf = 0;
  const onScroll = (() => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      run();
    });
  }) as ScrollRafHandler;

  onScroll.cancel = () => {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  return onScroll;
}
