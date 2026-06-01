import re
import base64

svg_path = r'd:\personal-loan-app\personal-loan-app\src\assets\animations\illustration\3d\wallet_icon.svg'
png_path = r'd:\personal-loan-app\personal-loan-app\src\assets\animations\illustration\3d\wallet_icon.png'

with open(svg_path, 'r', encoding='utf-8') as f:
    svg_content = f.read()

match = re.search(r'data:image/png;base64,([A-Za-z0-9+/= \r\n]+)', svg_content)
if match:
    base64_data = match.group(1).replace(' ', '').replace('\r', '').replace('\n', '')
    image_data = base64.b64decode(base64_data)
    with open(png_path, 'wb') as f:
        f.write(image_data)
    print("PNG successfully written to:", png_path)
else:
    print("Error: Base64 data not found in SVG.")
