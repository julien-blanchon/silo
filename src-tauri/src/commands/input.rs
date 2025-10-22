use enigo::{Button, Coordinate, Direction, Enigo, Key, Keyboard, Mouse, Settings};
use xcap::Monitor;
use serde::Serialize;
use specta::Type;

#[derive(Serialize, Type)]
pub struct ActionResult {
    pub success: bool,
    pub message: String,
    pub screenshot: Option<String>,
}

#[tauri::command]
#[specta::specta]
pub async fn move_mouse(
    monitor_id: String,
    x: i32,
    y: i32,
    auto_screenshot: Option<bool>,
    screenshot_width: Option<u32>,
    screenshot_height: Option<u32>,
) -> Result<ActionResult, String> {
    let auto_screenshot = auto_screenshot.unwrap_or(true);
    println!("-- Move mouse: {:?}, {:?}, auto_screenshot: {:?}", x, y, auto_screenshot);

    // Perform enigo operations in a blocking context
    {
        let monitor = get_monitor_by_id(monitor_id.clone())?;
        let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
        enigo
            .move_mouse(monitor.x() + x, monitor.y() + y, Coordinate::Abs)
            .map_err(|e| e.to_string())?;
    } // enigo is dropped here

    // Take screenshot if requested
    let screenshot = if auto_screenshot {
        // Use std::thread::sleep instead of tokio::time::sleep for better thread safety
        std::thread::sleep(std::time::Duration::from_millis(100));
        take_action_screenshot(monitor_id, screenshot_width, screenshot_height).await
    } else {
        None
    };

    Ok(ActionResult {
        success: true,
        message: format!("Successfully moved mouse to ({}, {})", x, y),
        screenshot,
    })
}

#[tauri::command]
#[specta::specta]
pub async fn mouse_click(
    monitor_id: String,
    side: String,
    x: Option<i32>,
    y: Option<i32>,
    auto_screenshot: Option<bool>,
    screenshot_width: Option<u32>,
    screenshot_height: Option<u32>,
) -> Result<ActionResult, String> {
    let auto_screenshot = auto_screenshot.unwrap_or(true);
    println!("-- Mouse click: {:?}, {:?}, auto_screenshot: {:?}", side, (x, y), auto_screenshot);

    // Perform enigo operations in a blocking context
    {
        let monitor = get_monitor_by_id(monitor_id.clone())?;
        let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;

        let button = match side.as_str() {
            "left" => Button::Left,
            "right" => Button::Right,
            _ => return Err("Invalid mouse button".to_string()),
        };

        if let (Some(x), Some(y)) = (x, y) {
            println!("-- Move: {:?}, {:?}", x, y);
            enigo
                .move_mouse(monitor.x() + x, monitor.y() + y, Coordinate::Abs)
                .map_err(|e| e.to_string())?;
        }

        println!("-- Click: {:?}", button);
        enigo
            .button(button, Direction::Click)
            .map_err(|e| e.to_string())?;
    } // enigo is dropped here

    // Take screenshot if requested
    let screenshot = if auto_screenshot {
        // Use std::thread::sleep instead of tokio::time::sleep for better thread safety
        std::thread::sleep(std::time::Duration::from_millis(100));
        take_action_screenshot(monitor_id, screenshot_width, screenshot_height).await
    } else {
        None
    };

    Ok(ActionResult {
        success: true,
        message: format!("Successfully clicked {} button", side),
        screenshot,
    })
}

#[tauri::command]
#[specta::specta]
pub fn get_cursor_position(monitor_id: String) -> Result<(i32, i32), String> {
    println!("-- Get cursor position");

    let monitor = get_monitor_by_id(monitor_id)?;

    let enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;

    Ok(enigo
        .location()
        .map(|(x, y)| (x + monitor.x(), y + monitor.y()))
        .map_err(|e| e.to_string())?)
}

#[tauri::command]
#[specta::specta]
pub async fn type_text(
    text: String,
    monitor_id: String,
    auto_screenshot: Option<bool>,
    screenshot_width: Option<u32>,
    screenshot_height: Option<u32>,
) -> Result<ActionResult, String> {
    let auto_screenshot = auto_screenshot.unwrap_or(true);
    println!("-- Type text: {:?}, auto_screenshot: {:?}", text, auto_screenshot);

    // Perform enigo operations in a blocking context
    {
        let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
        enigo.text(&text).map_err(|e| e.to_string())?;
    } // enigo is dropped here

    // Take screenshot if requested
    let screenshot = if auto_screenshot {
        // Use std::thread::sleep instead of tokio::time::sleep for better thread safety
        std::thread::sleep(std::time::Duration::from_millis(100));
        take_action_screenshot(monitor_id, screenshot_width, screenshot_height).await
    } else {
        None
    };

    Ok(ActionResult {
        success: true,
        message: format!("Successfully typed: {:?}", text),
        screenshot,
    })
}

