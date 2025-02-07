export default function htmlId(prefix = "") {
  return (id: string | number) => `${prefix}${id}`;
}
