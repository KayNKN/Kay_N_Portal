# My models and artwork

I put my exported `.glb` models in `art/models` and set each game's `model` path in `content.js`.

```js
model: "art/models/DEAD_BAND.glb",
modelRotation: "33deg",
```

I change `modelRotation` to adjust the rotation speed. The website rotates the model automatically. Selecting it opens that game's `media` gallery.

I set my shared artwork under `artwork` in `content.js`:

- `tabIcon` sets my browser tab icon.
- `mainVideo` sets my looping header video.
- `mainImage` is my fallback when `mainVideo` is empty.

I adjust the header video zoom in `.v2-logo video` in `v2.css`. My static About portrait stays in `art/Avatar.png`; its size is set by `.operator__card` in `v2.css`.
