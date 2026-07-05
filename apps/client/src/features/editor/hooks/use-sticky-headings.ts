import { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { userAtom } from '@/features/user/atoms/current-user-atom';

function getScrollContainer(element: HTMLElement | null): HTMLElement | Window {
  let curr = element;
  while (curr && curr !== document.body && curr !== document.documentElement) {
    const style = window.getComputedStyle(curr);
    const isOverflow = style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflowY === 'overlay';
    
    // An element is a true scroller if it has overflow AND actually scrolls, 
    // or if it's explicitly the main container.
    if (isOverflow && (curr.scrollHeight > curr.clientHeight || curr.tagName === 'MAIN' || curr.classList.contains('mantine-AppShell-main'))) {
      return curr;
    }
    curr = curr.parentElement;
  }
  return window;
}

function getScrollY(scroller: HTMLElement | Window) {
  if (scroller === window) return window.scrollY;
  return (scroller as HTMLElement).scrollTop;
}

function getAbsoluteTop(element: HTMLElement, stopAt: HTMLElement | Window = window) {
  let top = 0;
  let curr: HTMLElement | null = element;
  while (curr && curr !== stopAt && curr !== document.body && curr !== document.documentElement) {
    top += curr.offsetTop;
    curr = curr.offsetParent as HTMLElement;
  }
  return top;
}

function getCssPath(el: HTMLElement, container: HTMLElement) {
  let path = '';
  let curr = el;
  while (curr && curr !== container) {
    const parent = curr.parentElement;
    if (!parent) break;
    const index = Array.from(parent.children).indexOf(curr) + 1;
    path = ` > *:nth-child(${index})` + path;
    curr = parent;
  }
  return `#${container.id}` + path;
}

export function useStickyHeadings() {
  const user = useAtomValue(userAtom);
  const enabled = user?.settings?.preferences?.stickyHeadings !== false;
  
  useEffect(() => {
    let ticking = false;
    let observer: MutationObserver | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let containerRef: HTMLElement | null = null;

    const styleTagId = 'docmost-sticky-headings-style';
    let styleTag = document.getElementById(styleTagId);
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleTagId;
      document.head.appendChild(styleTag);
    }

    const handler = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateHeadings();
          ticking = false;
        });
        ticking = true;
      }
    };

    const updateHeadings = () => {
      const allContainers = Array.from(document.querySelectorAll('.ProseMirror')).filter(c => !c.closest('.page-title')) as HTMLElement[];
      if (allContainers.length === 0) return;
      
      let css = '';

      allContainers.forEach((container, containerIndex) => {
        if (!container.id) {
          container.id = 'docmost-editor-container-' + containerIndex + '-' + Math.random().toString(36).substr(2, 9);
        }

        const scroller = getScrollContainer(container);

        // Force overflow: visible on all ancestors between ProseMirror and the true scroller.
        let parent = container.parentElement;
        const badOverflows = ['hidden', 'clip', 'auto', 'scroll', 'overlay'];
        while (parent && parent !== scroller && parent !== document.body) {
          const style = window.getComputedStyle(parent);
          if (badOverflows.includes(style.overflow) || badOverflows.includes(style.overflowX) || badOverflows.includes(style.overflowY)) {
            parent.style.setProperty('overflow', 'visible', 'important');
            parent.style.setProperty('overflow-x', 'visible', 'important');
            parent.style.setProperty('overflow-y', 'visible', 'important');
          }
          parent = parent.parentElement;
        }
        
        const headings = Array.from(
          container.querySelectorAll('h1, h2, h3, h4, h5, h6')
        ) as HTMLElement[];

        if (!enabled) return;

        const scrollY = getScrollY(scroller);
        const scrollerTop = scroller === window ? 0 : getAbsoluteTop(scroller as HTMLElement);

        const data = headings.map(el => {
          return {
            el,
            level: parseInt(el.tagName[1]),
            height: el.offsetHeight,
            naturalTop: getAbsoluteTop(el),
            baseTop: 0,
            top: 0,
            pusherIndex: -1,
            precedingBottom: 0
          };
        });

        const activePath: { level: number; bottom: number }[] = [];
        let currentPrecedingBottom = 90;

        for (let i = 0; i < data.length; i++) {
          const h = data[i];
          
          while (activePath.length > 0 && activePath[activePath.length - 1].level >= h.level) {
            activePath.pop();
          }
          
          h.baseTop = activePath.length > 0 ? activePath[activePath.length - 1].bottom : 90;
          h.precedingBottom = currentPrecedingBottom;
          
          activePath.push({ level: h.level, bottom: h.baseTop + h.height });
          currentPrecedingBottom = h.baseTop + h.height;
        }

        for (let i = data.length - 1; i >= 0; i--) {
          const h = data[i];
          
          let pusherIndex = -1;
          for (let j = i + 1; j < data.length; j++) {
            if (data[j].level <= h.level) {
              pusherIndex = j;
              break;
            }
          }
          h.pusherIndex = pusherIndex;
          
          let pushAmount = 0;
          if (pusherIndex !== -1) {
            const pusher = data[pusherIndex];
            const screenY = pusher.naturalTop - scrollerTop - scrollY;
            const actualTop = Math.max(screenY, pusher.top);
            pushAmount = Math.max(0, pusher.precedingBottom - actualTop);
          }
          
          h.top = h.baseTop - pushAmount;
        }

        data.forEach(h => {
          const selector = getCssPath(h.el, container);
          css += `
            ${selector} {
              position: sticky !important;
              top: ${h.top}px !important;
              z-index: ${50 - h.level} !important;
              background-color: var(--mantine-color-body) !important;
            }
          `;
        });
      });

      if (!enabled) {
        if (styleTag) styleTag.innerHTML = '';
      } else {
        if (styleTag) styleTag.innerHTML = css;
      }
    };

    const attachObservers = () => {
      const allContainers = Array.from(document.querySelectorAll('.ProseMirror')).filter(c => !c.closest('.page-title')) as HTMLElement[];
      const container = allContainers[0]; // just observe the first valid one to trigger updates
      if (container && container !== containerRef) {
        containerRef = container;
        if (observer) observer.disconnect();
        if (resizeObserver) resizeObserver.disconnect();
        
        observer = new MutationObserver(handler);
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
        
        resizeObserver = new ResizeObserver(handler);
        resizeObserver.observe(container);
        
        handler();
      }
    };

    if (enabled) {
      const interval = setInterval(attachObservers, 500);
      window.addEventListener('scroll', handler, true);
      window.addEventListener('resize', handler);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('scroll', handler, true);
        window.removeEventListener('resize', handler);
        if (observer) observer.disconnect();
        if (resizeObserver) resizeObserver.disconnect();
        if (styleTag) styleTag.innerHTML = '';
      };
    } else {
      updateHeadings(); // Cleanup
      return () => {
         if (styleTag) styleTag.innerHTML = '';
      };
    }
  }, [enabled]);
}
