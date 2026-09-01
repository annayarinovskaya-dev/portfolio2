// Shared "laptop mockup" geometry — reused by any ScrollStory instance to line
// up a screen-content overlay (a static screenshot, or crossfading product
// screenshots) against a photo of an open laptop.
//
// A case study supplies one config: { imageWidth, imageHeight, screen: {left,
// top, right, bottom} } — the pixel rect of the screen area measured against
// the source photo. Two consumers of that same config:
//   - computeScreenRect(): cover-fit math for when the photo fills a dynamic
//     viewport-sized container (desktop pinned stage, object-fit: cover).
//   - screenRectPercent(): simple percentages for when the photo is shown at
//     its own natural size (mobile/stacked layout, no cover-fit cropping).
(function () {
  'use strict';

  function computeScreenRect(container, config, zoom) {
    const { imageWidth, imageHeight, screen } = config;
    const vw = container.clientWidth;
    const vh = container.clientHeight;
    const scale = Math.max(vw / imageWidth, vh / imageHeight);
    const renderedW = imageWidth * scale;
    const renderedH = imageHeight * scale;
    const offsetX = (vw - renderedW) / 2;
    const offsetY = (vh - renderedH) / 2;

    const baseLeft = offsetX + screen.left * scale;
    const baseTop = offsetY + screen.top * scale;
    const baseWidth = (screen.right - screen.left) * scale;
    const baseHeight = (screen.bottom - screen.top) * scale;

    const z = zoom || 1;
    const width = baseWidth * z;
    const height = baseHeight * z;
    const left = vw / 2 + (baseLeft + baseWidth / 2 - vw / 2) * z - width / 2;
    const top = vh / 2 + (baseTop + baseHeight / 2 - vh / 2) * z - height / 2;

    return { left, top, width, height };
  }

  function screenRectPercent(config) {
    const { imageWidth, imageHeight, screen } = config;
    return {
      left: (screen.left / imageWidth) * 100,
      top: (screen.top / imageHeight) * 100,
      width: ((screen.right - screen.left) / imageWidth) * 100,
      height: ((screen.bottom - screen.top) / imageHeight) * 100
    };
  }

  window.LaptopMockup = { computeScreenRect, screenRectPercent };
})();
