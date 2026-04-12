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
    children: Vec<FileEntry>,
}

#[tauri::command]
fn scan_directory(dir: String) -> Result<Vec<FileEntry>, String> {
    let path = Path::new(&dir);
    if !path.is_dir() {
        return Err(format!("Not a directory: {}", dir));
    }
    scan_dir(path)
}

fn scan_dir(dir: &Path) -> Result<Vec<FileEntry>, String> {
    let mut entries = Vec::new();
    let read_dir = fs::read_dir(dir).map_err(|e| e.to_string())?;

    for entry in read_dir {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();

        if name.starts_with('.')
            || name == "node_modules"
            || name == "dist"
            || name == "target"
            || name == ".git"
        {
            continue;
        }

        let is_dir = path.is_dir();
        let children = if is_dir {
            scan_dir(&path)?
        } else {
            Vec::new()
        };

        entries.push(FileEntry {
            name,
            path: path.to_string_lossy().to_string(),
            is_dir,
            children,
        });
    }

    entries.sort_by(|a, b| b.is_dir.cmp(&a.is_dir).then(a.name.cmp(&b.name)));

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
        fs::copy(&path, &backup_path)
            .map_err(|e| format!("Failed to create backup: {}", e))?;
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
    let config_mjs = path.join("astro.config.mjs");
    let config_ts = path.join("astro.config.ts");
    Ok(config_mjs.exists() || config_ts.exists())
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
        for line in reader.lines() {
            if let Ok(line) = line {
                let _ = app_out.emit("dev-output", line);
            }
        }
    });

    let stderr = child.stderr.take().unwrap();
    let app_err = app.clone();
    thread::spawn(move || {
        let reader = BufReader::new(stderr);
        for line in reader.lines() {
            if let Ok(line) = line {
                let _ = app_err.emit("dev-output", line);
            }
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

    let output = StdCommand::new("kill")
        .args(["-TERM", &pid.to_string()])
        .output()
        .map_err(|e| format!("Failed to kill process: {}", e))?;

    DEV_PID.store(0, Ordering::SeqCst);
    DEV_RUNNING.store(false, Ordering::SeqCst);

    if !output.status.success() {
        return Err("Failed to stop dev server".into());
    }
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

    if output.status.success() {
        Ok(stdout)
    } else {
        Err(format!("Build failed:\n{}", stderr))
    }
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

    if output.status.success() {
        Ok(stdout)
    } else {
        Err(format!("Git push failed:\n{}", stderr))
    }
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

    if commit_output.status.success() {
        Ok(stdout)
    } else {
        Err(format!("Git commit failed:\n{}", stderr))
    }
}

#[tauri::command]
fn save_config(key: String, value: String) -> Result<(), String> {
    let config_dir = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("/tmp"));
    let app_dir = config_dir.join("astro-blog-manager");
    fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
    let config_file = app_dir.join(format!("{}.json", key));
    fs::write(config_file, value).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_config(key: String) -> Result<Option<String>, String> {
    let config_dir = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("/tmp"));
    let app_dir = config_dir.join("astro-blog-manager");
    let config_file = app_dir.join(format!("{}.json", key));
    if config_file.exists() {
        let content = fs::read_to_string(config_file).map_err(|e| e.to_string())?;
        Ok(Some(content))
    } else {
        Ok(None)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            scan_directory,
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
            save_config,
            load_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
