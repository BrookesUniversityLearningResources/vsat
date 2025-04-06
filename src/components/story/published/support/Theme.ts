import { Color } from "three";

function hsl(h: number, s: number, l: number) {
  return new Color().setHSL(h / 360, s / 100, l / 100, "srgb");
}

/**
 * @see https://hslpicker.com/
 */
export const Colors = Object.freeze({
  foreground: hsl(0, 0, 100),
  background: hsl(0, 0, 16), // #292929
  card: hsl(0, 0, 16), // #292929
  plaintext: hsl(40, 43, 95), // #f7f3eb
});
