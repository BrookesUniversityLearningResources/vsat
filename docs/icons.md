We're using icons from these (Open Source) sets:

* [Noto V1](https://icon-sets.iconify.design/noto-v1/)
* [BoxIcons](https://icon-sets.iconify.design/bx/)
* [BoxIcons Solid](https://icon-sets.iconify.design/bxs/) (sometimes)

## Astro Usage

The subset of icons used are explicitly configured in
[the Astro config](/astro.config.mjs):

```js
integrations: [
  icon({
    // https://github.com/natemoo-re/astro-icon?tab=readme-ov-file#configinclude
    include: {
      // https://icon-sets.iconify.design/noto-v1/
      "noto-v1": ["e-mail", "love-letter", "fearful-face"],
    },
  }),
],
```

They're used like so in your Astro pages and components:

```jsx
import { Icon } from "astro-icon/components";

<Icon name="noto-v1:love-letter" size="medium" />
```

## React Usage

The icons are saved to the [public images folder](/public/images/).

They're referenced like so in your React components:

```jsx
<button type="button">
  <img src="/images/save-solid-24.png" />
</button>
```
