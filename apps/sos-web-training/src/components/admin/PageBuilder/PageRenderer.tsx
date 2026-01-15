'use client';

import { useState, useEffect } from 'react';
import { Widget } from '@/components/admin/PageBuilder/types';
import { WidgetRenderer } from '@/components/admin/PageBuilder/WidgetRenderer';
import { htmlToWidgets } from '@/components/admin/PageBuilder/htmlConverter';

interface PageRendererProps {
  content: string;
  className?: string;
}

export function PageRenderer({ content, className = '' }: PageRendererProps) {
  const [widgets, setWidgets] = useState<Widget[] | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (content && content.trim()) {
      try {
        const parsed = htmlToWidgets(content);
        setWidgets(parsed && Array.isArray(parsed) ? parsed : []);
      } catch (err) {
        setWidgets([]);
      }
    } else {
      setWidgets([]);
    }
  }, [content]);

  if (!content || !content.trim()) {
    return null;
  }

  if (!isClient) {
    return (
      <article
        className={`prose prose-lg max-w-none text-text ${className}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Render widgets if successfully parsed and at least one widget exists
  if (Array.isArray(widgets) && widgets.length > 0) {
    return (
      <div className={className}>
        {widgets.map((widget) => (
          <div key={widget.id} className="mb-4">
            <WidgetRenderer widget={widget} isEditing={false} />
          </div>
        ))}
      </div>
    );
  }

  // Fallback: render as regular HTML if parsing failed or no widgets found
  return (
    <article
      className={`prose prose-lg max-w-none text-text ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
