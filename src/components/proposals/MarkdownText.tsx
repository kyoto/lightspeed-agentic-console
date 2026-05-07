import * as React from 'react';
import { renderMarkdown } from '../../utils/markdown';

export const MarkdownText: React.FC<{ content: string }> = ({ content }) => {
  const html = React.useMemo(() => renderMarkdown(content), [content]);
  return <div className="ols-plugin__chat-text" dangerouslySetInnerHTML={{ __html: html }} />;
};
