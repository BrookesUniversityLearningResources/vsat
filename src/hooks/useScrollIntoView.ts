import { useEffect, useState } from "react";

type ID = HTMLElement["id"] | undefined;

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
 */
export default function useScrollIntoView(
  options: boolean | ScrollIntoViewOptions = { behavior: "smooth" },
) {
  const [targetId, setTargetId] = useState<ID>();

  const scrollIntoView = (id: ID) => {
    setTargetId(id);
  };

  useEffect(() => {
    if (!targetId) {
      return;
    }

    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView(options);
    }
  }, [targetId, options]);

  return scrollIntoView;
}
