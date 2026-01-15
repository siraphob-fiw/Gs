'use client';

import { Widget, ColumnsWidget } from './types';

const base64Encode = (str: string): string => {
  if (typeof window !== 'undefined') {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => 
      String.fromCharCode(parseInt(p1, 16))
    ));
  }
  return Buffer.from(str, 'utf-8').toString('base64');
};

const base64Decode = (str: string): string => {
  try {
    if (typeof window !== 'undefined') {
      return decodeURIComponent(
        Array.prototype.map.call(atob(str), (c: string) => 
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join('')
      );
    }
    return Buffer.from(str, 'base64').toString('utf-8');
  } catch {
    return '';
  }
};

const escapeHtml = (str: string): string => {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
};

// Convert alignment to CSS text-align or flexbox justify
const alignmentToTextAlign = (alignment: string): string => {
  return alignment || 'left';
};

const alignmentToFlex = (alignment: string): string => {
  const map: Record<string, string> = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
  };
  return map[alignment] || 'flex-start';
};

/**
 * Convert a single widget to HTML string
 */
const widgetToHtml = (widget: Widget): string => {
  // Encode widget data as base64 JSON for round-trip
  const widgetData = JSON.stringify({
    id: widget.id,
    type: widget.type,
    settings: widget.settings,
    ...(widget.type === 'columns' ? { children: (widget as ColumnsWidget).children } : {}),
  });
  const encodedData = base64Encode(widgetData);

  switch (widget.type) {
    case 'heading': {
      const { text, tag, alignment, color, fontSize, fontWeight } = widget.settings;
      const style = [
        alignment ? `text-align: ${alignmentToTextAlign(alignment)}` : '',
        color ? `color: ${color}` : '',
        fontSize ? `font-size: ${fontSize}` : '',
        fontWeight ? `font-weight: ${fontWeight}` : '',
      ].filter(Boolean).join('; ');
      
      return `<${tag} data-widget="${encodedData}" class="pb-widget pb-heading" style="${style}">${escapeHtml(text || 'Heading')}</${tag}>`;
    }

    case 'text': {
      const { content, alignment, color, fontSize } = widget.settings;
      const style = [
        alignment ? `text-align: ${alignmentToTextAlign(alignment)}` : '',
        color ? `color: ${color}` : '',
        fontSize ? `font-size: ${fontSize}` : '',
      ].filter(Boolean).join('; ');
      
      // Content may already contain HTML, so don't escape it
      return `<div data-widget="${encodedData}" class="pb-widget pb-text" style="${style}">${content || 'Add your text here...'}</div>`;
    }

    case 'image': {
      const { src, alt, width, height, alignment, borderRadius, objectFit, link } = widget.settings;
      const alignClass = alignment === 'center' ? 'margin: 0 auto' : alignment === 'right' ? 'margin-left: auto' : 'margin-right: auto';
      const style = [
        width ? `width: ${width}` : 'width: 100%',
        height ? `height: ${height}` : 'height: auto',
        borderRadius ? `border-radius: ${borderRadius}` : '',
        objectFit ? `object-fit: ${objectFit}` : '',
        alignClass,
        'display: block',
      ].filter(Boolean).join('; ');
      
      const imgHtml = src
        ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt || '')}" style="${style}" />`
        : `<div style="${style}; background-color: #e5e7eb; display: flex; align-items: center; justify-content: center; min-height: 200px;"><span>No image selected</span></div>`;
      
      if (link) {
        return `<div data-widget="${encodedData}" class="pb-widget pb-image"><a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${imgHtml}</a></div>`;
      }
      return `<div data-widget="${encodedData}" class="pb-widget pb-image">${imgHtml}</div>`;
    }

    case 'button': {
      const { text, link, target, variant, color, size, alignment, fullWidth, borderRadius } = widget.settings;
      const alignStyle = `display: flex; justify-content: ${alignmentToFlex(alignment)}`;
      const buttonStyle = [
        borderRadius ? `border-radius: ${borderRadius}` : '',
        fullWidth ? 'width: 100%' : '',
      ].filter(Boolean).join('; ');

      return `<div data-widget="${encodedData}" class="pb-widget pb-button" style="${alignStyle}">
        <a href="${escapeHtml(link || '#')}" target="${target || '_self'}" rel="${target === '_blank' ? 'noopener noreferrer' : ''}" 
          class="inline-block px-6 py-2 rounded ${variant ? `btn-${variant}` : ''} ${color ? `btn-${color}` : ''} ${size ? `btn-${size}` : ''}" 
          style="${buttonStyle}">
          ${escapeHtml(text || 'Button')}
        </a>
      </div>`;
    }

    case 'spacer': {
      const { height } = widget.settings;
      return `<div data-widget="${encodedData}" class="pb-widget pb-spacer" style="height: ${height || '40px'}"></div>`;
    }

    case 'divider': {
      const { style, color, width, thickness, alignment } = widget.settings;
      const alignStyle = alignment === 'center' ? 'margin: 0 auto' : alignment === 'right' ? 'margin-left: auto' : 'margin-right: auto';
      const hrStyle = [
        `border-style: ${style || 'solid'}`,
        `border-color: ${color || '#e5e7eb'}`,
        `width: ${width || '100%'}`,
        `border-width: ${thickness || '1px'}`,
        'border-top: none',
        'border-left: none',
        'border-right: none',
        alignStyle,
      ].join('; ');
      
      return `<hr data-widget="${encodedData}" class="pb-widget pb-divider" style="${hrStyle}" />`;
    }

    case 'columns': {
      const columnsWidget = widget as ColumnsWidget;
      const { columns, gap, verticalAlign } = columnsWidget.settings;
      const children = columnsWidget.children || [];
      
      const alignItems = verticalAlign === 'middle' ? 'center' : verticalAlign === 'bottom' ? 'flex-end' : 'flex-start';
      const columnId = `pb-cols-${widget.id}`;
      
      const columnsHtml = Array.from({ length: columns }).map((_, colIdx) => {
        const columnWidgets = children[colIdx] || [];
        const columnContent = columnWidgets.map(w => widgetToHtml(w)).join('\n');
        return `<div class="pb-column" data-column-index="${colIdx}">${columnContent || ''}</div>`;
      }).join('\n');
      
      // Responsive CSS: stack columns on mobile (< 768px)
      const responsiveStyle = `
        <style>
          #${columnId} {
            display: grid;
            grid-template-columns: repeat(${columns}, 1fr);
            gap: ${gap || '16px'};
            align-items: ${alignItems};
          }
          @media (max-width: 768px) {
            #${columnId} {
              grid-template-columns: 1fr;
            }
          }
        </style>
      `;
      
      return `${responsiveStyle}<div id="${columnId}" data-widget="${encodedData}" class="pb-widget pb-columns">
        ${columnsHtml}
      </div>`;
    }

    case 'video': {
      const { src, type, autoplay, loop, muted, controls, width, aspectRatio } = widget.settings;
      const aspectStyle = `aspect-ratio: ${(aspectRatio || '16:9').replace(':', '/')}`;
      const containerStyle = `width: ${width || '100%'}; ${aspectStyle}`;
      
      if (!src) {
        return `<div data-widget="${encodedData}" class="pb-widget pb-video" style="${containerStyle}; background-color: #e5e7eb; display: flex; align-items: center; justify-content: center;"><span>No video URL provided</span></div>`;
      }
      
      if (type === 'youtube') {
        const match = src.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        const videoId = match ? match[1] : null;
        if (!videoId) {
          return `<div data-widget="${encodedData}" class="pb-widget pb-video pb-error">Invalid YouTube URL</div>`;
        }
        const embedParams = `autoplay=${autoplay ? 1 : 0}&loop=${loop ? 1 : 0}&mute=${muted ? 1 : 0}&controls=${controls ? 1 : 0}`;
        return `<div data-widget="${encodedData}" class="pb-widget pb-video" style="${containerStyle}">
          <iframe src="https://www.youtube.com/embed/${videoId}?${embedParams}" style="width: 100%; height: 100%; border-radius: 8px;" allowfullscreen></iframe>
        </div>`;
      }
      
      if (type === 'vimeo') {
        const match = src.match(/vimeo\.com\/(?:video\/)?(\d+)/);
        const videoId = match ? match[1] : null;
        if (!videoId) {
          return `<div data-widget="${encodedData}" class="pb-widget pb-video pb-error">Invalid Vimeo URL</div>`;
        }
        const embedParams = `autoplay=${autoplay ? 1 : 0}&loop=${loop ? 1 : 0}&muted=${muted ? 1 : 0}`;
        return `<div data-widget="${encodedData}" class="pb-widget pb-video" style="${containerStyle}">
          <iframe src="https://player.vimeo.com/video/${videoId}?${embedParams}" style="width: 100%; height: 100%; border-radius: 8px;" allowfullscreen></iframe>
        </div>`;
      }
      
      // Self-hosted
      return `<div data-widget="${encodedData}" class="pb-widget pb-video" style="${containerStyle}">
        <video src="${escapeHtml(src)}" ${autoplay ? 'autoplay' : ''} ${loop ? 'loop' : ''} ${muted ? 'muted' : ''} ${controls ? 'controls' : ''} style="width: 100%; height: 100%; border-radius: 8px;"></video>
      </div>`;
    }

    case 'icon': {
      const { icon, size, color, alignment } = widget.settings;
      const alignStyle = `display: flex; justify-content: ${alignmentToFlex(alignment)}`;
      // For icons, we store the icon name and render it server-side or use SVG inline
      return `<div data-widget="${encodedData}" class="pb-widget pb-icon" style="${alignStyle}">
        <span class="pb-icon-placeholder" data-icon="${escapeHtml(icon || 'FiStar')}" style="font-size: ${size || '40px'}; color: ${color || 'currentColor'};">★</span>
      </div>`;
    }

    case 'list': {
      const { items, type, textColor, fontSize, spacing } = widget.settings;
      const listItems = items || [];
      const listStyle = [
        textColor ? `color: ${textColor}` : '',
        fontSize ? `font-size: ${fontSize}` : '',
      ].filter(Boolean).join('; ');
      
      const itemStyle = spacing ? `margin-bottom: ${spacing}` : 'margin-bottom: 8px';
      
      if (type === 'number') {
        const itemsHtml = listItems.map((item: string) => 
          `<li style="${itemStyle}">${escapeHtml(item)}</li>`
        ).join('\n');
        return `<ol data-widget="${encodedData}" class="pb-widget pb-list pb-list-number" style="${listStyle}; list-style-type: decimal; list-style-position: inside;">${itemsHtml}</ol>`;
      }
      
      if (type === 'none') {
        const itemsHtml = listItems.map((item: string) => 
          `<li style="${itemStyle}">${escapeHtml(item)}</li>`
        ).join('\n');
        return `<ul data-widget="${encodedData}" class="pb-widget pb-list pb-list-none" style="${listStyle}; list-style-type: none; padding: 0;">${itemsHtml}</ul>`;
      }
      
      // Bullet list
      const itemsHtml = listItems.map((item: string) => 
        `<li style="${itemStyle}">${escapeHtml(item)}</li>`
      ).join('\n');
      return `<ul data-widget="${encodedData}" class="pb-widget pb-list pb-list-bullet" style="${listStyle}; list-style-type: disc; list-style-position: inside;">${itemsHtml}</ul>`;
    }

    case 'html': {
      const { code } = widget.settings;
      return `<div data-widget="${encodedData}" class="pb-widget pb-html">${code || ''}</div>`;
    }

    case 'card': {
      const {
        title, description, imageSrc, imageAlt, imageHeight, imageObjectFit,
        buttonText, buttonLink, buttonColor, variant, alignment, padding, 
        borderRadius, backgroundColor, showImage, showButton
      } = widget.settings;
      
      const alignClass = alignment || 'left';
      const variantStyle = variant === 'elevated' 
        ? 'box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); background: white;' 
        : variant === 'flat' 
        ? 'background: #f5f5f5;' 
        : 'border: 2px solid #e5e7eb; background: white;';
      
      const cardStyle = [
        variantStyle,
        `padding: ${padding || '16px'}`,
        `border-radius: ${borderRadius || '12px'}`,
        backgroundColor ? `background-color: ${backgroundColor}` : '',
        `text-align: ${alignClass}`,
        'overflow: hidden',
      ].filter(Boolean).join('; ');
      
      const imgHeight = imageHeight || '192px';
      const imgObjectFit = imageObjectFit || 'cover';
      
      let imageHtml = '';
      if (showImage) {
        if (imageSrc) {
          imageHtml = `<div style="margin: -${padding || '16px'}; margin-bottom: 16px;"><img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(imageAlt || title || '')}" style="width: 100%; height: ${imgHeight}; object-fit: ${imgObjectFit};" /></div>`;
        } else {
          imageHtml = `<div style="margin: -${padding || '16px'}; margin-bottom: 16px; height: ${imgHeight}; background: #e5e7eb; display: flex; align-items: center; justify-content: center;"><span style="color: #9ca3af; font-size: 14px;">Card Image</span></div>`;
        }
      }
      
      const buttonHtml = showButton 
        ? `<a href="${escapeHtml(buttonLink || '#')}" class="pb-btn pb-btn-solid pb-btn-${buttonColor || 'primary'} pb-btn-sm">${escapeHtml(buttonText || 'Learn More')}</a>`
        : '';
      
      return `<div data-widget="${encodedData}" class="pb-widget pb-card" style="${cardStyle}">
        ${imageHtml}
        <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 8px;">${escapeHtml(title || 'Card Title')}</h3>
        <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 16px;">${escapeHtml(description || 'Card description goes here.')}</p>
        ${buttonHtml}
      </div>`;
    }

    default:
      return `<div data-widget="${encodedData}" class="pb-widget pb-unknown">Unknown widget type</div>`;
  }
};

