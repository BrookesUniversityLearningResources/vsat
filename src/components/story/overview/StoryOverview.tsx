import { useRef, type FC } from "react";
import { useTranslation } from "react-i18next";

import type { PersistentScene, PersistentStory } from "@domain/index";
import parseStory, {
  isParseStorySuccess,
  type ParseStoryResult,
} from "@domain/story/publish/parseStory";
import sortPages from "@domain/story/publish/support/sortPages";
import type { Page, PublishedScene } from "@domain/story/publish/types";

import "./StoryOverview.css";

type OnSceneSelected = (id: PersistentScene["id"]) => void;

type StoryOverviewProps = {
  story: Readonly<PersistentStory>;
  onSceneSelected: OnSceneSelected;
};

type SceneWithPages = {
  scene: PublishedScene;
  pages: Page[];
};

type DiagramNode = {
  id: PublishedScene["id"] | `missing-${string}`;
  title: string;
  anchor: string | null;
  index: number;
  hasMultiplePages: boolean;
  isGhost?: boolean;
  ghostLinkId?: string;
  ghostLinkLabel?: string;
};

type PendingArcTarget =
  | { kind: "scene"; sceneId: PublishedScene["id"] }
  | { kind: "ghost"; link: string; label?: string };

type PendingArc = {
  sourceIndex: number;
  target: PendingArcTarget;
};

type DiagramArc = {
  sourceIndex: number;
  targetIndex: number;
  isGhost: boolean;
};

const StoryOverview: FC<StoryOverviewProps> = ({ story, onSceneSelected }) => {
  const { t } = useTranslation();

  const refDetails = useRef<HTMLDetailsElement | null>(null);

  let parseResult: ParseStoryResult;

  try {
    parseResult = parseStory(story);
  } catch {
    return (
      <section className="story-overview story-overview--unavailable">
        <p>{t("overview.unavailable.no-reason")}</p>
      </section>
    );
  }

  if (!isParseStorySuccess(parseResult)) {
    return (
      <section className="story-overview story-overview--unavailable">
        <p>
          {t("overview.unavailable.with-reason", {
            reason: parseResult.reason,
          })}
        </p>
      </section>
    );
  }

  const scenesWithPages: SceneWithPages[] = parseResult.story.scenes.map(
    (scene) => ({
      scene,
      pages: sortPages(scene.pages),
    }),
  );

  return (
    <section className="story-overview">
      <details ref={refDetails}>
        <summary>{t("overview.heading")}</summary>
        <StoryArcDiagram
          scenes={scenesWithPages}
          onSceneSelected={(sceneId) => {
            if (refDetails.current) {
              refDetails.current.open = false;
            }
            onSceneSelected(sceneId);
          }}
        />
      </details>
    </section>
  );
};

type StoryArcDiagramProps = {
  scenes: SceneWithPages[];
  onSceneSelected: OnSceneSelected;
};

