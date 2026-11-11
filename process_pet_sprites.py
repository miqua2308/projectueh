import os
import math
from collections import deque
from PIL import Image

PET_DIR = os.path.join(os.path.dirname(__file__), 'assets', 'pet')
RAW_DIR = os.path.join(PET_DIR, 'raw')

# Cấu hình các bộ sprite từ raw
ACTIONS = [
    { 'raw_name': 'prompt_0.png', 'action': 'origin', 'expected_frames': 1, 'start_idx': 0 },
    { 'raw_name': 'prompt_1.png', 'action': 'idle',   'expected_frames': 4, 'start_idx': 1 },
    { 'raw_name': 'prompt_2.png', 'action': 'happy',  'expected_frames': 4, 'start_idx': 5 },
    { 'raw_name': 'prompt_3.png', 'action': 'eat',    'expected_frames': 4, 'start_idx': 9 },
    { 'raw_name': 'prompt_4.png', 'action': 'sad',    'expected_frames': 2, 'start_idx': 13 },
    { 'raw_name': 'prompt_5.png', 'action': 'evolve', 'expected_frames': 3, 'start_idx': 15 },
]

# Cấu hình stage 2 -> 5 từ prompt_6.png (4 khung heo ứng với stage 2, 3, 4, 5)
STAGE_CONFIG = [
    { 'stage': 2, 'frame_idx': 0, 'name': 'Heo Teen' },
    { 'stage': 3, 'frame_idx': 1, 'name': 'Heo Phú Quý' },
    { 'stage': 4, 'frame_idx': 2, 'name': 'Heo Vàng' },
    { 'stage': 5, 'frame_idx': 3, 'name': 'Heo Thần Tài' },
]

def is_background_candidate(r, g, b, a, corner_colors=None):
    """
    Xác định pixel có phải là nền (trong suốt, trắng/sáng biên, tím/magenta/lavender, hoặc khớp màu góc)
    Tuyệt đối không nhận nhầm màu thân heo (hồng da, vàng xu, áo đỏ, viền đậm)
    """
    if a < 128:
        return True

    # 1. Nền tím/magenta/violet dưới mọi sắc độ:
    if (int(b) - int(g) > 15) and (int(r) - int(g) > 15):
        return True
    if int(r) > 110 and int(b) > 110 and int(g) < 100:
        return True
    if abs(int(r) - int(b)) < 45 and int(r) > int(g) + 20 and int(b) > int(g) + 20:
        return True

    # 2. Nền trắng, xám nhạt, viền sáng từ ảnh nén:
    if int(r) >= 215 and int(g) >= 215 and int(b) >= 215:
        return True
    if min(int(r), int(g), int(b)) >= 210:
        return True

    # 3. So khớp với màu nền các góc ảnh được lấy mẫu động:
    if corner_colors:
        for cr, cg, cb in corner_colors:
            dist = math.sqrt((int(r) - cr)**2 + (int(g) - cg)**2 + (int(b) - cb)**2)
            if dist < 42:
                return True

    return False