#[tauri::command]
#[specta::specta]
pub async fn scroll(
    monitor_id: String,
    direction: String,
    amount: i32,
    auto_screenshot: Option<bool>,
    screenshot_width: Option<u32>,
    screenshot_height: Option<u32>,
) -> Result<ActionResult, String> {
    let auto_screenshot = auto_screenshot.unwrap_or(true);
    println!("-- Scroll: {:?}, amount: {:?}, auto_screenshot: {:?}", direction, amount, auto_screenshot);

    // Perform enigo operations in a blocking context
    {
        let _monitor = get_monitor_by_id(monitor_id.clone())?;
        let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;

        // Convert scroll amount to pixels (approximate)
        let scroll_pixels = amount * 100;

        match direction.as_str() {
            "up" => {
                enigo
                    .scroll(scroll_pixels, enigo::Axis::Vertical)
                    .map_err(|e| e.to_string())?;
            }
            "down" => {
                enigo
                    .scroll(-scroll_pixels, enigo::Axis::Vertical)
                    .map_err(|e| e.to_string())?;
            }
            "left" => {
                enigo
                    .scroll(scroll_pixels, enigo::Axis::Horizontal)
                    .map_err(|e| e.to_string())?;
            }
            "right" => {
                enigo
                    .scroll(-scroll_pixels, enigo::Axis::Horizontal)
                    .map_err(|e| e.to_string())?;
            }
            _ => return Err("Invalid scroll direction. Use: up, down, left, right".to_string()),
        }
    } // enigo is dropped here

    // Take screenshot if requested
    let screenshot = if auto_screenshot {
        // Use std::thread::sleep instead of tokio::time::sleep for better thread safety
        std::thread::sleep(std::time::Duration::from_millis(200)); // Longer delay for scroll
        take_action_screenshot(monitor_id, screenshot_width, screenshot_height).await
    } else {
        None
    };

    Ok(ActionResult {
        success: true,
        message: format!("Successfully scrolled {} by {}", direction, amount),
        screenshot,
    })
}

#[tauri::command]
#[specta::specta]
pub async fn press_key(
    key: String,
    monitor_id: String,
    auto_screenshot: Option<bool>,
    screenshot_width: Option<u32>,
    screenshot_height: Option<u32>,
) -> Result<ActionResult, String> {
    let auto_screenshot = auto_screenshot.unwrap_or(true);
    println!("-- Press key: {:?}, auto_screenshot: {:?}", key, auto_screenshot);

    // key examples: "a", "Return", "alt+Tab", "ctrl+s", "Up", "KP_0" (for the numpad 0 key).

    // Perform enigo operations in a blocking context
    {
        let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;

        // see if there is a special key before the key name like ctrl, shift, alt, cmd, etc
        // if so, split the string by the special key and press the special key and the key name
        // otherwise, just press the key name

        let key_name: String;
        let mut special_key: Option<String> = None;

        if key.contains("+") {
            let parts = key.split("+").collect::<Vec<&str>>();
            special_key = Some(parts[0].to_string());
            key_name = parts[1].to_string();
        } else {
            key_name = key.clone();
        }

        if let Some(special_key) = &special_key {
            let key_enum = get_key_from_name(special_key.clone())?;

            enigo
                .key(key_enum, Direction::Press)
                .map_err(|e| e.to_string())?;
        }

        let key_enum = get_key_from_name(key_name)?;

        enigo
            .key(key_enum, Direction::Click)
            .map_err(|e| e.to_string())?;

        if let Some(special_key) = special_key {
            let key_enum = get_key_from_name(special_key)?;

            enigo
                .key(key_enum, Direction::Release)
                .map_err(|e| e.to_string())?;
        }
    } // enigo is dropped here

    // Take screenshot if requested
    let screenshot = if auto_screenshot {
        // Use std::thread::sleep instead of tokio::time::sleep for better thread safety
        std::thread::sleep(std::time::Duration::from_millis(100));
        take_action_screenshot(monitor_id, screenshot_width, screenshot_height).await
    } else {
        None
    };

    Ok(ActionResult {
        success: true,
        message: format!("Successfully pressed key: {}", key),
        screenshot,
    })
}

