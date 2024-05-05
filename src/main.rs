use std::path::Path;

use image::imageops::FilterType;

fn main() {
    let img_folder = Path::new("/home/sebk/e");
    let out_folder = Path::new("img");

    let sizes = &[400, 600, 1000];
    let mut ids = vec![];
    
    for &size in sizes {
        let folder = out_folder.join(format!("{size}"));
        if !folder.exists() {
            std::fs::create_dir(&folder).unwrap();
        }
    }

    for e in img_folder.read_dir().unwrap() {
        let e = e.unwrap();
        let file_name = e.file_name();
        let name = file_name.to_str().unwrap();
        if name.starts_with("_DSC") && name.ends_with(".jpg") {
            let id = format!("{:05}", name[4..8].parse::<u32>().unwrap());

            let img = image::open(e.path()).unwrap();
            let aspect_ratio = img.height() as f64 / img.width() as f64;

            for &size in sizes {
                let scaled_width = size;
                let scaled_height = (size as f64 * aspect_ratio).round() as u32;
                let scaled = img.resize_exact(scaled_width, scaled_height, FilterType::CatmullRom);
                let encoded = webp::Encoder::from_image(&scaled).unwrap().encode_simple(false, 80.).unwrap();
                let path = out_folder.join(format!("{size}/{id}.webp"));
                std::fs::write(&path, &*encoded).unwrap();
            }

            ids.push((id, aspect_ratio));
        }
    }

    std::fs::write("images.json", &serde_json::to_string(&ids).unwrap()).unwrap();
}
