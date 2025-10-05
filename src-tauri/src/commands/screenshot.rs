use serde::Serialize;
use specta::Type;
use xcap::Monitor;
use fast_image_resize::{images::Image, ResizeOptions, Resizer, ResizeAlg, PixelType};

#[derive(Serialize, Type)]
pub struct MonitorData {
    pub id: String,
    pub is_primary: bool,
    pub name: String,
    pub width: u32,
    pub height: u32,
}

#[tauri::command]
#[specta::specta]
pub fn get_monitors() -> Result<Vec<MonitorData>, String> {
    println!("-- Getting monitors...");
    
    let monitors = Monitor::all().map_err(|e| {
        let err_msg = format!("Failed to get monitors: {}", e);
        println!("-- ERROR: {}", err_msg);
        err_msg
    })?;

    if monitors.is_empty() {
        println!("-- WARNING: No monitors detected");
        return Err("No monitors detected".to_string());
    }

    let monitor_data: Vec<MonitorData> = monitors
        .into_iter()
        .map(|m| MonitorData {
            id: m.id().to_string(),
            is_primary: m.is_primary(),
            name: m.name().to_string(),
            width: m.width(),
            height: m.height(),
        })
        .collect();

    println!("-- Found {} monitor(s)", monitor_data.len());
    for (i, m) in monitor_data.iter().enumerate() {
        println!("   Monitor {}: {} ({}x{}) [primary: {}]", 
            i, m.name, m.width, m.height, m.is_primary);
    }

    Ok(monitor_data)
}

