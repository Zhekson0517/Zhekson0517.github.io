use std::fs;
use std::io::{BufRead, BufReader};
use std::os::unix::process::CommandExt;
use std::path::{Path, PathBuf};
use std::process::{Command as StdCommand, Stdio};
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::thread;
use serde::{Deserialize, Serialize};
use tauri::Emitter;

static DEV_PID: AtomicU32 = AtomicU32::new(0);
static DEV_RUNNING: AtomicBool = AtomicBool::new(false);

#[derive(Serialize, Deserialize, Clone)]
pub struct FileEntry {
    name: String,
    path: String,
    is_dir: bool,
    has_children: bool,
}

const SKIP_DIRS: &[&str] = &["node_modules", "dist", "target", ".git", ".astro", ".DS_Store", ".cache"];

fn should_skip(name: &str) -> bool {
    SKIP_DIRS.iter().any(|s| *s == name) || name.starts_with('.')
}

#[tauri::command]
fn list_dir(dir: String) -> Result<Vec<FileEntry>, String> {
    let path = Path::new(&dir);
    if !path.is_dir() {
        return Err(format!("Not a directory: {}", dir));
    }
    let mut entries = Vec::new();
    let read_dir = fs::read_dir(path).map_err(|e| e.to_string())?;

    for entry in read_dir {
        let entry = entry.map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().to_string();
        if should_skip(&name) {
            continue;
        }
        let file_path = entry.path();
        let is_dir = file_path.is_dir();
        let has_children = if is_dir {
            fs::read_dir(&file_path)
                .map(|mut rd| rd.any(|e| {
                    e.map(|e| {
                        let n = e.file_name().to_string_lossy().to_string();
                        !should_skip(&n)
                    }).unwrap_or(false)
                }))
                .unwrap_or(false)
        } else {
            false
        };

        entries.push(FileEntry {
            name,
            path: file_path.to_string_lossy().to_string(),
            is_dir,
            has_children,
        });
    }

    entries.sort_by(|a, b| {
        b.is_dir.cmp(&a.is_dir).then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });

    Ok(entries)
}

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read {}: {}", path, e))
}

#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), String> {
    let backup_path = format!("{}.bak", path);
    if Path::new(&path).exists() {
        let _ = fs::copy(&path, &backup_path);
    }
    fs::write(&path, content).map_err(|e| format!("Failed to write {}: {}", path, e))
}

#[tauri::command]
fn create_file(path: String, content: String) -> Result<(), String> {
    if Path::new(&path).exists() {
        return Err(format!("File already exists: {}", path));
    }
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&path, content).map_err(|e| format!("Failed to create {}: {}", path, e))
}

#[tauri::command]
fn validate_astro_project(dir: String) -> Result<bool, String> {
    let path = Path::new(&dir);
    Ok(path.join("astro.config.mjs").exists() || path.join("astro.config.ts").exists())
}

#[tauri::command]
fn start_dev_server(app: tauri::AppHandle, project_dir: String) -> Result<(), String> {
    if DEV_RUNNING.load(Ordering::SeqCst) {
        return Err("Dev server is already running".into());
    }

    let mut child = StdCommand::new("npm")
        .args(["run", "dev"])
        .current_dir(&project_dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .process_group(0)
        .spawn()
        .map_err(|e| format!("Failed to start dev server: {}", e))?;

    let pid = child.id();
    DEV_PID.store(pid, Ordering::SeqCst);
    DEV_RUNNING.store(true, Ordering::SeqCst);
    let _ = app.emit("dev-status", "running");

    let stdout = child.stdout.take().unwrap();
    let app_out = app.clone();
    thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines().flatten() {
            let _ = app_out.emit("dev-output", line);
        }
    });

    let stderr = child.stderr.take().unwrap();
    let app_err = app.clone();
    thread::spawn(move || {
        let reader = BufReader::new(stderr);
        for line in reader.lines().flatten() {
            let _ = app_err.emit("dev-output", line);
        }
    });

    let app_exit = app.clone();
    thread::spawn(move || {
        let _ = child.wait();
        DEV_PID.store(0, Ordering::SeqCst);
        DEV_RUNNING.store(false, Ordering::SeqCst);
        let _ = app_exit.emit("dev-status", "stopped");
    });

    Ok(())
}

#[tauri::command]
fn stop_dev_server() -> Result<(), String> {
    let pid = DEV_PID.load(Ordering::SeqCst);
    if pid == 0 {
        return Err("No dev server running".into());
    }
    let _ = StdCommand::new("kill")
        .args(["-TERM", &pid.to_string()])
        .output();
    DEV_PID.store(0, Ordering::SeqCst);
    DEV_RUNNING.store(false, Ordering::SeqCst);
    Ok(())
}

