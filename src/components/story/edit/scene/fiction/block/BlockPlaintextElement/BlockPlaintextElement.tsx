import type { FC } from "react";
import { DefaultElement, type RenderElementProps } from "slate-react";

const BlockPlaintextElement: FC<RenderElementProps> = (props) => {
  return <DefaultElement {...props} />;
};

export default BlockPlaintextElement;