#[tauri::command]
#[specta::specta]
pub async fn wait(
    duration: f64,
    monitor_id: String,
    auto_screenshot: Option<bool>,
    screenshot_width: Option<u32>,
    screenshot_height: Option<u32>,
) -> Result<ActionResult, String> {
    let auto_screenshot = auto_screenshot.unwrap_or(true);
    println!("-- Wait: {:?} seconds, auto_screenshot: {:?}", duration, auto_screenshot);

    // Convert duration from seconds to milliseconds
    let duration_ms = (duration * 1000.0) as u64;
    
    // Perform the wait
    std::thread::sleep(std::time::Duration::from_millis(duration_ms));

    // Take screenshot if requested
    let screenshot = if auto_screenshot {
        take_action_screenshot(monitor_id, screenshot_width, screenshot_height).await
    } else {
        None
    };

    Ok(ActionResult {
        success: true,
        message: format!("Successfully waited {} seconds", duration),
        screenshot,
    })
}

#[tauri::command]
#[specta::specta]
pub async fn mouse_drag(
    monitor_id: String,
    start_x: i32,
    start_y: i32,
    end_x: i32,
    end_y: i32,
    auto_screenshot: Option<bool>,
    screenshot_width: Option<u32>,
    screenshot_height: Option<u32>,
) -> Result<ActionResult, String> {
    let auto_screenshot = auto_screenshot.unwrap_or(true);
    println!("-- Mouse drag: from ({}, {}) to ({}, {}), auto_screenshot: {:?}", 
             start_x, start_y, end_x, end_y, auto_screenshot);

    // Perform enigo operations in a blocking context
    {
        let monitor = get_monitor_by_id(monitor_id.clone())?;
        let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;

        // Move to start position
        enigo
            .move_mouse(monitor.x() + start_x, monitor.y() + start_y, Coordinate::Abs)
            .map_err(|e| e.to_string())?;
        
        // Small delay to ensure the move completes
        std::thread::sleep(std::time::Duration::from_millis(50));

        // Press left button
        enigo
            .button(Button::Left, Direction::Press)
            .map_err(|e| e.to_string())?;
        
        // Small delay between press and move
        std::thread::sleep(std::time::Duration::from_millis(50));

        // Move to end position while holding button
        enigo
            .move_mouse(monitor.x() + end_x, monitor.y() + end_y, Coordinate::Abs)
            .map_err(|e| e.to_string())?;
        
        // Small delay before releasing
        std::thread::sleep(std::time::Duration::from_millis(50));

        // Release left button
        enigo
            .button(Button::Left, Direction::Release)
            .map_err(|e| e.to_string())?;
    } // enigo is dropped here

    // Take screenshot if requested
    let screenshot = if auto_screenshot {
        // Use std::thread::sleep instead of tokio::time::sleep for better thread safety
        std::thread::sleep(std::time::Duration::from_millis(100));
        take_action_screenshot(monitor_id, screenshot_width, screenshot_height).await
    } else {
        None
    };

    Ok(ActionResult {
        success: true,
        message: format!("Successfully dragged from ({}, {}) to ({}, {})", start_x, start_y, end_x, end_y),
        screenshot,
    })
}

fn get_monitor_by_id(monitor_id: String) -> Result<Monitor, String> {
    let monitors = Monitor::all().map_err(|e| e.to_string())?;
    let monitor = monitors.iter().find(|m| m.id().to_string() == monitor_id);

    if monitor.is_none() {
        return Err("Monitor not found".to_string());
    }

    Ok(monitor.unwrap().clone())
}

// Helper function to take a screenshot after an action
async fn take_action_screenshot(monitor_id: String, width: Option<u32>, height: Option<u32>) -> Option<String> {
    // If width/height not provided, get monitor dimensions
    let (final_width, final_height) = if let (Some(w), Some(h)) = (width, height) {
        (w, h)
    } else {
        match get_monitor_by_id(monitor_id.clone()) {
            Ok(monitor) => (monitor.width(), monitor.height()),
            Err(e) => {
                println!("-- Failed to get monitor dimensions: {:?}", e);
                return None;
            }
        }
    };
    
    // Call the take_screenshot function from screenshot module
    match crate::commands::screenshot::take_screenshot(monitor_id, final_width, final_height).await {
        Ok(base64_data) => Some(base64_data),
        Err(e) => {
            println!("-- Failed to take auto-screenshot: {:?}", e);
            None
        }
    }
}

