from rembg import remove
from PIL import Image

src = r"C:\Users\Besn Daddy\.cursor\projects\c-Users-Besn-Daddy-Desktop-Praeses\assets\c__Users_Besn_Daddy_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_Tem-9fb14792-967e-432d-a608-fc3ec4473fe7.png"
dst = r"C:\Users\Besn Daddy\Desktop\suggestio\public\templar-helm.png"

img = Image.open(src)
out = remove(img)

# Crop out the bottom watermark strip (~bottom 12%)
w, h = out.size
out = out.crop((0, 0, w, int(h * 0.88)))

out.save(dst)
print(f"saved {dst} — size {out.size}")