#[tauri::command]
#[specta::specta]
pub async fn take_screenshot(
    monitor_id: String,
    resize_x: u32,
    resize_y: u32,
) -> Result<String, String> {
    println!("-- Take screenshot");

    let monitor = get_monitor_by_id(monitor_id)?;

    let now = std::time::Instant::now();
    let screenshot = monitor.capture_image().map_err(|e| e.to_string())?;
    println!("-- Capture: {:?}", now.elapsed());

    let src_width = screenshot.width();
    let src_height = screenshot.height();

    // Use ultra-fast resize and encode
    let (base64_string, jpeg_size) = tokio::task::spawn_blocking(move || {
        println!("-- Starting resize task");
        let resize_start = std::time::Instant::now();
        
        // Calculate aspect ratios
        let src_aspect = src_width as f64 / src_height as f64;
        let target_aspect = resize_x as f64 / resize_y as f64;
        
        println!("-- Source aspect ratio: {:.3}, Target aspect ratio: {:.3}", src_aspect, target_aspect);
        
        // Determine crop dimensions to match target aspect ratio
        let (crop_width, crop_height, crop_x, crop_y) = if (src_aspect - target_aspect).abs() > 0.01 {
            // Aspect ratios don't match, need to crop
            if src_aspect > target_aspect {
                // Source is wider than target, crop width
                let crop_w = (src_height as f64 * target_aspect) as u32;
                let crop_x = (src_width - crop_w) / 2;
                println!("-- Cropping width: {}x{} at offset ({}, 0)", crop_w, src_height, crop_x);
                (crop_w, src_height, crop_x, 0)
            } else {
                // Source is taller than target, crop height
                let crop_h = (src_width as f64 / target_aspect) as u32;
                let crop_y = (src_height - crop_h) / 2;
                println!("-- Cropping height: {}x{} at offset (0, {})", src_width, crop_h, crop_y);
                (src_width, crop_h, 0, crop_y)
            }
        } else {
            // Aspect ratios match, no crop needed
            println!("-- No cropping needed");
            (src_width, src_height, 0, 0)
        };
        
        // Create source image from RGBA buffer and crop if necessary
        let raw_buffer = screenshot.into_raw();
        
        let src_image = if crop_width != src_width || crop_height != src_height {
            println!("-- Applying crop: {}x{} from ({}, {})", crop_width, crop_height, crop_x, crop_y);
            
            // Manually extract the cropped region
            let bytes_per_pixel = 4; // RGBA
            let mut cropped_buffer = Vec::with_capacity((crop_width * crop_height * bytes_per_pixel) as usize);
            
            for y in crop_y..(crop_y + crop_height) {
                let row_start = ((y * src_width + crop_x) * bytes_per_pixel) as usize;
                let row_end = row_start + (crop_width * bytes_per_pixel) as usize;
                cropped_buffer.extend_from_slice(&raw_buffer[row_start..row_end]);
            }
            
            println!("-- Creating cropped source image {}x{}", crop_width, crop_height);
            Image::from_vec_u8(
                crop_width,
                crop_height,
                cropped_buffer,
                PixelType::U8x4,
            ).map_err(|e| {
                let err = format!("Failed to create cropped image: {}", e);
                println!("-- ERROR: {}", err);
                err
            })?
        } else {
            println!("-- Creating source image {}x{} (no crop)", src_width, src_height);
            Image::from_vec_u8(
                src_width,
                src_height,
                raw_buffer,
                PixelType::U8x4,
            ).map_err(|e| {
                let err = format!("Failed to create source image: {}", e);
                println!("-- ERROR: {}", err);
                err
            })?
        };
        
        println!("-- Created source image, creating destination {}x{}", resize_x, resize_y);
        // Create destination image (RGBA first, we'll convert to RGB later)
        let mut dst_image = Image::new(
            resize_x,
            resize_y,
            PixelType::U8x4,
        );
        
        println!("-- Starting resize operation");
        // Use fastest resize with Nearest neighbor algorithm
        let mut resizer = Resizer::new();
        let options = ResizeOptions::new().resize_alg(ResizeAlg::Nearest);
        resizer.resize(&src_image, &mut dst_image, &options)
            .map_err(|e| {
                let err = format!("Failed to resize: {}", e);
                println!("-- ERROR: {}", err);
                err
            })?;
        
        println!("-- Resize: {:?}", resize_start.elapsed());

        // Convert RGBA to RGB manually for JPEG
        let encode_start = std::time::Instant::now();
        let rgba_buffer = dst_image.buffer();
        let mut rgb_buffer = Vec::with_capacity((resize_x * resize_y * 3) as usize);
        
        for chunk in rgba_buffer.chunks_exact(4) {
            rgb_buffer.push(chunk[0]); // R
            rgb_buffer.push(chunk[1]); // G
            rgb_buffer.push(chunk[2]); // B
            // Skip alpha channel
        }
        
        println!("-- Converted to RGB, encoding JPEG");
        let mut jpeg_bytes = Vec::new();
        let mut cursor = std::io::Cursor::new(&mut jpeg_bytes);
        
        let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut cursor, 60);
        encoder.encode(
            &rgb_buffer,
            resize_x,
            resize_y,
            image::ExtendedColorType::Rgb8,
        ).map_err(|e| {
            let err = format!("Failed to encode JPEG: {}", e);
            println!("-- ERROR: {}", err);
            err
        })?;
        
        println!("-- Encode: {:?}", encode_start.elapsed());
        
        // Convert to base64
        let base64_start = std::time::Instant::now();
        let base64_string = base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &jpeg_bytes);
        println!("-- Base64: {:?}", base64_start.elapsed());
        
        Ok::<(String, usize), String>((base64_string, jpeg_bytes.len()))
    })
    .await
    .map_err(|e| {
        let err = format!("Spawn blocking failed: {}", e);
        println!("-- ERROR: {}", err);
        err
    })??;
    
    println!("-- Resized to width: {}, height: {}", resize_x, resize_y);
    println!("-- Encoded to JPEG, size: {} bytes", jpeg_size);
    println!("-- Total time: {:?}", now.elapsed());

    Ok(base64_string)
}

fn get_monitor_by_id(monitor_id: String) -> Result<Monitor, String> {
    let monitors = Monitor::all().map_err(|e| e.to_string())?;
    let monitor = monitors.iter().find(|m| m.id().to_string() == monitor_id);

    if monitor.is_none() {
        return Err("Monitor not found".to_string());
    }

    Ok(monitor.unwrap().clone())
}
