import React from "react";
import './App.css';


export type HandlePerspectiveHoverOptions<T extends HTMLElement> = {
  element: T;
  ratio?: number;
  getBoundingClientRect?: (element: T) => DOMRect;
  transform?: string;
  transition?: string;
};

export function handlePerspectiveHover<T extends HTMLElement>
({
   element,
   ratio = 0.1,
   getBoundingClientRect,
   transform = "",
   transition = ""
}: HandlePerspectiveHoverOptions<T>) {
  const originalDuration = Number(
      transition.match(/transform (?<ms>\d*)ms/)?.groups?.ms
  );
  let duration = originalDuration;
  let newTransform = "";
  let lastMoveTime: null | number = null;
  let scheduledCb: null | ((time: number) => void) = null;
  let gbcrCache: DOMRect;
  const newGetBoundingClientRect =
      getBoundingClientRect ||
      ((e: T) => {
        if (!gbcrCache) gbcrCache = e.getBoundingClientRect();
        return gbcrCache;
      });

  function getTransition() {
    return transition.replace(/transform \d*ms/, `transform ${duration}ms`);
  }

  function handleMouseLeave(e: MouseEvent & { currentTarget: T }) {
    const target = e.currentTarget;
    requestAnimationFrame(() => {
      lastMoveTime = null;
      duration = originalDuration;
      target.style.transform = ``;
      target.style.transition = getTransition();
    });
  }
  function handleMouseMove(e: MouseEvent & { currentTarget: T }) {
    if (scheduledCb) return;

    const target = e.currentTarget;
    if (!target) return;

    const { x, y, width, height } = newGetBoundingClientRect!(target);

    const perspective = `perspective(${((width + height) | 0) / 2}px)`;
    const shiftXpx = e.clientX - x;
    const shiftYpx = e.clientY - y;

    const shiftX = (((shiftXpx - width / 2) / width) * 100 || 0) | 0;
    const shiftY = ((-(shiftYpx - height / 2) / height) * 100 || 0) | 0;
    const rotateX = `rotateX(${shiftY * ratio}deg)`;
    const rotateY = `rotateY(${shiftX * ratio}deg)`;

    newTransform = `${transform} ${perspective} ${rotateX} ${rotateY}`;

    requestAnimationFrame(
        (scheduledCb = (time) => {
          if (lastMoveTime === null) lastMoveTime = time;
          scheduledCb = null;
          target.style.transform = newTransform;
          target.style.transition = getTransition();
          duration = duration < 16 ? 0 : duration - (time - lastMoveTime);
          lastMoveTime = time;
        })
    );
  }

  // eslint-disable-next-line no-param-reassign
  element.style.transition = getTransition();
  element.addEventListener("mouseleave", handleMouseLeave as any);
  element.addEventListener("mousemove", handleMouseMove as any);

  return function cleanup() {
    element.removeEventListener("mouseleave", handleMouseLeave as any);
    element.removeEventListener("mousemove", handleMouseMove as any);
  };
}

export type UsePerspectiveHoverOptions<T extends HTMLElement> = Omit<
    HandlePerspectiveHoverOptions<T>,
    "element"
    >;

/**
 * @example
 * ```tsx
 * const ref = usePerspectiveHover<HTMLAnchorElement>()
 * return <a ref={ref} href="/">link</a>
 * ```
 */
export function usePerspectiveHover<T extends HTMLElement>(
    options?: UsePerspectiveHoverOptions<T>
) {
  const ref = React.useRef<T>(null);

  React.useLayoutEffect(() => {
    if (ref.current) {
      return handlePerspectiveHover({ ...options, element: ref.current });
    }
  }, []);

  return ref;
}


const pictures = [
  "https://user-images.githubusercontent.com/27290320/166588362-3e6d1b9e-f9da-4f69-8084-a0c7fadb2378.png",
  "https://user-images.githubusercontent.com/27290320/166588408-2831c5da-56ba-48f2-bddd-faa6d84a4fef.png",
  "https://user-images.githubusercontent.com/27290320/166588425-c5aee792-8485-4293-a0a3-823eb0db63a9.png",
  "https://user-images.githubusercontent.com/27290320/166588688-5b1a9e1d-d0a2-4310-bcbd-382849156253.png",
  "https://user-images.githubusercontent.com/27290320/166588705-3d5553ae-9da2-4c48-bb9e-b6694083b0a2.png",
  "https://user-images.githubusercontent.com/27290320/166588735-e238ab72-e5ea-4c4c-94d2-bfbbe0416118.png"
];

function Card({ src = "" }) {
  const ref = usePerspectiveHover<HTMLImageElement>({
    transform: `scale(1.1)`,
    transition: `scale 270ms, box-shadow 270ms, transform 270ms`
  });

  return (
      <div className="img" ref={ref} style={{ backgroundImage: `url(${src})` }} />
  );
}

export default function App() {
  return (
      <div className="app">
        <h1>Try to hover a card by mouse</h1>
        {pictures.map((src, index) => (
            <Card key={index} src={src} />
        ))}
      </div>
  );
}