const StoryArcDiagram: FC<StoryArcDiagramProps> = ({
  scenes,
  onSceneSelected,
}) => {
  const { t } = useTranslation();

  if (scenes.length === 0) {
    return null;
  }

  const realNodes: DiagramNode[] = scenes.map(({ scene, pages }, index) => {
    const anchor = scene.link ?? pages[0]?.link ?? null;
    return {
      id: scene.id,
      title: scene.title,
      anchor,
      index,
      hasMultiplePages: pages.length > 1,
    };
  });

  const sceneIdToIndex = new Map<PublishedScene["id"], number>(
    realNodes.map((node) => [node.id as PublishedScene["id"], node.index]),
  );
  const linkTargetToSceneId = new Map<string, PublishedScene["id"]>();
  const linkTargetToLabel = new Map<string, string>();
  const pendingArcs: PendingArc[] = [];
  const unresolvedTargetOrder: string[] = [];
  const unresolvedTargetSet = new Set<string>();

  scenes.forEach(({ scene, pages }) => {
    if (scene.link) {
      linkTargetToSceneId.set(scene.link, scene.id);
    }

    pages.forEach((page) => {
      linkTargetToSceneId.set(page.link, scene.id);
    });
  });

  scenes.forEach(({ scene, pages }) => {
    const sourceIndex = sceneIdToIndex.get(scene.id);
    if (sourceIndex === undefined) {
      return;
    }

    pages.forEach((page) => {
      page.content.forEach((block) => {
        if (block.kind !== "blockLink") {
          return;
        }

        const targetSceneId = linkTargetToSceneId.get(block.link);
        if (targetSceneId === undefined) {
          if (!unresolvedTargetSet.has(block.link)) {
            unresolvedTargetSet.add(block.link);
            unresolvedTargetOrder.push(block.link);
          }
          if (block.text && !linkTargetToLabel.has(block.link)) {
            linkTargetToLabel.set(block.link, block.text);
          }
          pendingArcs.push({
            sourceIndex,
            target: { kind: "ghost", link: block.link, label: block.text },
          });
          return;
        }

        pendingArcs.push({
          sourceIndex,
          target: { kind: "scene", sceneId: targetSceneId },
        });
      });
    });
  });

  const ghostNodes: DiagramNode[] = unresolvedTargetOrder.map(
    (link, ghostIndex) => ({
      id: `missing-${link}`,
      title: t("overview.link.missing.title", { link }),
      anchor: null,
      index: realNodes.length + ghostIndex,
      hasMultiplePages: false,
      isGhost: true,
      ghostLinkId: link,
      ghostLinkLabel: linkTargetToLabel.get(link) ?? "",
    }),
  );

  const ghostTargetToIndex = new Map<string, number>(
    unresolvedTargetOrder.map((link, ghostIndex) => [
      link,
      realNodes.length + ghostIndex,
    ]),
  );

  const visualNodes = [...realNodes, ...ghostNodes];

  const arcPairs = new Set<string>();
  const arcs: DiagramArc[] = [];

  pendingArcs.forEach(({ sourceIndex, target }) => {
    let targetIndex: number | undefined;
    let isGhost = false;

    if (target.kind === "scene") {
      targetIndex = sceneIdToIndex.get(target.sceneId);
    } else {
      targetIndex = ghostTargetToIndex.get(target.link);
      isGhost = true;
    }

    if (targetIndex === undefined || sourceIndex === targetIndex) {
      return;
    }

    const keyTarget =
      target.kind === "scene"
        ? `scene:${target.sceneId}`
        : `ghost:${target.link}`;
    const key = `${sourceIndex}->${keyTarget}`;
    if (arcPairs.has(key)) {
      return;
    }
    arcPairs.add(key);
    arcs.push({ sourceIndex, targetIndex, isGhost });
  });

  arcs.sort((arcA, arcB) => {
    const spanA = Math.abs(arcA.targetIndex - arcA.sourceIndex);
    const spanB = Math.abs(arcB.targetIndex - arcB.sourceIndex);
    return spanB - spanA;
  });

  const width = 800;
  const paddingX = 32;
  const nodeRadius = 16;
  const topPadding = 20;
  const bottomPadding = 40;
  const availableWidth = width - paddingX * 2;

  const positionedNodes = visualNodes.map((node) => {
    const x =
      visualNodes.length === 1
        ? width / 2
        : paddingX + (node.index / (visualNodes.length - 1)) * availableWidth;
    return { ...node, x };
  });

  const largestArcRadius = arcs.reduce((max, arc) => {
    const startX = positionedNodes[arc.sourceIndex]?.x;
    const endX = positionedNodes[arc.targetIndex]?.x;

    if (startX === undefined || endX === undefined) {
      return max;
    }

    const radius = Math.abs(endX - startX) / 2;
    return Math.max(max, radius);
  }, 0);

  const minHeight = 200;
  const baselineY = Math.max(
    largestArcRadius + topPadding,
    nodeRadius + topPadding,
    minHeight / 2,
  );
  const height = Math.max(baselineY + nodeRadius + bottomPadding, minHeight);

  const pathForArc = (
    startX: number,
    endX: number,
    options?: { endIsGhost?: boolean },
  ) => {
    const horizontalRadius = Math.abs(endX - startX) / 2;
    const sweepFlag = startX < endX ? 1 : 0;
    const endY = options?.endIsGhost ? baselineY - nodeRadius : baselineY;
    return `M ${startX} ${baselineY} A ${horizontalRadius} ${horizontalRadius} 0 0 ${sweepFlag} ${endX} ${endY}`;
  };

  return (
    <div className="story-overview__arc-diagram">
      <div className="story-overview__arc-content">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={t("overview.label")}
        >
          <title>Story flow overview</title>
          <g className="story-overview__arc-paths">
            {arcs.map((arc, index) => {
              const startNode = positionedNodes[arc.sourceIndex];
              const endNode = positionedNodes[arc.targetIndex];
              const startX = startNode?.x;
              const endX = endNode?.x;

              if (startX === undefined || endX === undefined) {
                return null;
              }

              return (
                <path
                  key={`${arc.sourceIndex}-${arc.targetIndex}-${index}`}
                  d={pathForArc(startX, endX, {
                    endIsGhost: endNode?.isGhost ?? false,
                  })}
                  className={`story-overview__arc-path${
                    arc.isGhost ? " story-overview__arc-path--ghost" : ""
                  }`}
                />
              );
            })}
          </g>
          <g className="story-overview__arc-nodes">
            {positionedNodes.map((node) => {
              const isFirstNode = node.index === 0;
              const isLastNode = node.index === visualNodes.length - 1;
              const isOnlyNode = visualNodes.length === 1;
              const labelAnchor = isOnlyNode
                ? "middle"
                : isFirstNode
                  ? "start"
                  : isLastNode
                    ? "end"
                    : "middle";
              const labelX = isOnlyNode
                ? node.x
                : isFirstNode
                  ? node.x - nodeRadius - 4
                  : isLastNode
                    ? node.x + nodeRadius + 4
                    : node.x;
              const circle = (
                <circle
                  cx={node.x}
                  cy={baselineY}
                  r={16}
                  className={`story-overview__arc-node${
                    node.anchor && !node.isGhost
                      ? " story-overview__arc-node--interactive"
                      : ""
                  }${
                    node.hasMultiplePages && !node.isGhost
                      ? " story-overview__arc-node--multi"
                      : ""
                  }${node.isGhost ? " story-overview__arc-node--ghost" : ""}`}
                >
                  {node.isGhost && node.ghostLinkLabel ? (
                    <title>{node.ghostLinkLabel}</title>
                  ) : null}
                </circle>
              );

              const label = (
                <text
                  className={`story-overview__arc-label${
                    node.isGhost ? " story-overview__arc-label--ghost" : ""
                  }`}
                  x={labelX}
                  y={baselineY + 34}
                  textAnchor={labelAnchor}
                >
                  {node.title}
                </text>
              );

              if (node.anchor && !node.isGhost) {
                const labelNavigateTo = t("overview.link.navigate-to.label", {
                  link: node.title,
                });

                return (
                  <a
                    key={node.id}
                    className="story-overview__arc-node-link"
                    href={`#${node.anchor}`}
                    aria-label={labelNavigateTo}
                    onClick={() => {
                      if (typeof node.id === "number") {
                        onSceneSelected(node.id);
                      }
                    }}
                  >
                    <title>{labelNavigateTo}</title>
                    {circle}
                    {label}
                  </a>
                );
              }

              return (
                <g key={node.id}>
                  {circle}
                  {label}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};

export default StoryOverview;
