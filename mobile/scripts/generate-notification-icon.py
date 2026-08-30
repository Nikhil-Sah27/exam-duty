#!/usr/bin/env python3
"""
Generate the Android notification icon.

Run:  python3 scripts/generate-notification-icon.py

Android does NOT render this image as drawn. It reads only the ALPHA channel,
discards every colour, and refills the opaque pixels with the tint from the
`color` option in app.json. So the source must be a white silhouette on full
transparency: anything with a background, a gradient or fine detail arrives in
the status bar as a solid square, which is the single most common way this
asset gets shipped broken.

It is generated rather than hand-drawn so the shape stays reproducible and the
constraints above stay written down next to it.

Drawn at 8x and downsampled with LANCZOS, because the glyph is read at roughly
24dp in the status bar and aliasing on the diagonal of the check is the first
thing to fall apart at that size.
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw

# 96px is the xxxhdpi bucket Android asks for; smaller densities are derived.
SIZE = 96
SCALE = 8
S = SIZE * SCALE

# Solid glyph with the check knocked out, rather than an outline. A single-
# weight outline greys out at status-bar size; a filled body with a cut-out
# keeps two clear tones however far it is scaled down.
img = Image.new("L", (S, S), 0)
d = ImageDraw.Draw(img)

OPAQUE = 255
CLEAR = 0

# Clipboard body. Inset leaves the breathing room Android expects; without it
# the OS crops into the glyph on some launchers.
body = [S * 0.17, S * 0.20, S * 0.83, S * 0.88]
d.rounded_rectangle(body, radius=S * 0.09, fill=OPAQUE)

# The clip at the top, drawn as a notch cut out of the body plus a tab sitting
# in it — this is what makes the silhouette read as a clipboard and not a phone.
d.rounded_rectangle(
    [S * 0.30, S * 0.10, S * 0.70, S * 0.27], radius=S * 0.05, fill=CLEAR
)
d.rounded_rectangle(
    [S * 0.36, S * 0.13, S * 0.64, S * 0.24], radius=S * 0.045, fill=OPAQUE
)

# Checkmark, cut out of the body. Drawn as two strokes with round joins so the
# corner does not notch when the image is reduced.
check = [(S * 0.34, S * 0.58), (S * 0.45, S * 0.69), (S * 0.67, S * 0.44)]
d.line(check, fill=CLEAR, width=int(S * 0.085), joint="curve")
for point in check:
    r = S * 0.0425
    d.ellipse([point[0] - r, point[1] - r, point[0] + r, point[1] + r], fill=CLEAR)

icon = Image.new("RGBA", (S, S), (255, 255, 255, 0))
# White everywhere; the mask carries the shape. Android replaces the colour
# anyway, but a white source is what every Android guide specifies and it makes
# the file previewable on its own.
icon.putalpha(img)
icon.paste((255, 255, 255, 0), (0, 0), Image.new("L", (S, S), 0))
white = Image.new("RGBA", (S, S), (255, 255, 255, 255))
white.putalpha(img)

out = white.resize((SIZE, SIZE), Image.LANCZOS)
out.save("assets/notification-icon.png")

# Everything under assets/ is bundled into the app binary, so an inspection
# copy does NOT belong there. Written only on request, and outside assets/.
if "--preview" in sys.argv:
    Path("build").mkdir(exist_ok=True)
    white.resize((384, 384), Image.LANCZOS).save("build/notification-icon-preview.png")
    print("wrote build/notification-icon-preview.png  384x384 (inspection only)")

alpha = out.split()[3]
covered = sum(1 for p in alpha.tobytes() if p > 0) / (SIZE * SIZE)
print(f"wrote assets/notification-icon.png  {SIZE}x{SIZE}  alpha coverage {covered:.0%}")
