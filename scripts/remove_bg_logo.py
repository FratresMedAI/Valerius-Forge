from PIL import Image
import numpy as np

src = r"C:\Users\Besn Daddy\.cursor\projects\c-Users-Besn-Daddy-Desktop-Praeses\assets\c__Users_Besn_Daddy_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_Screenshot_2026-05-10_at_10-36-48_AI_Portfolio_Astro_GitHub_Template_-_Grok-8e14581f-9409-4e5e-ad16-7857b4d36fdd.png"
dst = r"C:\Users\Besn Daddy\Desktop\suggestio\public\valerius-logo.png"

img = Image.open(src).convert("RGBA")
data = np.array(img, dtype=np.float32)

r, g, b, a = data[..., 0], data[..., 1], data[..., 2], data[..., 3]

# Perceived luminance
lum = 0.2126 * r + 0.7152 * g + 0.0722 * b

# Hard threshold: pixels below 60 brightness become fully transparent
# Soft ramp between 60–110 to avoid harsh edges
lo, hi = 55.0, 115.0
alpha_mask = np.clip((lum - lo) / (hi - lo), 0.0, 1.0)

data[..., 3] = (alpha_mask * 255).astype(np.uint8)

out = Image.fromarray(data.astype(np.uint8), "RGBA")
out.save(dst)
print(f"saved {dst} — size {out.size}")
