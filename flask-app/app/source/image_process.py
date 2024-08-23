from PIL import Image
import datetime
import uuid


def allowed_file(filename, allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions

def generate_filename(mts_id, file_extension):
    timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
    unique_id = uuid.uuid4().hex
    return f"{mts_id}_{timestamp}_{unique_id}.{file_extension}"

def resize_and_save_image(input_file, output_path, max_width=1024):
    with Image.open(input_file) as img:
        # Resize image while maintaining aspect ratio
        if img.width > max_width:
            width_percent = (max_width / float(img.width))
            new_height = int((float(img.height) * float(width_percent)))
            img = img.resize((max_width, new_height), Image.ADAPTIVE)
        img.save(output_path, quality=85)  # Quality is optional, adjust as needed
