import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import './Preview.css';

interface Props {
  content: string;
}

function extractBody(content: string): string {
  const match = content.match(/^---\n[\s\S]*?\n---\n*/);
  if (match) {
    return content.slice(match[0].length);
  }
  return content;
}

function Preview({ content }: Props) {
  const body = extractBody(content);

  if (!content.trim()) {
    return (
      <div className="preview">
        <div className="preview-empty">
          <p>Preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="preview">
      <div className="preview-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex, rehypeRaw]}
        >
          {body}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export default Preview;
