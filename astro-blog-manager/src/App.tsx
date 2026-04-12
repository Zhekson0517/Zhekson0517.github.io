import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import ProjectSelector from './components/ProjectSelector';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Preview from './components/Preview';
import StatusBar from './components/StatusBar';
import { FileEntry } from './types';

const RECENT_KEY = 'recent-project';

function App() {
  const [projectDir, setProjectDir] = useState<string | null>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [devServerRunning, setDevServerRunning] = useState(false);
  const [devServerLogs, setDevServerLogs] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    invoke<string | null>('load_config', { key: RECENT_KEY })
      .then((result) => {
        if (result) {
          try {
            const recent = JSON.parse(result);
            if (recent && recent.dir) {
              setProjectDir(recent.dir);
            }
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!projectDir) return;

    invoke<FileEntry[]>('scan_directory', { dir: projectDir })
      .then((entries) => {
        setFiles(entries);
        setError(null);
      })
      .catch((e) => setError(String(e)));
  }, [projectDir]);

  useEffect(() => {
    const unlistenStatus = listen<string>('dev-status', (event) => {
      setDevServerRunning(event.payload === 'running');
    });

    const unlistenOutput = listen<string>('dev-output', (event) => {
      setDevServerLogs((prev) => [...prev.slice(-200), event.payload]);
    });

    return () => {
      unlistenStatus.then((fn) => fn());
      unlistenOutput.then((fn) => fn());
    };
  }, []);

  const handleProjectSelected = useCallback(async (dir: string) => {
    try {
      const valid = await invoke<boolean>('validate_astro_project', { dir });
      if (!valid) {
        setError('Not a valid Astro project (no astro.config.mjs found)');
        return;
      }
      setProjectDir(dir);
      setSelectedFile(null);
      setFileContent('');
      setOriginalContent('');
      setIsDirty(false);
      setError(null);
      invoke('save_config', { key: RECENT_KEY, value: JSON.stringify({ dir }) }).catch(() => {});
    } catch (e) {
      setError(String(e));
    }
  }, []);

  const handleSelectDirectory = useCallback(async () => {
    try {
      const selected = await open({ directory: true, multiple: false, title: 'Select Astro Project' });
      if (selected && typeof selected === 'string') {
        await handleProjectSelected(selected);
      }
    } catch (e) {
      setError(String(e));
    }
  }, [handleProjectSelected]);

  const handleSelectFile = useCallback(async (path: string) => {
    if (isDirty && selectedFile) {
      const confirmed = window.confirm('Unsaved changes will be lost. Continue?');
      if (!confirmed) return;
    }
    try {
      const content = await invoke<string>('read_file', { path });
      setSelectedFile(path);
      setFileContent(content);
      setOriginalContent(content);
      setIsDirty(false);
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  }, [isDirty, selectedFile]);

  const handleContentChange = useCallback((content: string) => {
    setFileContent(content);
    setIsDirty(content !== originalContent);
  }, [originalContent]);

  const handleSave = useCallback(async () => {
    if (!selectedFile || !isDirty) return;
    setSaving(true);
    try {
      await invoke('write_file', { path: selectedFile, content: fileContent });
      setOriginalContent(fileContent);
      setIsDirty(false);
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }, [selectedFile, fileContent, isDirty]);

  const handleCreateFile = useCallback(async (path: string, content: string) => {
    try {
      await invoke('create_file', { path, content });
      const entries = await invoke<FileEntry[]>('scan_directory', { dir: projectDir! });
      setFiles(entries);
      setSelectedFile(path);
      setFileContent(content);
      setOriginalContent(content);
      setIsDirty(false);
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  }, [projectDir]);

  const handleStartDev = useCallback(async () => {
    try {
      setDevServerLogs([]);
      await invoke('start_dev_server', { projectDir });
    } catch (e) {
      setError(String(e));
    }
  }, [projectDir]);

  const handleStopDev = useCallback(async () => {
    try {
      await invoke('stop_dev_server');
    } catch (e) {
      setError(String(e));
    }
  }, []);

  const handleBuild = useCallback(async () => {
    try {
      const output = await invoke<string>('build_project', { projectDir });
      setDevServerLogs((prev) => [...prev, '--- BUILD OUTPUT ---', ...output.split('\n')]);
    } catch (e) {
      setError(String(e));
    }
  }, [projectDir]);

  const handleGitPush = useCallback(async () => {
    try {
      await invoke('git_add_commit', { projectDir, message: 'update via astro-blog-manager' });
      const output = await invoke<string>('git_push', { projectDir });
      setDevServerLogs((prev) => [...prev, '--- GIT PUSH ---', ...output.split('\n')]);
    } catch (e) {
      setError(String(e));
    }
  }, [projectDir]);

  const handleNewProject = useCallback(() => {
    setProjectDir(null);
    setSelectedFile(null);
    setFileContent('');
    setOriginalContent('');
    setIsDirty(false);
    setFiles([]);
    setError(null);
    invoke('save_config', { key: RECENT_KEY, value: '{}' }).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  if (!projectDir) {
    return <ProjectSelector onSelect={handleSelectDirectory} error={error} />;
  }

  return (
    <div className="app">
      <Sidebar
        files={files}
        selectedFile={selectedFile}
        onSelectFile={handleSelectFile}
        projectDir={projectDir}
        onCreateFile={handleCreateFile}
        onNewProject={handleNewProject}
      />
      <main className="main">
        <div className="toolbar">
          <div className="toolbar-left">
            {selectedFile && (
              <span className="file-path">{selectedFile.replace(projectDir, '~')}</span>
            )}
            {isDirty && <span className="dirty-dot" />}
          </div>
          <div className="toolbar-right">
            <button
              className="toolbar-btn"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            <button
              className="toolbar-btn save-btn"
              onClick={handleSave}
              disabled={!isDirty || saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
        <div className={`editor-preview ${showPreview ? 'with-preview' : ''}`}>
          <Editor
            content={fileContent}
            onChange={handleContentChange}
            hasFile={!!selectedFile}
          />
          {showPreview && <Preview content={fileContent} />}
        </div>
      </main>
      <StatusBar
        devServerRunning={devServerRunning}
        logs={devServerLogs}
        onStartDev={handleStartDev}
        onStopDev={handleStopDev}
        onBuild={handleBuild}
        onGitPush={handleGitPush}
        error={error}
        onClearError={() => setError(null)}
      />
    </div>
  );
}

export default App;
