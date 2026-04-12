import struct, zlib, os

def create_png_rgba(width, height):
    def chunk(chunk_type, data):
        c = chunk_type + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    header = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
    raw = b''
    for y in range(height):
        raw += b'\x00'
        for x in range(width):
            cx, cy = x - width//2, y - height//2
            dist = (cx*cx + cy*cy) ** 0.5
            r = width // 3
            if dist < r:
                alpha = 255
                raw += bytes([255, 255, 255, alpha])
            elif dist < r + 2:
                alpha = max(0, int(255 * (1 - (dist - r) / 2)))
                raw += bytes([255, 255, 255, alpha])
            else:
                raw += bytes([0, 51, 102, 255])
    idat = chunk(b'IDAT', zlib.compress(raw))
    iend = chunk(b'IEND', b'')
    return header + ihdr + idat + iend

os.makedirs('src-tauri/icons', exist_ok=True)
for name, sz in [('32x32.png', 32), ('128x128.png', 128), ('128x128@2x.png', 256), ('icon.png', 512)]:
    with open(f'src-tauri/icons/{name}', 'wb') as f:
        f.write(create_png_rgba(sz, sz))
print('RGBA icons created successfully')
