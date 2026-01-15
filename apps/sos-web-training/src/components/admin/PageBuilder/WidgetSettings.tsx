'use client';

import { Widget, WidgetType } from './types';
import { Input, Select, SelectItem, Textarea, Button, Switch, Slider, Divider } from '@heroui/react';
import { FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import { ImageUploader } from './ImageUploader';

interface WidgetSettingsProps {
  widget: Widget;
  onUpdate: (settings: Record<string, any>) => void;
  onClose: () => void;
  onDelete: () => void;
}

const inputClasses = {
  inputWrapper: 'bg-background border-border border',
  input: 'text-text',
  label: 'text-text',
};

const selectClasses = {
  trigger: 'bg-background border-border border',
  value: 'text-text',
  label: 'text-text',
};

export function WidgetSettings({ widget, onUpdate, onClose, onDelete }: WidgetSettingsProps) {
  const updateSetting = (key: string, value: any) => {
    onUpdate({ ...widget.settings, [key]: value });
  };

  const renderSettings = () => {
    switch (widget.type) {
      case 'heading':
        return (
          <>
            <Input
              label="Text"
              value={widget.settings.text}
              onValueChange={(v) => updateSetting('text', v)}
              classNames={inputClasses}
            />
            <Select
              label="Tag"
              selectedKeys={[widget.settings.tag]}
              onSelectionChange={(keys) => updateSetting('tag', Array.from(keys)[0])}
              classNames={selectClasses}
            >
              <SelectItem key="h1">H1</SelectItem>
              <SelectItem key="h2">H2</SelectItem>
              <SelectItem key="h3">H3</SelectItem>
              <SelectItem key="h4">H4</SelectItem>
              <SelectItem key="h5">H5</SelectItem>
              <SelectItem key="h6">H6</SelectItem>
            </Select>
            <Select
              label="Alignment"
              selectedKeys={[widget.settings.alignment]}
              onSelectionChange={(keys) => updateSetting('alignment', Array.from(keys)[0])}
              classNames={selectClasses}
            >
              <SelectItem key="left">Left</SelectItem>
              <SelectItem key="center">Center</SelectItem>
              <SelectItem key="right">Right</SelectItem>
            </Select>
            <Input
              label="Color"
              type="color"
              value={widget.settings.color || '#000000'}
              onChange={(e) => updateSetting('color', e.target.value)}
              classNames={inputClasses}
            />
            <Input
              label="Font Size (e.g., 24px, 2rem)"
              value={widget.settings.fontSize || ''}
              onValueChange={(v) => updateSetting('fontSize', v)}
              classNames={inputClasses}
            />
            <Select
              label="Font Weight"
              selectedKeys={[widget.settings.fontWeight || '700']}
              onSelectionChange={(keys) => updateSetting('fontWeight', Array.from(keys)[0])}
              classNames={selectClasses}
            >
              <SelectItem key="400">Normal (400)</SelectItem>
              <SelectItem key="500">Medium (500)</SelectItem>
              <SelectItem key="600">Semi Bold (600)</SelectItem>
              <SelectItem key="700">Bold (700)</SelectItem>
              <SelectItem key="800">Extra Bold (800)</SelectItem>
            </Select>
          </>
        );

      case 'text':
        return (
          <>
            <Textarea
              label="Content (HTML supported)"
              value={widget.settings.content}
              onValueChange={(v) => updateSetting('content', v)}
              classNames={inputClasses}
              minRows={6}
            />
            <Select
              label="Alignment"
              selectedKeys={[widget.settings.alignment]}
              onSelectionChange={(keys) => updateSetting('alignment', Array.from(keys)[0])}
              classNames={selectClasses}
            >
              <SelectItem key="left">Left</SelectItem>
              <SelectItem key="center">Center</SelectItem>
              <SelectItem key="right">Right</SelectItem>
              <SelectItem key="justify">Justify</SelectItem>
            </Select>
            <Input
              label="Color"
              type="color"
              value={widget.settings.color || '#000000'}
              onChange={(e) => updateSetting('color', e.target.value)}
              classNames={inputClasses}
            />
            <Input
              label="Font Size"
              value={widget.settings.fontSize || ''}
              onValueChange={(v) => updateSetting('fontSize', v)}
              classNames={inputClasses}
            />
          </>
        );

      case 'image':
        return (
          <>
            <ImageUploader
              label="Upload Image"
              value={widget.settings.src}
              onChange={(v) => updateSetting('src', v)}
              maxSizeMB={5}
            />
            <Input
              label="Alt Text"
              value={widget.settings.alt}
              onValueChange={(v) => updateSetting('alt', v)}
              classNames={inputClasses}
            />
            <Input
              label="Width"
              value={widget.settings.width || '100%'}
              onValueChange={(v) => updateSetting('width', v)}
              classNames={inputClasses}
            />
            <Input
              label="Height"
              value={widget.settings.height || 'auto'}
              onValueChange={(v) => updateSetting('height', v)}
              classNames={inputClasses}
            />
            <Select
              label="Alignment"
              selectedKeys={[widget.settings.alignment]}
              onSelectionChange={(keys) => updateSetting('alignment', Array.from(keys)[0])}
              classNames={selectClasses}
            >
              <SelectItem key="left">Left</SelectItem>
              <SelectItem key="center">Center</SelectItem>
              <SelectItem key="right">Right</SelectItem>
            </Select>
            <Input
              label="Border Radius"
              value={widget.settings.borderRadius || '8px'}
              onValueChange={(v) => updateSetting('borderRadius', v)}
              classNames={inputClasses}
            />
            <Select
              label="Object Fit"
              selectedKeys={[widget.settings.objectFit || 'cover']}
              onSelectionChange={(keys) => updateSetting('objectFit', Array.from(keys)[0])}
              classNames={selectClasses}
            >
              <SelectItem key="cover">Cover</SelectItem>
              <SelectItem key="contain">Contain</SelectItem>
              <SelectItem key="fill">Fill</SelectItem>
              <SelectItem key="none">None</SelectItem>
            </Select>
            <Input
              label="Link URL (optional)"
              value={widget.settings.link || ''}
              onValueChange={(v) => updateSetting('link', v)}
              classNames={inputClasses}
            />
          </>
        );

      case 'button':
        return (
          <>
            <Input
              label="Button Text"
              value={widget.settings.text}
              onValueChange={(v) => updateSetting('text', v)}
              classNames={inputClasses}
            />
            <Input
              label="Link URL"
              value={widget.settings.link}
              onValueChange={(v) => updateSetting('link', v)}
              classNames={inputClasses}
            />
            <Select
              label="Open In"
              selectedKeys={[widget.settings.target]}
              onSelectionChange={(keys) => updateSetting('target', Array.from(keys)[0])}
              classNames={selectClasses}
            >
              <SelectItem key="_self">Same Tab</SelectItem>
              <SelectItem key="_blank">New Tab</SelectItem>
            </Select>
            <Select
              label="Variant"
              selectedKeys={[widget.settings.variant]}
              onSelectionChange={(keys) => updateSetting('variant', Array.from(keys)[0])}
              classNames={selectClasses}
            >
              <SelectItem key="solid">Solid</SelectItem>
              <SelectItem key="bordered">Bordered</SelectItem>
              <SelectItem key="light">Light</SelectItem>
              <SelectItem key="flat">Flat</SelectItem>
              <SelectItem key="ghost">Ghost</SelectItem>
            </Select>
            <Select
              label="Color"
              selectedKeys={[widget.settings.color]}
              onSelectionChange={(keys) => updateSetting('color', Array.from(keys)[0])}
              classNames={selectClasses}
            >
              <SelectItem key="primary">Primary</SelectItem>
              <SelectItem key="secondary">Secondary</SelectItem>
              <SelectItem key="success">Success</SelectItem>
              <SelectItem key="warning">Warning</SelectItem>
              <SelectItem key="danger">Danger</SelectItem>
              <SelectItem key="default">Default</SelectItem>
            </Select>
            <Select
              label="Size"
              selectedKeys={[widget.settings.size]}
              onSelectionChange={(keys) => updateSetting('size', Array.from(keys)[0])}
              classNames={selectClasses}
            >
              <SelectItem key="sm">Small</SelectItem>
              <SelectItem key="md">Medium</SelectItem>
              <SelectItem key="lg">Large</SelectItem>
            </Select>
            <Select
              label="Alignment"
              selectedKeys={[widget.settings.alignment]}
              onSelectionChange={(keys) => updateSetting('alignment', Array.from(keys)[0])}
              classNames={selectClasses}
            >
              <SelectItem key="left">Left</SelectItem>
              <SelectItem key="center">Center</SelectItem>
              <SelectItem key="right">Right</SelectItem>
            </Select>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text">Full Width</span>
              <Switch
                isSelected={widget.settings.fullWidth}
                onValueChange={(v) => updateSetting('fullWidth', v)}
              />
            </div>
          </>
        );

      case 'spacer':
        return (
          <Input
            label="Height (e.g., 40px, 2rem)"
            value={widget.settings.height}
            onValueChange={(v) => updateSetting('height', v)}
            classNames={inputClasses}
          />
        );

      case 'divider':
        return (
          <>
            <Select
              label="Style"
              selectedKeys={[widget.settings.style]}
              onSelectionChange={(keys) => updateSetting('style', Array.from(keys)[0])}
              classNames={selectClasses}
            >
              <SelectItem key="solid">Solid</SelectItem>
              <SelectItem key="dashed">Dashed</SelectItem>
              <SelectItem key="dotted">Dotted</SelectItem>
            </Select>
            <Input
              label="Color"
              type="color"
              value={widget.settings.color || '#e5e7eb'}
              onChange={(e) => updateSetting('color', e.target.value)}
              classNames={inputClasses}
            />
            <Input
              label="Width"
              value={widget.settings.width || '100%'}
              onValueChange={(v) => updateSetting('width', v)}
              classNames={inputClasses}
            />
            <Input
              label="Thickness"
              value={widget.settings.thickness || '1px'}
              onValueChange={(v) => updateSetting('thickness', v)}
              classNames={inputClasses}
            />
            <Select
              label="Alignment"
              selectedKeys={[widget.settings.alignment]}
              onSelectionChange={(keys) => updateSetting('alignment', Array.from(keys)[0])}
              classNames={selectClasses}
            >
              <SelectItem key="left">Left</SelectItem>
              <SelectItem key="center">Center</SelectItem>
              <SelectItem key="right">Right</SelectItem>
            </Select>
          </>
        );

      case 'columns':
        return (
          <>
            <Select
              label="Number of Columns"
              selectedKeys={[String(widget.settings.columns)]}
              onSelectionChange={(keys) => updateSetting('columns', Number(Array.from(keys)[0]))}
              classNames={selectClasses}
            >
              <SelectItem key="2">2 Columns</SelectItem>
              <SelectItem key="3">3 Columns</SelectItem>
              <SelectItem key="4">4 Columns</SelectItem>
            </Select>
            <Input
              label="Gap"
              value={widget.settings.gap || '20px'}
              onValueChange={(v) => updateSetting('gap', v)}
              classNames={inputClasses}
            />
            <Select
              label="Vertical Alignment"
              selectedKeys={[widget.settings.verticalAlign]}
              onSelectionChange={(keys) => updateSetting('verticalAlign', Array.from(keys)[0])}
              classNames={selectClasses}
            >
              <SelectItem key="top">Top</SelectItem>
              <SelectItem key="middle">Middle</SelectItem>
              <SelectItem key="bottom">Bottom</SelectItem>
            </Select>
          </>
        );

      case 'video':
        return (
          <>
            <Input
              label="Video URL"
              value={widget.settings.src}
              onValueChange={(v) => updateSetting('src', v)}
              classNames={inputClasses}
            />
            <Select
              label="Video Type"
              selectedKeys={[widget.settings.type]}
              onSelectionChange={(keys) => updateSetting('type', Array.from(keys)[0])}
              classNames={selectClasses}
            >
              <SelectItem key="youtube">YouTube</SelectItem>
              <SelectItem key="vimeo">Vimeo</SelectItem>
              <SelectItem key="self-hosted">Self-Hosted</SelectItem>
            </Select>
            <Select
              label="Aspect Ratio"
              selectedKeys={[widget.settings.aspectRatio || '16:9']}
              onSelectionChange={(keys) => updateSetting('aspectRatio', Array.from(keys)[0])}
              classNames={selectClasses}
            >
              <SelectItem key="16:9">16:9</SelectItem>
              <SelectItem key="4:3">4:3</SelectItem>
              <SelectItem key="1:1">1:1</SelectItem>
            </Select>
            <Input
              label="Width"
              value={widget.settings.width || '100%'}
              onValueChange={(v) => updateSetting('width', v)}
              classNames={inputClasses}
            />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text">Autoplay</span>
                <Switch
                  isSelected={widget.settings.autoplay}
                  onValueChange={(v) => updateSetting('autoplay', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text">Loop</span>
                <Switch
                  isSelected={widget.settings.loop}
                  onValueChange={(v) => updateSetting('loop', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text">Muted</span>
                <Switch
                  isSelected={widget.settings.muted}
                  onValueChange={(v) => updateSetting('muted', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text">Show Controls</span>
                <Switch
                  isSelected={widget.settings.controls}
                  onValueChange={(v) => updateSetting('controls', v)}
                />
              </div>
            </div>
          </>
        );

      case 'icon':
        return (
          <>
            <Select
              label="Icon"
              selectedKeys={[widget.settings.icon]}
              onSelectionChange={(keys) => updateSetting('icon', Array.from(keys)[0])}
              classNames={selectClasses}
            >
              <SelectItem key="FiStar">Star</SelectItem>
              <SelectItem key="FiHeart">Heart</SelectItem>
              <SelectItem key="FiCheck">Check</SelectItem>
              <SelectItem key="FiArrowRight">Arrow Right</SelectItem>
              <SelectItem key="FiMail">Mail</SelectItem>
              <SelectItem key="FiPhone">Phone</SelectItem>
              <SelectItem key="FiMapPin">Map Pin</SelectItem>
              <SelectItem key="FiCalendar">Calendar</SelectItem>
              <SelectItem key="FiClock">Clock</SelectItem>
              <SelectItem key="FiUser">User</SelectItem>
              <SelectItem key="FiSettings">Settings</SelectItem>
              <SelectItem key="FiHome">Home</SelectItem>
              <SelectItem key="FiShield">Shield</SelectItem>
              <SelectItem key="FiAward">Award</SelectItem>
              <SelectItem key="FiTarget">Target</SelectItem>
              <SelectItem key="FiTrendingUp">Trending Up</SelectItem>
              <SelectItem key="FiZap">Zap</SelectItem>
            </Select>
            <Input
              label="Size (e.g., 40px)"
              value={widget.settings.size || '40px'}
              onValueChange={(v) => updateSetting('size', v)}
              classNames={inputClasses}
            />
            <Input
              label="Color"
              type="color"
              value={widget.settings.color || '#000000'}
              onChange={(e) => updateSetting('color', e.target.value)}
              classNames={inputClasses}
            />
            <Select
              label="Alignment"
              selectedKeys={[widget.settings.alignment]}
              onSelectionChange={(keys) => updateSetting('alignment', Array.from(keys)[0])}
              classNames={selectClasses}
            >
              <SelectItem key="left">Left</SelectItem>
              <SelectItem key="center">Center</SelectItem>
              <SelectItem key="right">Right</SelectItem>
            </Select>
          </>
        );

      case 'list':
        const items = widget.settings.items || [];
        return (
          <>
            <div className="space-y-2">
              <label className="text-sm text-text font-medium">List Items</label>
              {items.map((item: string, idx: number) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    value={item}
                    onValueChange={(v) => {
                      const newItems = [...items];
                      newItems[idx] = v;
                      updateSetting('items', newItems);
                    }}
                    classNames={inputClasses}
                    className="flex-1"
                  />
                  <Button
                    isIconOnly
                    size="sm"
                    color="danger"
                    variant="flat"
                    onPress={() => {
                      const newItems = items.filter((_: string, i: number) => i !== idx);
                      updateSetting('items', newItems);
                    }}
                  >
                    <FiTrash2 />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="flat"
                startContent={<FiPlus />}
                onPress={() => updateSetting('items', [...items, 'New Item'])}
              >
                Add Item
              </Button>
            </div>
            <Divider className="my-2" />
            <Select
              label="List Type"
              selectedKeys={[widget.settings.type]}
              onSelectionChange={(keys) => updateSetting('type', Array.from(keys)[0])}
              classNames={selectClasses}
            >
              <SelectItem key="bullet">Bullet</SelectItem>
              <SelectItem key="number">Number</SelectItem>
              <SelectItem key="none">None</SelectItem>
            </Select>
            <Input
              label="Text Color"
              type="color"
              value={widget.settings.textColor || '#000000'}
              onChange={(e) => updateSetting('textColor', e.target.value)}
              classNames={inputClasses}
            />
            <Input
              label="Font Size"
              value={widget.settings.fontSize || ''}
              onValueChange={(v) => updateSetting('fontSize', v)}
              classNames={inputClasses}
            />
            <Input
              label="Item Spacing"
              value={widget.settings.spacing || '8px'}
              onValueChange={(v) => updateSetting('spacing', v)}
              classNames={inputClasses}
            />
          </>
        );

      case 'html':
        return (
          <Textarea
            label="HTML Code"
            value={widget.settings.code}
            onValueChange={(v) => updateSetting('code', v)}
            classNames={inputClasses}
            minRows={10}
          />
        );

      case 'card':
        return (
          <>
            <Input
              label="Title"
              value={widget.settings.title || ''}
              onValueChange={(v) => updateSetting('title', v)}
              classNames={inputClasses}
            />
            <Textarea
              label="Description"
              value={widget.settings.description || ''}
              onValueChange={(v) => updateSetting('description', v)}
              classNames={inputClasses}
              minRows={3}
            />
            <Divider className="my-2" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-text">Show Image</span>
              <Switch
                isSelected={widget.settings.showImage}
                onValueChange={(v) => updateSetting('showImage', v)}
              />
            </div>
            {widget.settings.showImage && (
              <>
                <ImageUploader
                  label="Card Image"
                  value={widget.settings.imageSrc || ''}
                  onChange={(v) => updateSetting('imageSrc', v)}
                  maxSizeMB={5}
                />
                <Input
                  label="Image Alt Text"
                  value={widget.settings.imageAlt || ''}
                  onValueChange={(v) => updateSetting('imageAlt', v)}
                  classNames={inputClasses}
                />
                <Input
                  label="Image Height"
                  value={widget.settings.imageHeight || '192px'}
                  onValueChange={(v) => updateSetting('imageHeight', v)}
                  placeholder="e.g., 192px, 200px, 300px"
                  classNames={inputClasses}
                />
                <Select
                  label="Image Fit"
                  selectedKeys={[widget.settings.imageObjectFit || 'cover']}
                  onSelectionChange={(keys) => updateSetting('imageObjectFit', Array.from(keys)[0])}
                  classNames={selectClasses}
                >
                  <SelectItem key="cover">Cover (fill & crop)</SelectItem>
                  <SelectItem key="contain">Contain (fit inside)</SelectItem>
                  <SelectItem key="fill">Fill (stretch)</SelectItem>
                  <SelectItem key="none">None (original size)</SelectItem>
                </Select>
              </>
            )}
            <Divider className="my-2" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-text">Show Button</span>
              <Switch
                isSelected={widget.settings.showButton}
                onValueChange={(v) => updateSetting('showButton', v)}
              />
            </div>
            {widget.settings.showButton && (
              <>
                <Input
                  label="Button Text"
                  value={widget.settings.buttonText || ''}
                  onValueChange={(v) => updateSetting('buttonText', v)}
                  classNames={inputClasses}
                />
                <Input
                  label="Button Link"
                  value={widget.settings.buttonLink || ''}
                  onValueChange={(v) => updateSetting('buttonLink', v)}
                  classNames={inputClasses}
                />
                <Select
                  label="Button Color"
                  selectedKeys={[widget.settings.buttonColor || 'primary']}
                  onSelectionChange={(keys) => updateSetting('buttonColor', Array.from(keys)[0])}
                  classNames={selectClasses}
                >
                  <SelectItem key="primary">Primary</SelectItem>
                  <SelectItem key="secondary">Secondary</SelectItem>
                  <SelectItem key="success">Success</SelectItem>
                  <SelectItem key="warning">Warning</SelectItem>
                  <SelectItem key="danger">Danger</SelectItem>
                  <SelectItem key="default">Default</SelectItem>
                </Select>
              </>
            )}
            <Divider className="my-2" />
            <Select
              label="Card Style"
              selectedKeys={[widget.settings.variant || 'bordered']}
              onSelectionChange={(keys) => updateSetting('variant', Array.from(keys)[0])}
              classNames={selectClasses}
            >
              <SelectItem key="elevated">Elevated (Shadow)</SelectItem>
              <SelectItem key="bordered">Bordered</SelectItem>
              <SelectItem key="flat">Flat</SelectItem>
            </Select>
            <Select
              label="Text Alignment"
              selectedKeys={[widget.settings.alignment || 'left']}
              onSelectionChange={(keys) => updateSetting('alignment', Array.from(keys)[0])}
              classNames={selectClasses}
            >
              <SelectItem key="left">Left</SelectItem>
              <SelectItem key="center">Center</SelectItem>
              <SelectItem key="right">Right</SelectItem>
            </Select>
            <Input
              label="Padding"
              value={widget.settings.padding || '16px'}
              onValueChange={(v) => updateSetting('padding', v)}
              classNames={inputClasses}
            />
            <Input
              label="Border Radius"
              value={widget.settings.borderRadius || '12px'}
              onValueChange={(v) => updateSetting('borderRadius', v)}
              classNames={inputClasses}
            />
            <Input
              label="Background Color"
              type="color"
              value={widget.settings.backgroundColor || '#ffffff'}
              onChange={(e) => updateSetting('backgroundColor', e.target.value)}
              classNames={inputClasses}
            />
          </>
        );

      default:
        return <div className="text-default-500">No settings available for this widget.</div>;
    }
  };

  const getWidgetTitle = (type: WidgetType): string => {
    const titles: Record<WidgetType, string> = {
      heading: 'Heading',
      text: 'Text',
      image: 'Image',
      button: 'Button',
      spacer: 'Spacer',
      divider: 'Divider',
      columns: 'Columns',
      video: 'Video',
      icon: 'Icon',
      list: 'List',
      html: 'Custom HTML',
      card: 'Card',
    };
    return titles[type] || 'Widget';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-text">{getWidgetTitle(widget.type)} Settings</h3>
        <Button isIconOnly size="sm" variant="light" onPress={onClose}>
          <FiX />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">{renderSettings()}</div>
      <div className="p-4 border-t border-border">
        <Button color="danger" variant="flat" className="w-full" startContent={<FiTrash2 />} onPress={onDelete}>
          Delete Widget
        </Button>
      </div>
    </div>
  );
}

