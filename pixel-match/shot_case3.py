#!/usr/bin/env python3
import argparse
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument("--url", required=True)
ap.add_argument("--out", required=True)
ap.add_argument("--width", type=int, default=2202)
ap.add_argument("--height", type=int, default=1201)
ap.add_argument("--device-scale-factor", type=float, default=2.0)
args = ap.parse_args()

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(
        viewport={"width": args.width, "height": args.height},
        device_scale_factor=args.device_scale_factor,
    )
    page.goto(args.url, wait_until="networkidle")
    page.click('.case-tab[data-case="3"]')
    page.wait_for_timeout(600)
    page.screenshot(path=args.out)
    browser.close()
print(f"Saved screenshot to {args.out}")