#[tauri::command]
fn is_dev_server_running() -> Result<bool, String> {
    Ok(DEV_RUNNING.load(Ordering::SeqCst))
}

#[tauri::command]
fn build_project(project_dir: String) -> Result<String, String> {
    let output = StdCommand::new("npm")
        .args(["run", "build"])
        .current_dir(project_dir)
        .output()
        .map_err(|e| format!("Failed to run build: {}", e))?;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    if output.status.success() { Ok(stdout) } else { Err(format!("Build failed:\n{}", stderr)) }
}

#[tauri::command]
fn git_push(project_dir: String) -> Result<String, String> {
    let output = StdCommand::new("git")
        .args(["push"])
        .current_dir(project_dir)
        .output()
        .map_err(|e| format!("Failed to run git push: {}", e))?;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    if output.status.success() { Ok(stdout) } else { Err(format!("Git push failed:\n{}", stderr)) }
}

#[tauri::command]
fn git_add_commit(project_dir: String, message: String) -> Result<String, String> {
    let add_output = StdCommand::new("git")
        .args(["add", "-A"])
        .current_dir(&project_dir)
        .output()
        .map_err(|e| format!("Failed to git add: {}", e))?;
    if !add_output.status.success() {
        return Err("git add failed".into());
    }
    let commit_output = StdCommand::new("git")
        .args(["commit", "-m", &message])
        .current_dir(project_dir)
        .output()
        .map_err(|e| format!("Failed to git commit: {}", e))?;
    let stdout = String::from_utf8_lossy(&commit_output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&commit_output.stderr).to_string();
    if commit_output.status.success() { Ok(stdout) } else { Err(format!("Git commit failed:\n{}", stderr)) }
}

#[tauri::command]
fn import_markdown(src_path: String, dest_dir: String, slug: String) -> Result<String, String> {
    let content = fs::read_to_string(&src_path)
        .map_err(|e| format!("Failed to read source: {}", e))?;

    let images_dir = Path::new(&src_path).parent()
        .map(|p| p.join("images"))
        .or_else(|| Path::new(&src_path).parent().map(|p| p.to_path_buf()));

    let today = chrono::Local::now().format("%Y-%m-%d").to_string();

    let frontmatter = format!(
        "---\ntitle: \"\"\nchapter: 1\nslug: \"{}\"\npublishedAt: \"{}\"\nupdatedAt: \"{}\"\ncategory: \"\"\ntags: []\nabstract: \"\"\nkeywords: []\n---\n\n",
        slug, today, today
    );

    let dest_path = Path::new(&dest_dir).join(format!("{}.mdx", slug));
    if dest_path.exists() {
        return Err(format!("File already exists: {}", dest_path.display()));
    }

    let final_content = frontmatter + &content;

    fs::create_dir_all(&dest_dir).map_err(|e| e.to_string())?;
    fs::write(&dest_path, &final_content).map_err(|e| format!("Failed to write: {}", e))?;

    if let Some(img_dir) = images_dir {
        if img_dir.exists() {
            let dest_img_dir = Path::new(&dest_dir)
                .parent()
                .map(|p| p.join("public").join("images").join(&slug))
                .unwrap_or_else(|| PathBuf::from("/tmp"));
            let _ = fs::create_dir_all(&dest_img_dir);
            if let Ok(entries) = fs::read_dir(&img_dir) {
                for entry in entries.flatten() {
                    let src = entry.path();
                    if src.is_file() {
                        let file_name = src.file_name().unwrap_or_default().to_string_lossy();
                        let dest = dest_img_dir.join(file_name.as_ref());
                        let _ = fs::copy(&src, &dest);
                    }
                }
            }
        }
    }

    Ok(dest_path.to_string_lossy().to_string())
}

#[tauri::command]
fn save_config(key: String, value: String) -> Result<(), String> {
    let config_dir = dirs::config_dir().unwrap_or_else(|| PathBuf::from("/tmp"));
    let app_dir = config_dir.join("astro-blog-manager");
    fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
    let config_file = app_dir.join(format!("{}.json", key));
    fs::write(config_file, value).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_config(key: String) -> Result<Option<String>, String> {
    let config_dir = dirs::config_dir().unwrap_or_else(|| PathBuf::from("/tmp"));
    let app_dir = config_dir.join("astro-blog-manager");
    let config_file = app_dir.join(format!("{}.json", key));
    if config_file.exists() {
        Ok(Some(fs::read_to_string(config_file).map_err(|e| e.to_string())?))
    } else {
        Ok(None)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            list_dir,
            read_file,
            write_file,
            create_file,
            validate_astro_project,
            start_dev_server,
            stop_dev_server,
            is_dev_server_running,
            build_project,
            git_push,
            git_add_commit,
            import_markdown,
            save_config,
            load_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