// This need a mapping from the key name to the enigo key
// https://docs.rs/enigo/latest/src/enigo/keycodes.rs.html
fn get_key_from_name(key_name: String) -> Result<Key, String> {
    // Convert to lowercase for case-insensitive matching
    let key_lower = key_name.to_lowercase();
    match key_lower.as_str() {
        #[cfg(target_os = "windows")]
        "0" => Ok(Key::Num0),
        #[cfg(target_os = "windows")]
        "1" => Ok(Key::Num1),
        #[cfg(target_os = "windows")]
        "2" => Ok(Key::Num2),
        #[cfg(target_os = "windows")]
        "3" => Ok(Key::Num3),
        #[cfg(target_os = "windows")]
        "4" => Ok(Key::Num4),
        #[cfg(target_os = "windows")]
        "5" => Ok(Key::Num5),
        #[cfg(target_os = "windows")]
        "6" => Ok(Key::Num6),
        #[cfg(target_os = "windows")]
        "7" => Ok(Key::Num7),
        #[cfg(target_os = "windows")]
        "8" => Ok(Key::Num8),
        #[cfg(target_os = "windows")]
        "9" => Ok(Key::Num9),
        #[cfg(target_os = "windows")]
        "a" => Ok(Key::A),
        #[cfg(target_os = "windows")]
        "b" => Ok(Key::B),
        #[cfg(target_os = "windows")]
        "c" => Ok(Key::C),
        #[cfg(target_os = "windows")]
        "d" => Ok(Key::D),
        #[cfg(target_os = "windows")]
        "e" => Ok(Key::E),
        #[cfg(target_os = "windows")]
        "f" => Ok(Key::F),
        #[cfg(target_os = "windows")]
        "g" => Ok(Key::G),
        #[cfg(target_os = "windows")]
        "h" => Ok(Key::H),
        #[cfg(target_os = "windows")]
        "i" => Ok(Key::I),
        #[cfg(target_os = "windows")]
        "j" => Ok(Key::J),
        #[cfg(target_os = "windows")]
        "k" => Ok(Key::K),
        #[cfg(target_os = "windows")]
        "l" => Ok(Key::L),
        #[cfg(target_os = "windows")]
        "m" => Ok(Key::M),
        #[cfg(target_os = "windows")]
        "n" => Ok(Key::N),
        #[cfg(target_os = "windows")]
        "o" => Ok(Key::O),
        #[cfg(target_os = "windows")]
        "p" => Ok(Key::P),
        #[cfg(target_os = "windows")]
        "q" => Ok(Key::Q),
        #[cfg(target_os = "windows")]
        "r" => Ok(Key::R),
        #[cfg(target_os = "windows")]
        "s" => Ok(Key::S),
        #[cfg(target_os = "windows")]
        "t" => Ok(Key::T),
        #[cfg(target_os = "windows")]
        "u" => Ok(Key::U),
        #[cfg(target_os = "windows")]
        "v" => Ok(Key::V),
        #[cfg(target_os = "windows")]
        "w" => Ok(Key::W),
        #[cfg(target_os = "windows")]
        "x" => Ok(Key::X),
        #[cfg(target_os = "windows")]
        "y" => Ok(Key::Y),
        #[cfg(target_os = "windows")]
        "z" => Ok(Key::Z),
        "alt" => Ok(Key::Alt),
        "backspace" => Ok(Key::Backspace),
        "capslock" => Ok(Key::CapsLock),
        "control" | "ctrl" => Ok(Key::Control),
        "delete" => Ok(Key::Delete),
        "downarrow" | "down" => Ok(Key::DownArrow),
        "end" => Ok(Key::End),
        "escape" | "esc" => Ok(Key::Escape),
        "f1" => Ok(Key::F1),
        "f2" => Ok(Key::F2),
        "f3" => Ok(Key::F3),
        "f4" => Ok(Key::F4),
        "f5" => Ok(Key::F5),
        "f6" => Ok(Key::F6),
        "f7" => Ok(Key::F7),
        "f8" => Ok(Key::F8),
        "f9" => Ok(Key::F9),
        "f10" => Ok(Key::F10),
        "f11" => Ok(Key::F11),
        "f12" => Ok(Key::F12),
        "home" => Ok(Key::Home),
        "leftarrow" | "left" => Ok(Key::LeftArrow),
        "meta" | "command" | "cmd" | "windows" | "super" => Ok(Key::Meta),
        "option" => Ok(Key::Option),
        "pagedown" => Ok(Key::PageDown),
        "pageup" => Ok(Key::PageUp),
        "return" | "enter" | "kp_enter" => Ok(Key::Return),
        "rightarrow" | "right" => Ok(Key::RightArrow),
        "shift" => Ok(Key::Shift),
        "space" => Ok(Key::Space),
        "tab" => Ok(Key::Tab),
        "uparrow" | "up" => Ok(Key::UpArrow),
        _ => {
            // Try to parse as Unicode character if it's a single char
            if key_name.chars().count() == 1 {
                Ok(Key::Unicode(key_name.chars().next().unwrap()))
            } else {
                Err(format!("Unknown key: {}", key_name))
            }
        }
    }
}
