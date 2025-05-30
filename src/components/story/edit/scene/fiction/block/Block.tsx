import { DefaultElement, type RenderElementProps } from "slate-react";

import BlockErrorElement from "./BlockErrorElement/BlockErrorElement";
import BlockHeadingElement from "./BlockHeadingElement/BlockHeadingElement";
import BlockLinkElement from "./BlockLinkElement/BlockLinkElement";
import BlockPlaintextElement from "./BlockPlaintextElement/BlockPlaintextElement";

/**
 * Render the appropriate `Block` for the given custom element `type`.
 *
 * Our data model is simple: there's 4 types of block — `heading`, `link`,
 * `plaintext`, and `error` — and this component delegates to the relevant
 * `BlockXxx` component.
 */
const Block: (props: RenderElementProps) => JSX.Element = (props) => {
  switch (props.element.type) {
    case "blockHeading": {
      return <BlockHeadingElement {...props} />;
    }
    case "blockLink": {
      return <BlockLinkElement {...props} />;
    }
    case "blockError": {
      return <BlockErrorElement {...props} />;
    }
    case "blockPlaintext": {
      return <BlockPlaintextElement {...props} />;
    }
    default: {
      return ((_: never) => <DefaultElement {...props} />)(props.element);
    }
  }
};

export default Block;
