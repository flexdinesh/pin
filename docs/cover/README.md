# README cover

Source for `docs/cover-light.webp` and `docs/cover-dark.webp`. A still built with the stageshow skill's React kit, which is not vendored here. The import `../../kit` resolves only inside a stageshow checkout.

## Regenerate

From a stageshow checkout, with its dev server running (`npm install`, `npm run dev`):

```sh
mkdir -p examples/pin-cover
cp <pin>/docs/cover/PinCover.tsx examples/pin-cover/index.tsx
cp <pin>/docs/cover/pin-cover.css examples/pin-cover/

node scripts/film.mjs "<preview>/?capture=pin-cover" --select '#example' --gate --delay 1500
node scripts/film.mjs "<preview>/?capture=pin-cover" --select '#example' --still --delay 1500 --out cover-light.png
node scripts/film.mjs "<preview>/?capture=pin-cover" --select '#example' --still --delay 1500 --dark --out cover-dark.png
```

The still is a 1280px-wide viewport at 2x with the 1040 x 540 stage centered. Crop to the stage and encode:

```sh
for t in light dark; do
  ffmpeg -i cover-$t.png -vf "crop=2080:1080:240:0" -c:v libwebp -quality 90 -compression_level 6 <pin>/docs/cover-$t.webp
done
```

Icons load from jsDelivr and fonts from Google Fonts, so filming needs network access.