def clean_background_floodfill(img):
    """
    Flood-fill từ mép biên 4 phía để xóa sạch 100% nền bên ngoài thành trong suốt hoàn toàn.
    Dừng lại khi chạm viền đậm hoặc màu thân/chi tiết, không lấn vào thân bên trong.
    Sau đó quét viền 2 vòng để loại bỏ toàn bộ viền tím/magenta và vầng sáng trắng.
    """
    img = img.convert('RGBA')
    width, height = img.size
    pixels = img.load()

    # Lấy mẫu màu góc để nhận diện màu nền chính xác
    corners = [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]
    corner_colors = []
    for cx, cy in corners:
        cr, cg, cb, ca = pixels[cx, cy]
        if ca >= 128:
            corner_colors.append((int(cr), int(cg), int(cb)))

    is_bg = [[False for _ in range(width)] for _ in range(height)]
    queue = deque()

    # Thêm toàn bộ các pixel mép thỏa điều kiện nền vào hàng đợi BFS
    for x in range(width):
        for y in [0, height - 1]:
            r, g, b, a = pixels[x, y]
            if is_background_candidate(r, g, b, a, corner_colors):
                is_bg[y][x] = True
                queue.append((x, y))

    for y in range(height):
        for x in [0, width - 1]:
            if not is_bg[y][x]:
                r, g, b, a = pixels[x, y]
                if is_background_candidate(r, g, b, a, corner_colors):
                    is_bg[y][x] = True
                    queue.append((x, y))

    # BFS 4 hướng (tránh chui lọt qua góc chéo của viền)
    directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    while queue:
        cx, cy = queue.popleft()
        for dx, dy in directions:
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < width and 0 <= ny < height and not is_bg[ny][nx]:
                r, g, b, a = pixels[nx, ny]
                if is_background_candidate(r, g, b, a, corner_colors):
                    is_bg[ny][nx] = True
                    queue.append((nx, ny))

    # Đặt toàn bộ các pixel nền thành hoàn toàn trong suốt (alpha = 0)
    for y in range(height):
        for x in range(width):
            if is_bg[y][x]:
                pixels[x, y] = (0, 0, 0, 0)

    # Quét sạch viền 2 vòng: xóa sạch pixel rìa còn vệt tím hoặc viền sáng trắng kề ô trong suốt
    eight_dirs = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]
    for _ in range(2):
        to_clear = []
        for y in range(height):
            for x in range(width):
                r, g, b, a = pixels[x, y]
                if a > 0:
                    has_transparent = any(
                        (0 <= x + dx < width and 0 <= y + dy < height and pixels[x + dx, y + dy][3] == 0)
                        or not (0 <= x + dx < width and 0 <= y + dy < height)
                        for dx, dy in eight_dirs
                    )
                    if has_transparent:
                        if is_background_candidate(r, g, b, a, corner_colors) or min(r, g, b) >= 195:
                            to_clear.append((x, y))
        for (cx, cy) in to_clear:
            pixels[cx, cy] = (0, 0, 0, 0)

    # Nhị phân hóa kênh Alpha: chỉ 0 (trong suốt tuyệt đối) hoặc 255 (rõ nét tuyệt đối)
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            pixels[x, y] = (r, g, b, 255) if a >= 128 else (0, 0, 0, 0)

    return img

def split_sprite_frames(img, expected_frames):
    """
    Tách chính xác các khung dựa theo khoảng trống không gian giữa các sprite.
    """
    width, height = img.size
    if expected_frames == 1:
        return [img]

    col_density = [sum(1 for y in range(height) if img.getpixel((x, y))[3] > 0) for x in range(width)]

    # Tìm các cụm cột liên tiếp có pixel
    clusters = []
    in_cluster = False
    start_x = 0
    for x in range(width):
        if col_density[x] > 0 and not in_cluster:
            in_cluster = True
            start_x = x
        elif col_density[x] == 0 and in_cluster:
            in_cluster = False
            clusters.append((start_x, x))
    if in_cluster:
        clusters.append((start_x, width))

    # Nếu có nhiều hơn expected_frames cụm (ví dụ có tia lấp lánh tách rời),
    # gộp các cụm kề nhau có khoảng cách nhỏ nhất
    while len(clusters) > expected_frames:
        min_gap = float('inf')
        merge_idx = -1
        for i in range(len(clusters) - 1):
            gap = clusters[i + 1][0] - clusters[i][1]
            if gap < min_gap:
                min_gap = gap
                merge_idx = i
        if merge_idx >= 0:
            clusters[merge_idx] = (clusters[merge_idx][0], clusters[merge_idx + 1][1])
            clusters.pop(merge_idx + 1)
        else:
            break

    if len(clusters) == expected_frames:
        frames = []
        for (c_start, c_end) in clusters:
            pad = 1
            x1 = max(0, c_start - pad)
            x2 = min(width, c_end + pad)
            frames.append(img.crop((x1, 0, x2, height)))
        return frames

    # Fallback thông minh: tìm các điểm trũng (ít pixel nhất) giữa các khung
    w_frame = width / expected_frames
    split_points = [0]
    for i in range(1, expected_frames):
        target_x = int(round(i * w_frame))
        search_radius = max(2, int(w_frame * 0.25))
        search_range = range(max(0, target_x - search_radius), min(width, target_x + search_radius))
        best_x = min(search_range, key=lambda x: col_density[x])
        split_points.append(best_x)
    split_points.append(width)

    frames = []
    for i in range(expected_frames):
        frames.append(img.crop((split_points[i], 0, split_points[i + 1], height)))
    return frames

