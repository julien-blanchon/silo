use image::{imageops::FilterType, DynamicImage};
use serde::Serialize;
use specta::Type;
use xcap::Monitor;

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
    let monitors = Monitor::all().map_err(|e| e.to_string())?;

    Ok(monitors
        .into_iter()
        .map(|m| MonitorData {
            id: m.id().to_string(),
            is_primary: m.is_primary(),
            name: m.name().to_string(),
            width: m.width(),
            height: m.height(),
        })
        .collect())
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

    // Convert to DynamicImage and resize in memory
    let resized_image = tokio::task::spawn_blocking(move || {
        let dynamic_image = DynamicImage::ImageRgba8(screenshot);
        dynamic_image.resize(resize_x, resize_y, FilterType::Lanczos3)
    })
    .await
    .map_err(|e| e.to_string())?;

    // Convert to PNG bytes in memory
    let png_bytes = tokio::task::spawn_blocking(move || {
        let mut bytes: Vec<u8> = Vec::new();
        let mut cursor = std::io::Cursor::new(&mut bytes);
        resized_image
            .write_to(&mut cursor, image::ImageFormat::Png)
            .map_err(|e| e.to_string())?;
        Ok::<Vec<u8>, String>(bytes)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e.to_string())?;

    // Convert to base64
    let base64_string = base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &png_bytes);
    
    println!("-- Resized to width: {}, height: {}", resize_x, resize_y);
    println!("-- Converted to base64, size: {} bytes", png_bytes.len());
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
