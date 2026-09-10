#!/usr/bin/env python3
"""Regenerate assets/onboarding-desktop-composite.mp4 from assets/onboarding-flow.mp4.

ONE-OFF MAINTENANCE SCRIPT — not part of the live render pipeline. The site
never runs this at build/view time; it only ever plays the resulting .mp4
(js/main.js's SCREEN_VIDEO_ONBOARDING, clip-path'd to its `quad` in
positionScreenVideo()). Run this by hand, by design, only when someone
replaces assets/onboarding-flow.mp4 with a new take, and re-commit the
regenerated .mp4 afterwards.

Background — why this step exists at all
------------------------------------------
assets/onboarding-flow.mp4 is not a flat, edge-to-edge UI screen recording.
It is *itself* already a rendered "laptop mockup" video: a photographed/
rendered laptop with its own bezel, keyboard, desk and plant baked in, with
the actual app UI occupying only an inner sub-rectangle of its 1920x1080
frame (the rest of the frame is that video's own mockup scenery).

The hero, however, needs the UI content warped onto a *different* laptop —
the one in assets/photo_5829314581652770763_y.jpg — so the desk/bezel shown
on the live site stays a crisp static photo (see the comment above
SCREEN_VIDEO_ONBOARDING in js/main.js). Warping onboarding-flow.mp4's full
frame (bezel/keyboard/plant and all) onto that photo's screen quad — which
is what an earlier version of this asset did — produces a laptop-inside-a-
laptop: the whole inner mockup gets crushed and skewed to fit the smaller
quad, which read as "stretched/distorted" on the live page.

The fix is this two-step pipeline, applied per frame:
  1. Crop OUT onboarding-flow.mp4's own mockup scenery, keeping only the
     INNER_RECT sub-rectangle (the actual UI content).
  2. Perspective-warp *that* crop onto QUAD — the same four corners
     js/main.js's SCREEN_VIDEO_ONBOARDING.quad already uses to clip the
     result on the live page.

INNER_RECT is a magic number — document before touching
---------------------------------------------------------
INNER_RECT below was measured against ONE specific frame of the CURRENT
assets/onboarding-flow.mp4 (see measure_inner_rect() / --detect). It is not
computed at render time and nothing will warn you if it silently goes stale.
If onboarding-flow.mp4 is ever replaced with a new take:
  - The new recording almost certainly has different mockup bezel dimensions
    (different template, different export size/crop), so INNER_RECT MUST be
    re-measured — don't assume the old numbers still apply.
  - Run `python3 scripts/regenerate-onboarding-composite.py --detect` first.
    It auto-detects the inner near-white UI rectangle from a sample frame
    via contour detection and prints what it found — sanity-check that
    printed box against the frame grab before trusting it (a frame that
    happens to show a dark modal/overlay, or content that touches the
    screen edge, can throw the whiteness threshold off), then update
    INNER_RECT by hand.
  - QUAD must stay byte-for-byte in sync with SCREEN_VIDEO_ONBOARDING.quad
    in js/main.js — if that quad is ever re-measured against a new hero
    photo, update QUAD here to match, not the other way around (main.js is
    the source of truth, since that's what actually positions/clips things
    on the live page).

Usage
-----
    python3 scripts/regenerate-onboarding-composite.py --detect   # sanity-check INNER_RECT first
    python3 scripts/regenerate-onboarding-composite.py            # regenerate the composite

Requires ffmpeg/ffprobe on PATH and `opencv-python` + `numpy` installed.
"""

import argparse
import subprocess

import cv2
import numpy as np

REPO_ROOT = "/Users/annaiarinovskaia/portfolio2"
SRC = f"{REPO_ROOT}/assets/onboarding-flow.mp4"
OUT = f"{REPO_ROOT}/assets/onboarding-desktop-composite.mp4"

SRC_W, SRC_H = 1920, 1080
DST_W, DST_H = 2400, 1260
FPS = 30

# Inner UI-content rectangle inside onboarding-flow.mp4's OWN frame — i.e.
# where the actual app screen sits inside that video's baked-in laptop
# mockup, excluding its bezel/keyboard/desk/plant. Measured via --detect
# against frame 60 (the opening "Willkommen" screen). See module docstring.
INNER_L, INNER_T, INNER_R, INNER_B = 460, 107, 1483, 795