def align_group_and_scale_32(frames, baseline_y=28):
    """
    Thu nhỏ Nearest-Neighbor vào khung 32x32, căn giữa ngang và chân chạm baseline hàng 28.
    """
    bboxes = [f.getbbox() for f in frames if f.getbbox()]
    if not bboxes:
        return [Image.new('RGBA', (32, 32), (0, 0, 0, 0)) for _ in frames]

    max_w = max(b[2] - b[0] for b in bboxes)
    max_h = max(b[3] - b[1] for b in bboxes)

    # Đảm bảo vừa vặn tối đa 26x26 trong canvas 32x32
    scale = min(26.0 / max(max_w, 1), 24.0 / max(max_h, 1))

    output_frames = []
    for f in frames:
        bbox = f.getbbox()
        canvas = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
        if bbox:
            cropped = f.crop(bbox)
            new_w = max(1, int(round(cropped.width * scale)))
            new_h = max(1, int(round(cropped.height * scale)))
            resized = cropped.resize((new_w, new_h), Image.Resampling.NEAREST)

            # Căn giữa theo chiều ngang, đáy chân đặt tại hàng baseline_y (mặc định 28)
            offset_x = (32 - new_w) // 2
            offset_y = max(1, baseline_y - new_h)

            canvas.paste(resized, (offset_x, offset_y), resized)

        output_frames.append(canvas)

    return output_frames

def main():
    if not os.path.exists(RAW_DIR):
        print(f"Lỗi: Không tìm thấy thư mục raw tại {RAW_DIR}")
        return

    processed_count = 0
    mapping = []

    # 1. Xử lý các hành động cơ bản từ prompt_0 -> prompt_5
    for cfg in ACTIONS:
        source_path = os.path.join(RAW_DIR, cfg['raw_name'])
        if not os.path.exists(source_path):
            print(f"Bỏ qua (thiếu file raw): {cfg['raw_name']}")
            continue

        with Image.open(source_path) as original_img:
            cleaned_img = clean_background_floodfill(original_img)
            frames = split_sprite_frames(cleaned_img, cfg['expected_frames'])
            processed_frames = align_group_and_scale_32(frames, baseline_y=28)

            for i, f in enumerate(processed_frames):
                idx = cfg['start_idx'] + i
                out_name = f'prompt_{idx}.png'
                out_path = os.path.join(PET_DIR, out_name)
                # CHỈ ghi vào PET_DIR, TUYỆT ĐỐI không ghi đè vào RAW_DIR
                f.save(out_path, format='PNG')
                processed_count += 1
                mapping.append((f"{cfg['raw_name']} [Khung {i+1}]", out_name, cfg['action']))

    # 2. Xử lý 4 giai đoạn tiến hóa (Stage 2-5) từ raw/prompt_6.png (nếu có)
    prompt6_path = os.path.join(RAW_DIR, 'prompt_6.png')
    if os.path.exists(prompt6_path):
        with Image.open(prompt6_path) as p6_img:
            cleaned_p6 = clean_background_floodfill(p6_img)
            stage_frames = split_sprite_frames(cleaned_p6, 4)
            processed_stage_frames = align_group_and_scale_32(stage_frames, baseline_y=28)

            for item in STAGE_CONFIG:
                s_idx = item['frame_idx']
                if s_idx < len(processed_stage_frames):
                    frame_img = processed_stage_frames[s_idx]
                    s_dir = os.path.join(PET_DIR, f"s{item['stage']}")
                    os.makedirs(s_dir, exist_ok=True)
                    # Lưu prompt_0 và prompt_1 làm ảnh cơ bản cho stage tương ứng
                    frame_img.save(os.path.join(s_dir, 'prompt_0.png'), format='PNG')
                    frame_img.save(os.path.join(s_dir, 'prompt_1.png'), format='PNG')
                    processed_count += 2
                    mapping.append((f"prompt_6.png [Khung {s_idx+1}]", f"s{item['stage']}/prompt_0,1.png", item['name']))

    print("==================================================")
    print(f"Hoàn thành! Đã xuất {processed_count} sprite sạch vào {PET_DIR}")
    print("Ảnh raw trong assets/pet/raw/ được giữ nguyên 100%.")
    print("==================================================")
    for src, dst, act in mapping:
        print(f"• {src:25} -> {dst:25} [{act}]")

if __name__ == '__main__':
    main()
