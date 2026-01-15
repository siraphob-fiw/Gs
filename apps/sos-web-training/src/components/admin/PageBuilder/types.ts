'use client';

// Widget Types
export type WidgetType =
  | 'heading'
  | 'text'
  | 'image'
  | 'button'
  | 'spacer'
  | 'divider'
  | 'columns'
  | 'video'
  | 'icon'
  | 'list'
  | 'html'
  | 'card';

// Base Widget Interface
export interface BaseWidget {
  id: string;
  type: WidgetType;
  settings: Record<string, any>;
}

// Heading Widget
export interface HeadingWidget extends BaseWidget {
  type: 'heading';
  settings: {
    text: string;
    tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    alignment: 'left' | 'center' | 'right';
    color?: string;
    fontSize?: string;
    fontWeight?: string;
  };
}

// Text Widget
export interface TextWidget extends BaseWidget {
  type: 'text';
  settings: {
    content: string;
    alignment: 'left' | 'center' | 'right' | 'justify';
    color?: string;
    fontSize?: string;
  };
}

// Image Widget
export interface ImageWidget extends BaseWidget {
  type: 'image';
  settings: {
    src: string;
    alt: string;
    width?: string;
    height?: string;
    alignment: 'left' | 'center' | 'right';
    borderRadius?: string;
    objectFit?: 'cover' | 'contain' | 'fill' | 'none';
    link?: string;
  };
}

// Button Widget
export interface ButtonWidget extends BaseWidget {
  type: 'button';
  settings: {
    text: string;
    link: string;
    target: '_self' | '_blank';
    variant: 'solid' | 'bordered' | 'light' | 'flat' | 'ghost';
    color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default';
    size: 'sm' | 'md' | 'lg';
    alignment: 'left' | 'center' | 'right';
    fullWidth?: boolean;
    borderRadius?: string;
  };
}

// Spacer Widget
export interface SpacerWidget extends BaseWidget {
  type: 'spacer';
  settings: {
    height: string;
  };
}

// Divider Widget
export interface DividerWidget extends BaseWidget {
  type: 'divider';
  settings: {
    style: 'solid' | 'dashed' | 'dotted';
    color?: string;
    width?: string;
    thickness?: string;
    alignment: 'left' | 'center' | 'right';
  };
}

// Columns Widget
export interface ColumnsWidget extends BaseWidget {
  type: 'columns';
  settings: {
    columns: number;
    gap: string;
    verticalAlign: 'top' | 'middle' | 'bottom';
    columnWidths?: string[];
  };
  children: Widget[][];
}

// Video Widget
export interface VideoWidget extends BaseWidget {
  type: 'video';
  settings: {
    src: string;
    type: 'youtube' | 'vimeo' | 'self-hosted';
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    controls?: boolean;
    width?: string;
    aspectRatio?: '16:9' | '4:3' | '1:1';
  };
}

// Icon Widget
export interface IconWidget extends BaseWidget {
  type: 'icon';
  settings: {
    icon: string;
    size: string;
    color?: string;
    alignment: 'left' | 'center' | 'right';
  };
}

// List Widget
export interface ListWidget extends BaseWidget {
  type: 'list';
  settings: {
    items: string[];
    type: 'bullet' | 'number' | 'none';
    textColor?: string;
    fontSize?: string;
    spacing?: string;
  };
}

// HTML Widget
export interface HtmlWidget extends BaseWidget {
  type: 'html';
  settings: {
    code: string;
  };
}

// Card Widget
export interface CardWidget extends BaseWidget {
  type: 'card';
  settings: {
    title: string;
    description: string;
    imageSrc?: string;
    imageAlt?: string;
    imageHeight?: string;
    imageObjectFit?: 'cover' | 'contain' | 'fill' | 'none';
    buttonText?: string;
    buttonLink?: string;
    buttonColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default';
    variant: 'elevated' | 'bordered' | 'flat';
    alignment: 'left' | 'center' | 'right';
    padding?: string;
    borderRadius?: string;
    backgroundColor?: string;
    showImage?: boolean;
    showButton?: boolean;
  };
}