# Must match SCREEN_VIDEO_ONBOARDING.quad in js/main.js exactly, in the same
# [TL, BL, BR, TR] order — this is the destination screen area measured
# against assets/photo_5829314581652770763_y.jpg, nudged ~2% outward onto
# the bezel (see that constant's comment in main.js for why).
QUAD = np.array([[566, 226], [604, 844], [1618, 781], [1578, 206]], dtype=np.float32)


def measure_inner_rect(frame):
    """Auto-detect the inner near-white UI rectangle in a source frame.

    Best-effort helper for re-measuring INNER_RECT when the source video
    changes — NOT run automatically as part of regeneration. Thresholds for
    near-white pixels and takes the largest resulting contour's bounding
    box. Verify the result by eye (e.g. crop the frame to the printed box
    and look at it) before trusting it: a frame with a dark modal, low
    contrast, or UI touching the frame edge can throw this off.
    """
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    mask = cv2.inRange(gray, 235, 255)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    if not contours:
        raise RuntimeError("no near-white contour found — pick a different sample frame")
    x, y, w, h = cv2.boundingRect(contours[0])
    return x, y, x + w, y + h


def run_detect(sample_frame_index):
    cmd = [
        "ffmpeg", "-y", "-v", "error", "-i", SRC,
        "-vf", f"select=eq(n\\,{sample_frame_index})", "-vframes", "1",
        "-f", "image2pipe", "-vcodec", "png", "-",
    ]
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, check=True)
    frame = cv2.imdecode(np.frombuffer(proc.stdout, dtype=np.uint8), cv2.IMREAD_COLOR)
    l, t, r, b = measure_inner_rect(frame)
    print(f"Detected inner rect at frame {sample_frame_index}: ({l}, {t}, {r}, {b})")
    print(f"Currently hardcoded INNER_RECT:                    ({INNER_L}, {INNER_T}, {INNER_R}, {INNER_B})")
    if (l, t, r, b) != (INNER_L, INNER_T, INNER_R, INNER_B):
        print("These differ — re-check by eye before updating INNER_RECT in this script.")
    else:
        print("Matches the hardcoded value.")


def run_regenerate():
    inner_w = INNER_R - INNER_L
    inner_h = INNER_B - INNER_T
    src_corners = np.array([[0, 0], [0, inner_h], [inner_w, inner_h], [inner_w, 0]], dtype=np.float32)
    M = cv2.getPerspectiveTransform(src_corners, QUAD)

    mask = np.zeros((DST_H, DST_W), dtype=np.uint8)
    cv2.fillConvexPoly(mask, QUAD.astype(np.int32), 255)
    mask3 = cv2.merge([mask, mask, mask])

    reader = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-i", SRC, "-f", "rawvideo", "-pix_fmt", "bgr24", "-"],
        stdout=subprocess.PIPE,
    )
    writer = subprocess.Popen(
        [
            "ffmpeg", "-y", "-v", "error",
            "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{DST_W}x{DST_H}", "-r", str(FPS),
            "-i", "-",
            "-an", "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p",
            "-b:v", "420k", "-maxrate", "600k", "-bufsize", "800k",
            "-movflags", "+faststart",
            OUT,
        ],
        stdin=subprocess.PIPE,
    )

    frame_bytes = SRC_W * SRC_H * 3
    bg = np.zeros((DST_H, DST_W, 3), dtype=np.uint8)
    frame_count = 0
    while True:
        raw = reader.stdout.read(frame_bytes)
        if len(raw) < frame_bytes:
            break
        frame = np.frombuffer(raw, dtype=np.uint8).reshape(SRC_H, SRC_W, 3)
        crop = frame[INNER_T:INNER_B, INNER_L:INNER_R]
        warped = cv2.warpPerspective(crop, M, (DST_W, DST_H), flags=cv2.INTER_LINEAR)
        out = np.where(mask3 > 0, warped, bg)
        writer.stdin.write(out.tobytes())
        frame_count += 1

    reader.stdout.close()
    reader.wait()
    writer.stdin.close()
    writer.wait()
    print(f"Wrote {frame_count} frames to {OUT}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--detect", action="store_true", help="print an auto-detected INNER_RECT instead of regenerating")
    ap.add_argument("--frame", type=int, default=60, help="frame index to sample for --detect (default: 60)")
    args = ap.parse_args()

    if args.detect:
        run_detect(args.frame)
    else:
        run_regenerate()
