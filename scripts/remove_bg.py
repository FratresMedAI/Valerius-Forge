from rembg import remove
from PIL import Image

src = r"C:\Users\Besn Daddy\.cursor\projects\c-Users-Besn-Daddy-Desktop-Praeses\assets\c__Users_Besn_Daddy_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-e728968e-b038-43c0-8764-c736465ac35e.png"
dst = r"C:\Users\Besn Daddy\Desktop\suggestio\public\templar-knight.png"

img = Image.open(src)
out = remove(img)
out.save(dst)
print(f"saved {dst} — size {out.size}, mode {out.mode}")
