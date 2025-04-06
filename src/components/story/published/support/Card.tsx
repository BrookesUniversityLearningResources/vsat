import {
  Container,
  type ContainerProperties,
  type ContainerRef,
  DefaultProperties,
} from "@react-three/uikit";
import { type FC, type RefAttributes, forwardRef } from "react";

import { Colors } from "./Theme.js";

type CardProps = ContainerProperties & RefAttributes<ContainerRef>;

const Card: FC<CardProps> = forwardRef(({ children, ...props }, ref) => {
  return (
    <Container
      backgroundColor={Colors.card}
      backgroundOpacity={0.8}
      borderColor={Colors.foreground}
      borderOpacity={0}
      borderWidth={4}
      ref={ref}
      {...props}
    >
      <DefaultProperties color={Colors.plaintext}>
        {children}
      </DefaultProperties>
    </Container>
  );
});

export default Card;