/**
 * Convert widgets array to HTML string for database storage
 */
export const widgetsToHtml = (widgets: Widget[]): string => {
  if (!widgets || widgets.length === 0) {
    return '';
  }
  
  const htmlParts = widgets.map((widget) => {
    return `<div class="pb-widget-wrapper" data-widget-type="${widget.type}">${widgetToHtml(widget)}</div>`;
  });
  
  return `<div class="pb-content">${htmlParts.join('\n')}</div>`;
};

/**
 * Parse HTML string and extract widgets array
 */
export const htmlToWidgets = (html: string): Widget[] => {
  if (!html || !html.trim()) {
    return [];
  }
  
  try {
    const parsed = JSON.parse(html);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
  }
  
  if (typeof window === 'undefined') {
    return parseHtmlWithRegex(html);
  }
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const widgets: Widget[] = [];
  
  const widgetElements = doc.querySelectorAll('[data-widget]');
  
  widgetElements.forEach((element) => {
    const encodedData = element.getAttribute('data-widget');
    if (encodedData) {
      try {
        const widgetData = JSON.parse(base64Decode(encodedData));
        widgets.push(widgetData as Widget);
      } catch (e) {
        console.error('Failed to parse widget data:', e);
      }
    }
  });
  
  const topLevelWidgets = widgets.filter((widget) => {
    const parentColumns = widgets.find(w => 
      w.type === 'columns' && 
      (w as ColumnsWidget).children?.some(col => 
        col.some(child => child.id === widget.id)
      )
    );
    return !parentColumns;
  });
  
  return topLevelWidgets;
};

const parseHtmlWithRegex = (html: string): Widget[] => {
  const widgets: Widget[] = [];
  
  const regex = /data-widget="([^"]+)"/g;
  let match;
  const nestedWidgetIds = new Set<string>();
  
  while ((match = regex.exec(html)) !== null) {
    try {
      const encodedData = match[1];
      const widgetData = JSON.parse(base64Decode(encodedData));
      widgets.push(widgetData as Widget);
      
      if (widgetData.type === 'columns' && widgetData.children) {
        widgetData.children.forEach((col: Widget[]) => {
          col.forEach((child: Widget) => {
            nestedWidgetIds.add(child.id);
          });
        });
      }
    } catch (e) {
      console.error('Failed to parse widget data:', e);
    }
  }
  
  return widgets.filter(w => !nestedWidgetIds.has(w.id));
};

export const isHtmlFormat = (content: string): boolean => {
  if (!content || !content.trim()) {
    return false;
  }
  
  const trimmed = content.trim();
  return trimmed.startsWith('<') && trimmed.includes('data-widget');
};

export const isJsonFormat = (content: string): boolean => {
  if (!content || !content.trim()) {
    return false;
  }
  
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed);
  } catch {
    return false;
  }
};

