import { useMemo, useState, type FC } from "react";

import type { PersistentStory } from "@domain/index";
import parseStory, {
  isParseStorySuccess,
} from "@domain/story/publish/parseStory";
import type {
  Block,
  Page,
  PublishedScene,
} from "@domain/story/publish/types";

import "./StoryOverview.css";

type StoryOverviewProps = {
  story: PersistentStory;
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

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

const StoryOverview: FC<StoryOverviewProps> = ({ story }) => {
  let parseResult;
  try {
    parseResult = parseStory(story);
  } catch (error) {
    console.error("story-overview: failed to parse story", error);
    return (
      <article className="story-overview story-overview--unavailable">
        <p className="story-overview__notice">
          Unable to render the story overview yet.
        </p>
      </article>
    );
  }

  if (!isParseStorySuccess(parseResult)) {
    return (
      <article className="story-overview story-overview--unavailable">
        <p className="story-overview__notice">
          Unable to render the story overview yet: {parseResult.reason}
        </p>
      </article>
    );
  }

  const publishedScenes = parseResult.story.scenes;
  const scenesWithPages: SceneWithPages[] = publishedScenes.map((scene) => ({
    scene,
    pages: sortPages(scene),
  }));

  const [isArcCollapsed, setIsArcCollapsed] = useState(false);

  const coverImageUrl =
    story.scenes.find((scene) => scene.image)?.image?.url ?? null;
  const createdAt = story.publishedOn ?? new Date();

  return (
    <article className="story-overview">
      <StoryArcDiagram
        scenes={scenesWithPages}
        collapsed={isArcCollapsed}
        onToggle={() => setIsArcCollapsed((value) => !value)}
      />
      <header className="story-overview__header">
        <div>
          <p className="story-overview__kicker">Story overview</p>
          <h1 className="story-overview__title">{story.title}</h1>
          <p className="story-overview__meta">
            by {story.author.name} · {dateFormatter.format(createdAt)}
          </p>
          {coverImageUrl && (
            <p className="story-overview__meta">
              Cover image:
              <a href={coverImageUrl} target="_blank" rel="noreferrer">
                {coverImageUrl}
              </a>
            </p>
          )}
        </div>
        {coverImageUrl ? (
          <img
            className="story-overview__cover"
            src={coverImageUrl}
            alt="Cover"
          />
        ) : (
          <div className="story-overview__cover story-overview__cover--placeholder">
            No cover artwork
          </div>
        )}
      </header>
      <section aria-label="Scenes" className="story-overview__scene-section">
        <h2 className="story-overview__section-title">
          Scenes ({publishedScenes.length})
        </h2>
        <div className="story-overview__scenes">
          {scenesWithPages.map(({ scene, pages }) => (
            <article
              key={scene.id}
              className="story-overview__scene"
              id={scene.link ?? undefined}
            >
              <header className="story-overview__scene-header">
                <div className="story-overview__scene-title-row">
                  <h3 className="story-overview__scene-title">{scene.title}</h3>
                  {scene.isOpeningScene && (
                    <span className="story-overview__badge">Opening scene</span>
                  )}
                </div>
                <p className="story-overview__scene-meta">
                  {pages.length} page{pages.length === 1 ? "" : "s"}
                  {scene.link && (
                    <>
                      {pages.length ? " · " : ""}link target {" "}
                      <code>{scene.link}</code>
                    </>
                  )}
                </p>
              </header>
              <div className="story-overview__pages">
                {pages.map((page) => (
                  <article
                    key={page.link}
                    className="story-overview__page"
                    id={page.link}
                  >
                    <header className="story-overview__page-header">
                      <p className="story-overview__page-number">
                        Page {page.number + 1}
                      </p>
                      <code className="story-overview__page-anchor">
                        #{page.link}
                      </code>
                    </header>
                    <div className="story-overview__page-content">
                      {page.content.map((block, index) => (
                        <BlockPreview
                          key={`${page.link}-${block.kind}-${index}`}
                          block={block}
                        />
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </article>
  );
};

type StoryArcDiagramProps = {
  scenes: SceneWithPages[];
  collapsed: boolean;
  onToggle: () => void;
};

const StoryArcDiagram: FC<StoryArcDiagramProps> = ({ scenes, collapsed, onToggle }) => {
  const [activeSceneId, setActiveSceneId] = useState<PublishedScene["id"] | null>(null);

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

  const ghostNodes: DiagramNode[] = unresolvedTargetOrder.map((link, ghostIndex) => ({
    id: `missing-${link}`,
    title: `Missing: ${link}`,
    anchor: null,
    index: realNodes.length + ghostIndex,
    hasMultiplePages: false,
    isGhost: true,
    ghostLinkId: link,
    ghostLinkLabel: linkTargetToLabel.get(link) ?? undefined,
  }));

  const ghostTargetToIndex = new Map<string, number>(
    unresolvedTargetOrder.map((link, ghostIndex) => [link, realNodes.length + ghostIndex]),
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
      target.kind === "scene" ? `scene:${target.sceneId}` : `ghost:${target.link}`;
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

  const activeScene =
    scenes.find(({ scene }) => scene.id === activeSceneId) ?? null;
  const overlayScene =
    activeScene && activeScene.pages.length > 1 ? activeScene : null;

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
      <button
        type="button"
        className="story-overview__arc-toggle story-overview__arc-toggle--floating"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Show overview" : "Hide overview"}
      >
        <span aria-hidden="true" className="story-overview__arc-toggle-line" />
      </button>
      <div
        className={`story-overview__arc-content${
          collapsed ? " story-overview__arc-content--collapsed" : ""
        }`}
        onMouseLeave={() => setActiveSceneId(null)}
        hidden={collapsed}
      >
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Story flow overview">
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
                  d={pathForArc(startX, endX, { endIsGhost: endNode?.isGhost ?? false })}
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
                    node.anchor && !node.isGhost ? " story-overview__arc-node--interactive" : ""
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

              const interactiveProps = node.isGhost
                ? {}
                : {
                    onMouseEnter: () => setActiveSceneId(node.id as PublishedScene["id"]),
                    onFocus: () => setActiveSceneId(node.id as PublishedScene["id"]),
                  };

              if (node.anchor && !node.isGhost) {
                return (
                  <a
                    key={node.id}
                    className="story-overview__arc-node-link"
                    href={`#${node.anchor}`}
                    aria-label={`Jump to ${node.title}`}
                    {...interactiveProps}
                  >
                    <title>{`Jump to ${node.title}`}</title>
                    {circle}
                    {label}
                  </a>
                );
              }

              return (
                <g key={node.id} {...interactiveProps}>
                  {circle}
                  {label}
                </g>
              );
            })}
          </g>
        </svg>
        {overlayScene && (
          <div className="story-overview__pages-overlay">
            <ScenePagesMap
              sceneWithPages={overlayScene}
              width={width}
              height={height}
              paddingX={paddingX}
            />
          </div>
        )}
      </div>
    </div>
  );
};

type ScenePagesMapProps = {
  sceneWithPages: SceneWithPages;
  width: number;
  height: number;
  paddingX: number;
};

const ScenePagesMap: FC<ScenePagesMapProps> = ({
  sceneWithPages,
  width,
  height,
  paddingX,
}) => {
  const { scene, pages } = sceneWithPages;
  const sceneAnchor = scene.link ?? pages[0]?.link ?? null;

  if (pages.length === 0) {
    return null;
  }

  const overlayPaddingX = paddingX + 48;
  const availableWidth = Math.max(width - overlayPaddingX * 2, 0);
  const baselineY = height / 2;
  const positionedPages = pages.map((page, index) => {
    const x =
      pages.length === 1
        ? width / 2
        : overlayPaddingX + (index / (pages.length - 1)) * availableWidth;
    const label = labelForPage(page, index);
    return {
      page,
      x,
      label,
    };
  });

  return (
    <div className="story-overview__pages-map">
      <p className="story-overview__pages-map-title">Pages in {scene.title}</p>
      <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true" role="presentation">
        <g className="story-overview__pages-map-connectors">
          {positionedPages.slice(1).map((position, index) => {
            const previous = positionedPages[index];
            const connectorHeight = 18;
            const x = Math.min(previous.x, position.x);
            const widthBetween = Math.abs(position.x - previous.x);
            const rect = (
              <rect
                x={x}
                y={baselineY - connectorHeight / 2}
                width={widthBetween}
                height={connectorHeight}
                rx={connectorHeight / 2}
                className="story-overview__pages-map-connector"
              />
            );

            if (!sceneAnchor) {
              return <g key={`${previous.page.link}-${position.page.link}`}>{rect}</g>;
            }

            return (
              <a
                key={`${previous.page.link}-${position.page.link}`}
                href={`#${sceneAnchor}`}
                className="story-overview__pages-map-connector-link"
                aria-label={`Jump to ${scene.title}`}
              >
                <title>{`Jump to ${scene.title}`}</title>
                {rect}
              </a>
            );
          })}
        </g>
        <g className="story-overview__pages-map-nodes">
          {positionedPages.map((position) => {
            const circle = (
              <circle
                cx={position.x}
                cy={baselineY}
                r={14}
                className="story-overview__pages-map-node"
              />
            );

            const label = (
              <text
                className="story-overview__pages-map-node-label"
                x={position.x}
                y={baselineY + 28}
                textAnchor="middle"
              >
                {position.label.lines.map((line, lineIndex) => (
                  <tspan
                    key={`${position.page.link}-line-${lineIndex}`}
                    x={position.x}
                    dy={lineIndex === 0 ? 0 : 14}
                  >
                    {line}
                  </tspan>
                ))}
              </text>
            );

            return (
              <a
                key={position.page.link}
                href={`#${position.page.link}`}
                className="story-overview__pages-map-node-link"
                aria-label={`Jump to ${position.label.full}`}
              >
                <title>{`Jump to ${position.label.full}`}</title>
                {circle}
                {label}
              </a>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

type PageLabel = {
  full: string;
  lines: string[];
};

const labelForPage = (page: Page, indexInScene: number): PageLabel => {
  const headingBlock = page.content.find(
    (block): block is Extract<Block, { kind: "blockHeading" }> =>
      block.kind === "blockHeading",
  );

  const label = headingBlock ? headingBlock.text : `Page ${indexInScene + 1}`;
  return {
    full: label,
    lines: wrapLabel(label, 16),
  };
};

const wrapLabel = (text: string, maxCharsPerLine: number) => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxCharsPerLine || !currentLine) {
      currentLine = candidate;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

const sortPages = (scene: PublishedScene): Page[] =>
  Object.values(scene.pages).sort((a, b) => a.number - b.number);

type BlockPreviewProps = {
  block: Block;
};

const BlockPreview: FC<BlockPreviewProps> = ({ block }) => {
  switch (block.kind) {
    case "blockHeading": {
      return (
        <h4 className="story-overview__block-heading" id={block.link}>
          {block.text}
        </h4>
      );
    }
    case "blockPlaintext": {
      return <p className="story-overview__block-plaintext">{block.text}</p>;
    }
    case "blockLink": {
      return (
        <a className="story-overview__block-link" href={`#${block.link}`}>
          → {block.text}
        </a>
      );
    }
    default: {
      return null;
    }
  }
};

export default StoryOverview;
