import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import ProjectSelector from './components/ProjectSelector';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Preview from './components/Preview';
import Toolbar from './components/Toolbar';
import LogPanel from './components/LogPanel';
import { FileEntry } from './types';

const CONFIG_KEY = 'recent-project';

function App() {
  const [projectDir, setProjectDir] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [devRunning, setDevRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(true);
  const [showLogs, setShowLogs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    invoke<string | null>('load_config', { key: CONFIG_KEY })
      .then((result) => {
        if (result) {
          try {
            const data = JSON.parse(result);
            if (data?.dir) setProjectDir(data.dir);
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const u1 = listen<string>('dev-status', (e) => setDevRunning(e.payload === 'running'));
    const u2 = listen<string>('dev-output', (e) => setLogs((p) => [...p.slice(-300), e.payload]));
    return () => { u1.then(f => f()); u2.then(f => f()); };
  }, []);

  const selectProject = useCallback(async () => {
    try {
      const selected = await open({ directory: true, multiple: false, title: '选择 Astro 项目' });
      if (selected && typeof selected === 'string') {
        const valid = await invoke<boolean>('validate_astro_project', { dir: selected });
        if (!valid) { setError('不是有效的 Astro 项目（未找到 astro.config.mjs）'); return; }
        setProjectDir(selected);
        setSelectedFile(null);
        setFileContent('');
        setOriginalContent('');
        setIsDirty(false);
        setError(null);
        invoke('save_config', { key: CONFIG_KEY, value: JSON.stringify({ dir: selected }) }).catch(() => {});
      }
    } catch (e) { setError(String(e)); }
  }, []);

  const selectFile = useCallback(async (path: string) => {
    if (isDirty && selectedFile) {
      if (!window.confirm('有未保存的修改，确定切换文件？')) return;
    }
    setLoading(true);
    try {
      const content = await invoke<string>('read_file', { path });
      setSelectedFile(path);
      setFileContent(content);
      setOriginalContent(content);
      setIsDirty(false);
      setError(null);
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
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
    } catch (e) { setError(String(e)); }
    finally { setSaving(false); }
  }, [selectedFile, fileContent, isDirty]);

  const handleNewFile = useCallback(async (collection: string, filename: string) => {
    if (!projectDir || !filename.trim()) return;
    const slug = filename.replace(/\.(mdx|md)$/, '').trim();
    const path = `${projectDir}/src/content/${collection}/${slug}.mdx`;
    const today = new Date().toISOString().split('T')[0];
    const content = `---\ntitle: ""\nchapter: 1\nslug: "${slug}"\npublishedAt: "${today}"\nupdatedAt: "${today}"\ncategory: ""\ntags: []\nabstract: ""\nkeywords: []\n---\n\n## \n`;
    try {
      await invoke('create_file', { path, content });
      setSelectedFile(path);
      setFileContent(content);
      setOriginalContent(content);
      setIsDirty(false);
      setError(null);
    } catch (e) { setError(String(e)); }
  }, [projectDir]);

  const handleImportMd = useCallback(async () => {
    try {
      const selected = await open({
        multiple: false,
        title: '选择 Markdown 文件',
        filters: [{ name: 'Markdown', extensions: ['md', 'mdx'] }],
      });
      if (!selected || typeof selected !== 'string') return;
      const name = selected.split('/').pop()?.replace(/\.(md|mdx)$/, '') || 'imported';
      const destDir = `${projectDir}/src/content/notes`;
      const result = await invoke<string>('import_markdown', { srcPath: selected, destDir, slug: name });
      const content = await invoke<string>('read_file', { path: result });
      setSelectedFile(result);
      setFileContent(content);
      setOriginalContent(content);
      setIsDirty(false);
      setError(null);
    } catch (e) { setError(String(e)); }
  }, [projectDir]);

  const handleStartDev = useCallback(async () => {
    try { setLogs([]); await invoke('start_dev_server', { projectDir }); }
    catch (e) { setError(String(e)); }
  }, [projectDir]);

  const handleStopDev = useCallback(async () => {
    try { await invoke('stop_dev_server'); }
    catch (e) { setError(String(e)); }
  }, []);

  const handleBuild = useCallback(async () => {
    try {
      setLogs((p) => [...p, '$ npm run build']);
      const output = await invoke<string>('build_project', { projectDir });
      setLogs((p) => [...p, ...output.split('\n')]);
    } catch (e) { setError(String(e)); }
  }, [projectDir]);

  const handleGitPush = useCallback(async () => {
    try {
      const msg = window.prompt('Commit message:', 'update') || 'update';
      setLogs((p) => [...p, '$ git add -A && git commit && git push']);
      await invoke('git_add_commit', { projectDir, message: msg });
      const output = await invoke<string>('git_push', { projectDir });
      setLogs((p) => [...p, ...output.split('\n'), 'Done.']);
    } catch (e) { setError(String(e)); }
  }, [projectDir]);

  const handleNewProject = useCallback(() => {
    setProjectDir(null);
    setSelectedFile(null);
    setFileContent('');
    setOriginalContent('');
    setIsDirty(false);
    setError(null);
    invoke('save_config', { key: CONFIG_KEY, value: '{}' }).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  if (!projectDir) {
    return <ProjectSelector onSelect={selectProject} error={error} />;
  }

  return (
    <div className="app">
      <Sidebar
        projectDir={projectDir}
        selectedFile={selectedFile}
        onSelectFile={selectFile}
        onNewFile={handleNewFile}
        onImportMd={handleImportMd}
        onNewProject={handleNewProject}
      />
      <div className="main">
        <Toolbar
          selectedFile={selectedFile}
          projectDir={projectDir}
          isDirty={isDirty}
          saving={saving}
          showPreview={showPreview}
          devRunning={devRunning}
          onTogglePreview={() => setShowPreview(!showPreview)}
          onSave={handleSave}
          onStartDev={handleStartDev}
          onStopDev={handleStopDev}
          onBuild={handleBuild}
          onPush={handleGitPush}
          onToggleLogs={() => setShowLogs(!showLogs)}
        />
        <div className={`editor-area ${showPreview ? 'split' : 'full'}`}>
          <Editor content={fileContent} onChange={handleContentChange} loading={loading} hasFile={!!selectedFile} />
          {showPreview && <Preview content={fileContent} />}
        </div>
        {showLogs && <LogPanel logs={logs} onClose={() => setShowLogs(false)} />}
      </div>
      {error && (
        <div className="error-toast">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
    </div>
  );
}

export default App;