// Union type for all widgets
export type Widget =
  | HeadingWidget
  | TextWidget
  | ImageWidget
  | ButtonWidget
  | SpacerWidget
  | DividerWidget
  | ColumnsWidget
  | VideoWidget
  | IconWidget
  | ListWidget
  | HtmlWidget
  | CardWidget;

// Page Builder State
export interface PageBuilderState {
  widgets: Widget[];
  selectedWidgetId: string | null;
  isDragging: boolean;
}

// Widget definitions for the sidebar
export interface WidgetDefinition {
  type: WidgetType;
  label: string;
  icon: React.ReactNode;
  defaultSettings: Record<string, any>;
}

// Generate unique ID
export const generateWidgetId = (): string => {
  return `widget_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Create default widget
export const createDefaultWidget = (type: WidgetType): Widget => {
  const id = generateWidgetId();

  switch (type) {
    case 'heading':
      return {
        id,
        type: 'heading',
        settings: {
          text: 'Heading',
          tag: 'h2',
          alignment: 'left',
          color: '',
          fontSize: '',
          fontWeight: '700',
        },
      };
    case 'text':
      return {
        id,
        type: 'text',
        settings: {
          content: 'Add your text here...',
          alignment: 'left',
          color: '',
          fontSize: '',
        },
      };
    case 'image':
      return {
        id,
        type: 'image',
        settings: {
          src: '',
          alt: '',
          width: '100%',
          height: 'auto',
          alignment: 'center',
          borderRadius: '8px',
          objectFit: 'cover',
          link: '',
        },
      };
    case 'button':
      return {
        id,
        type: 'button',
        settings: {
          text: 'Click Me',
          link: '#',
          target: '_self',
          variant: 'solid',
          color: 'primary',
          size: 'md',
          alignment: 'left',
          fullWidth: false,
          borderRadius: '',
        },
      };
    case 'spacer':
      return {
        id,
        type: 'spacer',
        settings: {
          height: '40px',
        },
      };
    case 'divider':
      return {
        id,
        type: 'divider',
        settings: {
          style: 'solid',
          color: '#e5e7eb',
          width: '100%',
          thickness: '1px',
          alignment: 'center',
        },
      };
    case 'columns':
      return {
        id,
        type: 'columns',
        settings: {
          columns: 2,
          gap: '16px',
          verticalAlign: 'top',
        },
        children: [[], []],
      };
    case 'video':
      return {
        id,
        type: 'video',
        settings: {
          src: '',
          type: 'youtube',
          autoplay: false,
          loop: false,
          muted: false,
          controls: true,
          width: '100%',
          aspectRatio: '16:9',
        },
      };
    case 'icon':
      return {
        id,
        type: 'icon',
        settings: {
          icon: 'FiStar',
          size: '40px',
          color: '',
          alignment: 'center',
        },
      };
    case 'list':
      return {
        id,
        type: 'list',
        settings: {
          items: ['Item 1', 'Item 2', 'Item 3'],
          type: 'bullet',
          textColor: '',
          fontSize: '',
          spacing: '8px',
        },
      };
    case 'html':
      return {
        id,
        type: 'html',
        settings: {
          code: '<div>Custom HTML</div>',
        },
      };
    case 'card':
      return {
        id,
        type: 'card',
        settings: {
          title: 'Card Title',
          description: 'This is a description for the card. You can add more details here.',
          imageSrc: '',
          imageAlt: '',
          imageHeight: '192px',
          imageObjectFit: 'cover',
          buttonText: 'Learn More',
          buttonLink: '#',
          buttonColor: 'primary',
          variant: 'bordered',
          alignment: 'left',
          padding: '16px',
          borderRadius: '12px',
          backgroundColor: '',
          showImage: true,
          showButton: true,
        },
      };
    default:
      throw new Error(`Unknown widget type: ${type}`);
  }
};

