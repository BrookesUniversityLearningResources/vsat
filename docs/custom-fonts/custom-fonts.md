* [Instructions](https://pmndrs.github.io/uikit/docs/tutorials/custom-fonts)

For eithe rof the approaches described below you'll need a file containing the
subset of characters that will be included in the 3D font.

There's a sample `charset.txt` in this directory.

## Approaches

### Website

Use this website to do the font transformation:

* https://msdf-bmfont.donmccurdy.com/

### Manual

Here's an example using [Roboto](https://fonts.google.com/specimen/Roboto).

```shell
npx msdf-bmfont -f json roboto-regular.ttf -i charset.txt -m 256,512 -s 48
npx msdf-bmfont -f json roboto-bold.ttf -i charset.txt -m 256,512 -s 48
```

## Output

Finally, do the following regardless of which approach you used to transform the
font:

1. Copy the files into the [public/fonts](/public/fonts/) folder.
1. Reference the custom fonts
  [in the source](src/components/story/published/PublishedStory.tsx) and
  [here](src/components/story/published/fiction/Fiction.tsx).
