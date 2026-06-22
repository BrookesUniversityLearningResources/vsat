import {
  isHeadingBlock,
  isLinkBlock,
  isPlaintextBlock,
} from "@domain/story/publish/support/isBlock";
import openingPageFor from "@domain/story/publish/support/openingPage";
import openingSceneFor from "@domain/story/publish/support/openingScene";
import { isTitleCardScene } from "../published/aframe/titleCardSceneFor";
import type { Current } from "../published/aframe/types";
import {
  type LinkOption,
  type StateMessage,
  startRemoteHost,
} from "./remoteHost";

/**
 * Wires the 360° A-Frame story viewer to the shared remote host: it reads the
 * live `window.current`, drives navigation by re-emitting `linkactivated`, and
 * restarts by re-rendering the opening scene. Auto-arms on every load (the
 * lobby is steward-gated, so only an operator sees/drives sessions).
 */
export function startHostController(): void {
  const getState = (): StateMessage | null => {
    const current = (window as unknown as { current?: Current }).current;
    if (!current?.page) {
      return null;
    }

    const links: LinkOption[] = current.page.content
      .filter(isLinkBlock)
      .map((block) => ({ text: block.text, link: block.link }));

    // The title card is a synthetic scene whose title is an internal sentinel;
    // show the story title there instead.
    const sceneTitle = isTitleCardScene(current.scene)
      ? (current.story?.title ?? "")
      : (current.scene?.title ?? "");

    const heading = current.page.content.find(isHeadingBlock)?.text ?? "";
    const body = current.page.content
      .filter(isPlaintextBlock)
      .map((block) => block.text)
      .join("\n\n");
    const image = current.scene?.image?.url ?? null;

    return {
      type: "state",
      storyTitle: current.story?.title ?? "",
      sceneId: current.scene?.id,
      sceneTitle,
      heading,
      body,
      image,
      pageNumber: current.page.number,
      links,
    };
  };

  const navigate = (link: string) => {
    const storyEl = document.querySelector("[story]") as
      | (Element & { emit?: (name: string, detail: unknown) => void })
      | null;
    if (!storyEl) {
      return;
    }
    if (typeof storyEl.emit === "function") {
      storyEl.emit("linkactivated", link);
    } else {
      storyEl.dispatchEvent(new CustomEvent("linkactivated", { detail: link }));
    }
  };

  const restart = () => {
    const current = (window as unknown as { current?: Current }).current;
    const storyEl = document.querySelector("[story]") as
      | (Element & {
          components?: {
            story?: {
              render?: (c: Current, o: { isSceneChange: boolean }) => void;
            };
          };
        })
      | null;
    const story = current?.story;
    const render = storyEl?.components?.story?.render;
    if (!story || !render) {
      return;
    }
    const openingScene = openingSceneFor(story);
    current.scene = openingScene;
    current.page = openingPageFor(openingScene);
    render.call(storyEl.components?.story, current, { isSceneChange: true });
  };

  const host = startRemoteHost({ getState, navigate, restart });

  // The story view dispatches this on every (re)render — re-broadcast then.
  window.addEventListener("vsat:story-context", host.notifyChange);
}
