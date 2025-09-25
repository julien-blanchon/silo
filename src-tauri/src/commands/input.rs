use enigo::{Button, Coordinate, Direction, Enigo, Key, Keyboard, Mouse, Settings};
use xcap::Monitor;

#[tauri::command]
#[specta::specta]
pub fn move_mouse(monitor_id: String, x: i32, y: i32) -> Result<(), String> {
    println!("-- Move mouse: {:?}, {:?}", x, y);

    let monitor = get_monitor_by_id(monitor_id)?;

    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;

    enigo
        .move_mouse(monitor.x() + x, monitor.y() + y, Coordinate::Abs)
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub fn mouse_click(
    monitor_id: String,
    side: String,
    x: Option<i32>,
    y: Option<i32>,
) -> Result<(), String> {
    println!("-- Mouse click: {:?}, {:?}", side, (x, y));

    let monitor = get_monitor_by_id(monitor_id)?;

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

    Ok(())
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
pub fn type_text(text: String) -> Result<(), String> {
    println!("-- Type text: {:?}", text);

    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;

    enigo.text(&text).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn scroll(monitor_id: String, direction: String, amount: i32) -> Result<(), String> {
    println!("-- Scroll: {:?}, amount: {:?}", direction, amount);

    let _monitor = get_monitor_by_id(monitor_id)?;
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

    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn press_key(key: String) -> Result<(), String> {
    println!("-- Press key: {:?}", key);

    // key examples: "a", "Return", "alt+Tab", "ctrl+s", "Up", "KP_0" (for the numpad 0 key).

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
        key_name = key;
    }

    if let Some(special_key) = &special_key {
        let key = get_key_from_name(special_key.clone())?;

        enigo
            .key(key, Direction::Press)
            .map_err(|e| e.to_string())?;
    }

    let key = get_key_from_name(key_name)?;

    enigo
        .key(key, Direction::Click)
        .map_err(|e| e.to_string())?;

    if let Some(special_key) = special_key {
        let key = get_key_from_name(special_key)?;

        enigo
            .key(key, Direction::Release)
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

fn get_monitor_by_id(monitor_id: String) -> Result<Monitor, String> {
    let monitors = Monitor::all().map_err(|e| e.to_string())?;
    let monitor = monitors.iter().find(|m| m.id().to_string() == monitor_id);

    if monitor.is_none() {
        return Err("Monitor not found".to_string());
    }

    Ok(monitor.unwrap().clone())
}

// This need a mapping from the key name to the enigo key
// https://docs.rs/enigo/latest/src/enigo/keycodes.rs.html
fn get_key_from_name(key_name: String) -> Result<Key, String> {
    match key_name.as_str() {
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
        "a" | "A" => Ok(Key::A),
        #[cfg(target_os = "windows")]
        "b" | "B" => Ok(Key::B),
        #[cfg(target_os = "windows")]
        "c" | "C" => Ok(Key::C),
        #[cfg(target_os = "windows")]
        "d" | "D" => Ok(Key::D),
        #[cfg(target_os = "windows")]
        "e" | "E" => Ok(Key::E),
        #[cfg(target_os = "windows")]
        "f" | "F" => Ok(Key::F),
        #[cfg(target_os = "windows")]
        "g" | "G" => Ok(Key::G),
        #[cfg(target_os = "windows")]
        "h" | "H" => Ok(Key::H),
        #[cfg(target_os = "windows")]
        "i" | "I" => Ok(Key::I),
        #[cfg(target_os = "windows")]
        "j" | "J" => Ok(Key::J),
        #[cfg(target_os = "windows")]
        "k" | "K" => Ok(Key::K),
        #[cfg(target_os = "windows")]
        "l" | "L" => Ok(Key::L),
        #[cfg(target_os = "windows")]
        "m" | "M" => Ok(Key::M),
        #[cfg(target_os = "windows")]
        "n" | "N" => Ok(Key::N),
        #[cfg(target_os = "windows")]
        "o" | "O" => Ok(Key::O),
        #[cfg(target_os = "windows")]
        "p" | "P" => Ok(Key::P),
        #[cfg(target_os = "windows")]
        "q" | "Q" => Ok(Key::Q),
        #[cfg(target_os = "windows")]
        "r" | "R" => Ok(Key::R),
        #[cfg(target_os = "windows")]
        "s" | "S" => Ok(Key::S),
        #[cfg(target_os = "windows")]
        "t" | "T" => Ok(Key::T),
        #[cfg(target_os = "windows")]
        "u" | "U" => Ok(Key::U),
        #[cfg(target_os = "windows")]
        "v" | "V" => Ok(Key::V),
        #[cfg(target_os = "windows")]
        "w" | "W" => Ok(Key::W),
        #[cfg(target_os = "windows")]
        "x" | "X" => Ok(Key::X),
        #[cfg(target_os = "windows")]
        "y" | "Y" => Ok(Key::Y),
        #[cfg(target_os = "windows")]
        "z" | "Z" => Ok(Key::Z),
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
        "meta" | "command" | "windows" | "super" => Ok(Key::Meta),
        "option" => Ok(Key::Option),
        "pagedown" => Ok(Key::PageDown),
        "pageup" => Ok(Key::PageUp),
        "return" | "enter" => Ok(Key::Return),
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
