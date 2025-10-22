// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use specta::Type;
#[allow(unused_imports)]
use specta_typescript::Typescript;
use tauri_specta::{collect_commands, Builder};

pub mod commands;

#[derive(serde::Serialize, Type)]
struct Greeting {
    message: String,
}

#[tauri::command]
#[specta::specta]
fn greet(name: String) -> Greeting {
    Greeting {
        message: format!("Hello, {}! You've been greeted from Rust!", name),
    }
}

fn create_builder() -> Builder<tauri::Wry> {
    Builder::<tauri::Wry>::new().commands(collect_commands![
        greet,
        commands::get_monitors,
        commands::take_screenshot,
        commands::move_mouse,
        commands::mouse_click,
        commands::get_cursor_position,
        commands::type_text,
        commands::scroll,
        commands::press_key,
        commands::wait,
    ])
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = create_builder();

    #[cfg(debug_assertions)] // <- Only export on non-release builds
    builder
        .export(Typescript::default(), "../src/lib/bindings.ts")
        .expect("Failed to export typescript bindings");

    tauri::Builder::default()
        .plugin(tauri_plugin_svelte::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(builder.invoke_handler())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Function to generate bindings without running the app
#[cfg(debug_assertions)]
pub fn generate_bindings() {
    let builder = create_builder();
    builder
        .export(Typescript::default(), "../src/lib/bindings.ts")
        .expect("Failed to export typescript bindings");
    println!("TypeScript bindings generated successfully!");
}
