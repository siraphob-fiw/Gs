'use client';

import { Widget } from './types';
import { Button } from '@heroui/react';
import {
  FiStar,
  FiHeart,
  FiCheck,
  FiArrowRight,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiClock,
  FiUser,
  FiSettings,
  FiHome,
  FiShield,
  FiAward,
  FiTarget,
  FiTrendingUp,
  FiZap,
} from 'react-icons/fi';

// Icon map for the icon widget
const iconMap: Record<string, React.ComponentType<{ size?: string | number; color?: string }>> = {
  FiStar,
  FiHeart,
  FiCheck,
  FiArrowRight,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiClock,
  FiUser,
  FiSettings,
  FiHome,
  FiShield,
  FiAward,
  FiTarget,
  FiTrendingUp,
  FiZap,
};

interface WidgetRendererProps {
  widget: Widget;
  isEditing?: boolean;
  onUpdateWidget?: (id: string, settings: Record<string, any>) => void;
}

// Extract YouTube video ID
const getYoutubeId = (url: string): string | null => {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : null;
};

// Extract Vimeo video ID
const getVimeoId = (url: string): string | null => {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
};

export function WidgetRenderer({ widget, isEditing = false, onUpdateWidget }: WidgetRendererProps) {
  const renderWidget = () => {
    switch (widget.type) {
      case 'heading': {
        const { text, tag, alignment, color, fontSize, fontWeight } = widget.settings;
        const Tag = tag as keyof JSX.IntrinsicElements;
        const style: React.CSSProperties = {
          textAlign: alignment,
          color: color || undefined,
          fontSize: fontSize || undefined,
          fontWeight: fontWeight || undefined,
        };
        return (
          <Tag style={style} className="text-text">
            {text || 'Heading'}
          </Tag>
        );
      }

      case 'text': {
        const { content, alignment, color, fontSize } = widget.settings;
        const style: React.CSSProperties = {
          textAlign: alignment,
          color: color || undefined,
          fontSize: fontSize || undefined,
        };
        return (
          <div
            style={style}
            className="text-text prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: content || 'Add your text here...' }}
          />
        );
      }

      case 'image': {
        const { src, alt, width, height, alignment, borderRadius, objectFit, link } = widget.settings;
        const alignClass = {
          left: 'mr-auto',
          center: 'mx-auto',
          right: 'ml-auto',
        }[alignment as string] || 'mx-auto';

        const imgStyle: React.CSSProperties = {
          width: width || '100%',
          height: height || 'auto',
          borderRadius: borderRadius || '0',
          objectFit: objectFit || 'cover',
        };

        const img = src ? (
          <img src={src} alt={alt || ''} style={imgStyle} className={`block ${alignClass}`} />
        ) : (
          <div
            style={{ width: width || '100%', height: height || '200px', borderRadius: borderRadius || '0' }}
            className={`bg-default-200 flex items-center justify-center ${alignClass}`}
          >
            <span className="text-default-400">No image selected</span>
          </div>
        );

        if (link && !isEditing) {
          return (
            <a href={link} target="_blank" rel="noopener noreferrer">
              {img}
            </a>
          );
        }

        return img;
      }

      case 'button': {
        const { text, link, target, variant, color, size, alignment, fullWidth, borderRadius } = widget.settings;
        const alignClass = {
          left: 'justify-start',
          center: 'justify-center',
          right: 'justify-end',
        }[alignment as string] || 'justify-start';

        // When not editing, use plain anchor tag to avoid HeroUI routing conflicts
        if (!isEditing && link) {
          const sizeClasses = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2 text-base',
            lg: 'px-6 py-3 text-lg',
          }[size as string] || 'px-4 py-2 text-base';

          const colorClasses = {
            primary: 'bg-primary text-white hover:bg-primary-600',
            secondary: 'bg-secondary text-white hover:bg-secondary-600',
            success: 'bg-success text-white hover:bg-success-600',
            warning: 'bg-warning text-white hover:bg-warning-600',
            danger: 'bg-danger text-white hover:bg-danger-600',
            default: 'bg-default-200 text-default-800 hover:bg-default-300',
          }[color as string] || 'bg-primary text-white hover:bg-primary-600';

          const variantClasses = variant === 'bordered' 
            ? 'bg-transparent border-2 border-current' 
            : variant === 'light' 
            ? 'bg-transparent hover:bg-default-100' 
            : variant === 'ghost'
            ? 'bg-transparent hover:bg-default-100'
            : '';

          return (
            <div className={`flex ${alignClass}`}>
              <a
                href={link}
                target={target || '_self'}
                rel={target === '_blank' ? 'noopener noreferrer' : undefined}
                className={`inline-flex items-center justify-center font-medium transition-colors rounded-lg ${sizeClasses} ${variant === 'bordered' || variant === 'light' || variant === 'ghost' ? variantClasses : colorClasses} ${fullWidth ? 'w-full' : ''}`}
                style={{ borderRadius: borderRadius || undefined }}
              >
                {text || 'Button'}
              </a>
            </div>
          );
        }

        return (
          <div className={`flex ${alignClass}`}>
            <Button
              variant={variant as any}
              color={color as any}
              size={size as any}
              className={fullWidth ? 'w-full' : ''}
              style={{ borderRadius: borderRadius || undefined }}
            >
              {text || 'Button'}
            </Button>
          </div>
        );
      }

      case 'spacer': {
        const { height } = widget.settings;
        return <div style={{ height: height || '40px' }} />;
      }

      case 'divider': {
        const { style, color, width, thickness, alignment } = widget.settings;
        const alignClass = {
          left: 'mr-auto',
          center: 'mx-auto',
          right: 'ml-auto',
        }[alignment as string] || 'mx-auto';

        return (
          <hr
            style={{
              borderStyle: style || 'solid',
              borderColor: color || '#e5e7eb',
              width: width || '100%',
              borderWidth: thickness || '1px',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
            }}
            className={alignClass}
          />
        );
      }

      case 'columns': {
        const { columns, gap, verticalAlign, columnWidths } = widget.settings;
        const children = (widget as any).children || [];

        const alignItems = {
          top: 'items-start',
          middle: 'items-center',
          bottom: 'items-end',
        }[verticalAlign as string] || 'items-start';

        return (
          <div
            className={`grid ${alignItems}`}
            style={{
              gridTemplateColumns: columnWidths
                ? columnWidths.join(' ')
                : `repeat(${columns}, 1fr)`,
              gap: gap || '20px',
            }}
          >
            {Array.from({ length: columns }).map((_, colIdx) => (
              <div 
                key={colIdx} 
                className={isEditing ? "border border-dashed border-border rounded-lg" : "space-y-2"}
              >
                {children[colIdx]?.map((childWidget: Widget) => (
                  <WidgetRenderer
                    key={childWidget.id}
                    widget={childWidget}
                    isEditing={isEditing}
                    onUpdateWidget={onUpdateWidget}
                  />
                ))}
                {(!children[colIdx] || children[colIdx].length === 0) && isEditing && (
                  <div className="text-center text-default-400 py-4">Drop widgets here</div>
                )}
              </div>
            ))}
          </div>
        );
      }

      case 'video': {
        const { src, type, autoplay, loop, muted, controls, width, aspectRatio } = widget.settings;

        if (!src) {
          return (
            <div
              className="bg-default-200 flex items-center justify-center rounded-lg"
              style={{ width: width || '100%', aspectRatio: aspectRatio?.replace(':', '/') || '16/9' }}
            >
              <span className="text-default-400">No video URL provided</span>
            </div>
          );
        }

        if (type === 'youtube') {
          const videoId = getYoutubeId(src);
          if (!videoId) {
            return <div className="text-danger">Invalid YouTube URL</div>;
          }
          return (
            <div style={{ width: width || '100%', aspectRatio: aspectRatio?.replace(':', '/') || '16/9' }}>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&loop=${loop ? 1 : 0}&mute=${muted ? 1 : 0}&controls=${controls ? 1 : 0}`}
                className="w-full h-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        }

        if (type === 'vimeo') {
          const videoId = getVimeoId(src);
          if (!videoId) {
            return <div className="text-danger">Invalid Vimeo URL</div>;
          }
          return (
            <div style={{ width: width || '100%', aspectRatio: aspectRatio?.replace(':', '/') || '16/9' }}>
              <iframe
                src={`https://player.vimeo.com/video/${videoId}?autoplay=${autoplay ? 1 : 0}&loop=${loop ? 1 : 0}&muted=${muted ? 1 : 0}`}
                className="w-full h-full rounded-lg"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        }

        // Self-hosted video
        return (
          <video
            src={src}
            autoPlay={autoplay}
            loop={loop}
            muted={muted}
            controls={controls}
            style={{ width: width || '100%', aspectRatio: aspectRatio?.replace(':', '/') || '16/9' }}
            className="rounded-lg"
          />
        );
      }

      case 'icon': {
        const { icon, size, color, alignment } = widget.settings;
        const IconComponent = iconMap[icon] || FiStar;
        const alignClass = {
          left: 'justify-start',
          center: 'justify-center',
          right: 'justify-end',
        }[alignment as string] || 'justify-center';

        return (
          <div className={`flex ${alignClass}`}>
            <IconComponent size={size || '40px'} color={color || 'currentColor'} />
          </div>
        );
      }

      case 'list': {
        const { items, type, textColor, fontSize, spacing } = widget.settings;
        const listItems = items || [];

        if (type === 'number') {
          return (
            <ol
              style={{ color: textColor || undefined, fontSize: fontSize || undefined }}
              className="list-decimal list-inside space-y-2"
            >
              {listItems.map((item: string, idx: number) => (
                <li key={idx} style={{ marginBottom: spacing || '8px' }}>
                  {item}
                </li>
              ))}
            </ol>
          );
        }

        if (type === 'none') {
          return (
            <ul style={{ color: textColor || undefined, fontSize: fontSize || undefined }} className="list-none pl-0 space-y-2">
              {listItems.map((item: string, idx: number) => (
                <li key={idx} style={{ marginBottom: spacing || '8px' }}>
                  {item}
                </li>
              ))}
            </ul>
          );
        }

        // Bullet list
        return (
          <ul
            style={{ color: textColor || undefined, fontSize: fontSize || undefined }}
            className="list-disc list-inside space-y-2"
          >
            {listItems.map((item: string, idx: number) => (
              <li key={idx} style={{ marginBottom: spacing || '8px' }}>
                {item}
              </li>
            ))}
          </ul>
        );
      }

      case 'html': {
        const { code } = widget.settings;
        return <div dangerouslySetInnerHTML={{ __html: code || '' }} />;
      }

      case 'card': {
        const {
          title,
          description,
          imageSrc,
          imageAlt,
          imageHeight,
          imageObjectFit,
          buttonText,
          buttonLink,
          buttonColor,
          variant,
          alignment,
          padding,
          borderRadius,
          backgroundColor,
          showImage,
          showButton,
        } = widget.settings;

        const alignClass = {
          left: 'text-left',
          center: 'text-center',
          right: 'text-right',
        }[alignment as string] || 'text-left';

        const variantClass = {
          elevated: 'shadow-lg bg-background',
          bordered: 'border-2 border-border bg-background',
          flat: 'bg-default-100',
        }[variant as string] || 'border-2 border-border bg-background';

        return (
          <div
            className={`rounded-lg overflow-hidden ${variantClass} ${alignClass}`}
            style={{
              padding: padding || '16px',
              borderRadius: borderRadius || '12px',
              backgroundColor: backgroundColor || undefined,
            }}
          >
            {showImage && imageSrc && (
              <div className="mb-4 -mx-4 -mt-4" style={{ margin: `-${padding || '16px'}`, marginBottom: '16px' }}>
                <img
                  src={imageSrc}
                  alt={imageAlt || title || ''}
                  style={{
                    width: '100%',
                    height: imageHeight || '192px',
                    objectFit: imageObjectFit || 'cover',
                  }}
                />
              </div>
            )}
            {showImage && !imageSrc && (
              <div 
                className="mb-4 bg-default-200 flex items-center justify-center -mx-4 -mt-4"
                style={{ margin: `-${padding || '16px'}`, marginBottom: '16px', height: imageHeight || '192px' }}
              >
                <span className="text-default-400 text-sm">Card Image</span>
              </div>
            )}
            <h3 className="text-lg font-semibold text-text mb-2">{title || 'Card Title'}</h3>
            <p className="text-default-600 text-sm mb-4">{description || 'Card description goes here.'}</p>
            {showButton && (
              <Button
                as={isEditing ? 'button' : 'a'}
                href={isEditing ? undefined : buttonLink || '#'}
                size="sm"
                color={buttonColor as any || 'primary'}
              >
                {buttonText || 'Learn More'}
              </Button>
            )}
          </div>
        );
      }

      default:
        return <div className="text-danger">Unknown widget type</div>;
    }
  };

  return <div className="widget-content">{renderWidget()}</div>;
}

