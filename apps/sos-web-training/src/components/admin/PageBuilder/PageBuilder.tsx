'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button, ScrollShadow, Tooltip } from '@heroui/react';
import {
  FiType,
  FiAlignLeft,
  FiImage,
  FiSquare,
  FiMinus,
  FiColumns,
  FiVideo,
  FiStar,
  FiList,
  FiCode,
  FiMove,
  FiChevronUp,
  FiChevronDown,
  FiCopy,
  FiTrash2,
  FiEye,
  FiEdit3,
  FiHome,
  FiCreditCard,
} from 'react-icons/fi';
import { Widget, WidgetType, ColumnsWidget, createDefaultWidget, generateWidgetId } from './types';
import { WidgetSettings } from './WidgetSettings';
import { widgetsToHtml, htmlToWidgets } from './htmlConverter';

interface PageOptions {
  on_menu?: boolean;
  on_footer?: boolean;
}

interface PageBuilderProps {
  initialContent?: string;
  onChange: (content: string) => void;
  pageTitle?: string;
  options?: PageOptions;
}

interface WidgetDefinition {
  type: WidgetType;
  label: string;
  icon: React.ReactNode;
}

const widgetDefinitions: WidgetDefinition[] = [
  { type: 'heading', label: 'Heading', icon: <FiType size={20} /> },
  { type: 'text', label: 'Text', icon: <FiAlignLeft size={20} /> },
  { type: 'image', label: 'Image', icon: <FiImage size={20} /> },
  { type: 'button', label: 'Button', icon: <FiSquare size={20} /> },
  { type: 'spacer', label: 'Spacer', icon: <FiMinus size={20} /> },
  { type: 'divider', label: 'Divider', icon: <FiMinus size={20} /> },
  { type: 'columns', label: 'Columns', icon: <FiColumns size={20} /> },
  { type: 'video', label: 'Video', icon: <FiVideo size={20} /> },
  { type: 'icon', label: 'Icon', icon: <FiStar size={20} /> },
  { type: 'list', label: 'List', icon: <FiList size={20} /> },
  { type: 'html', label: 'HTML', icon: <FiCode size={20} /> },
  { type: 'card', label: 'Card', icon: <FiCreditCard size={20} /> },
];

// Drop target type for columns
interface ColumnDropTarget {
  widgetId: string;
  columnIndex: number;
  insertIndex: number;
}

export function PageBuilder({ initialContent, onChange, pageTitle, options }: PageBuilderProps) {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [columnDropTarget, setColumnDropTarget] = useState<ColumnDropTarget | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Parse initial content (HTML format with embedded widget data, or legacy JSON/HTML)
  useEffect(() => {
    if (initialContent) {
      const parsed = htmlToWidgets(initialContent);
      if (parsed.length > 0) {
        setWidgets(parsed);
      } else if (initialContent.trim()) {
        // If parsing failed but content exists, wrap as legacy HTML widget
        setWidgets([
          {
            id: generateWidgetId(),
            type: 'html',
            settings: { code: initialContent },
          },
        ]);
      }
    }
  }, []);

  // Notify parent of changes - convert widgets to HTML before saving
  useEffect(() => {
    const content = widgetsToHtml(widgets);
    onChange(content);
  }, [widgets, onChange]);

  // Find selected widget (including nested ones)
  const findWidget = useCallback((widgetId: string, widgetList: Widget[]): Widget | null => {
    for (const widget of widgetList) {
      if (widget.id === widgetId) return widget;
      if (widget.type === 'columns') {
        const columnsWidget = widget as ColumnsWidget;
        for (const column of columnsWidget.children || []) {
          const found = findWidget(widgetId, column);
          if (found) return found;
        }
      }
    }
    return null;
  }, []);

  const selectedWidget = selectedWidgetId ? findWidget(selectedWidgetId, widgets) : null;

  // Widget operations
  const addWidget = useCallback((type: WidgetType, index?: number) => {
    // Don't allow nesting columns inside columns
    if (type === 'columns' && columnDropTarget) {
      return;
    }

    const newWidget = createDefaultWidget(type);
    setWidgets((prev) => {
      const newWidgets = [...prev];
      if (index !== undefined) {
        newWidgets.splice(index, 0, newWidget);
      } else {
        newWidgets.push(newWidget);
      }
      return newWidgets;
    });
    setSelectedWidgetId(newWidget.id);
  }, [columnDropTarget]);

  // Add widget to a column
  const addWidgetToColumn = useCallback((type: WidgetType, parentWidgetId: string, columnIndex: number, insertIndex: number) => {
    // Don't allow nesting columns inside columns
    if (type === 'columns') {
      return;
    }

    const newWidget = createDefaultWidget(type);
    
    setWidgets((prev) => {
      const updateColumnChildren = (widgetList: Widget[]): Widget[] => {
        return widgetList.map((widget) => {
          if (widget.id === parentWidgetId && widget.type === 'columns') {
            const columnsWidget = widget as ColumnsWidget;
            const newChildren = [...(columnsWidget.children || [])];
            
            // Ensure the column array exists
            while (newChildren.length <= columnIndex) {
              newChildren.push([]);
            }
            
            // Insert the new widget at the specified index
            const columnWidgets = [...newChildren[columnIndex]];
            columnWidgets.splice(insertIndex, 0, newWidget);
            newChildren[columnIndex] = columnWidgets;
            
            return {
              ...columnsWidget,
              children: newChildren,
            };
          }
          return widget;
        });
      };
      
      return updateColumnChildren(prev);
    });
    
    setSelectedWidgetId(newWidget.id);
  }, []);

  // Update widget (including nested)
  const updateWidget = useCallback((id: string, settings: Record<string, any>) => {
    setWidgets((prev) => {
      const updateInList = (widgetList: Widget[]): Widget[] => {
        return widgetList.map((w): Widget => {
          if (w.id === id) {
            // If updating a columns widget, handle children array adjustment
            if (w.type === 'columns') {
              const columnsWidget = w as ColumnsWidget;
              const newSettings = { ...columnsWidget.settings, ...settings };
              const newColumnCount = newSettings.columns || 2;
              const currentChildren = columnsWidget.children || [];
              
              // Adjust children array to match new column count
              let newChildren = [...currentChildren];
              while (newChildren.length < newColumnCount) {
                newChildren.push([]);
              }
              // Trim if reducing columns (widgets in removed columns are lost)
              if (newChildren.length > newColumnCount) {
                newChildren = newChildren.slice(0, newColumnCount);
              }
              
              return {
                ...columnsWidget,
                settings: newSettings,
                children: newChildren,
              } as ColumnsWidget;
            }
            
            // Regular widget update
            return {
              ...w,
              settings: {
                ...w.settings,
                ...settings,
              },
            } as Widget;
          }
          
          // Recursively search in columns children
          if (w.type === 'columns') {
            const columnsWidget = w as ColumnsWidget;
            return {
              ...columnsWidget,
              children: (columnsWidget.children || []).map((column) => updateInList(column)),
            } as ColumnsWidget;
          }
          
          return w;
        });
      };
      return updateInList(prev);
    });
  }, []);

  // Delete widget (including from columns)
  const deleteWidget = useCallback((id: string) => {
    setWidgets((prev) => {
      const deleteFromList = (widgetList: Widget[]): Widget[] => {
        return widgetList
          .filter((w) => w.id !== id)
          .map((w) => {
            if (w.type === 'columns') {
              const columnsWidget = w as ColumnsWidget;
              return {
                ...columnsWidget,
                children: (columnsWidget.children || []).map((column) => deleteFromList(column)),
              };
            }
            return w;
          });
      };
      return deleteFromList(prev);
    });
    if (selectedWidgetId === id) {
      setSelectedWidgetId(null);
    }
  }, [selectedWidgetId]);

  const moveWidget = useCallback((id: string, direction: 'up' | 'down') => {
    setWidgets((prev) => {
      const index = prev.findIndex((w) => w.id === id);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;

      const newWidgets = [...prev];
      [newWidgets[index], newWidgets[newIndex]] = [newWidgets[newIndex], newWidgets[index]];
      return newWidgets;
    });
  }, []);

  // Helper to recursively regenerate IDs for a widget and its children
  const regenerateWidgetIds = (widget: Widget): Widget => {
    const newWidget = {
      ...JSON.parse(JSON.stringify(widget)),
      id: generateWidgetId(),
    };
    
    // If it's a columns widget, regenerate IDs for all children
    if (newWidget.type === 'columns' && newWidget.children) {
      newWidget.children = newWidget.children.map((column: Widget[]) =>
        column.map((childWidget: Widget) => regenerateWidgetIds(childWidget))
      );
    }
    
    return newWidget;
  };

  const duplicateWidget = useCallback((id: string) => {
    setWidgets((prev) => {
      const index = prev.findIndex((w) => w.id === id);
      if (index === -1) return prev;

      const originalWidget = prev[index];
      const newWidget = regenerateWidgetIds(originalWidget);

      const newWidgets = [...prev];
      newWidgets.splice(index + 1, 0, newWidget);
      return newWidgets;
    });
  }, []);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, type: WidgetType) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('widgetType', type);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOverIndex(null);
    setColumnDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverIndex(index);
    setColumnDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    const type = e.dataTransfer.getData('widgetType') as WidgetType;
    if (type) {
      addWidget(type, index);
    }
    setIsDragging(false);
    setDragOverIndex(null);
    setColumnDropTarget(null);
  };

  // Column drag and drop handlers
  const handleColumnDragOver = (e: React.DragEvent, widgetId: string, columnIndex: number, insertIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverIndex(null);
    setColumnDropTarget({ widgetId, columnIndex, insertIndex });
  };

  const handleColumnDrop = (e: React.DragEvent, widgetId: string, columnIndex: number, insertIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const type = e.dataTransfer.getData('widgetType') as WidgetType;
    if (type) {
      addWidgetToColumn(type, widgetId, columnIndex, insertIndex);
    }
    setIsDragging(false);
    setDragOverIndex(null);
    setColumnDropTarget(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedWidgetId) {
        deleteWidget(selectedWidgetId);
      }
      if (e.key === 'Escape') {
        setSelectedWidgetId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWidgetId, deleteWidget]);

  // Render widget with controls
  const renderWidget = (widget: Widget, index: number, parentId?: string, columnIndex?: number) => {
    const isInColumn = parentId !== undefined;
    
    return (
      <div
        key={widget.id}
        className={`group relative rounded-lg transition-all ${
          isPreviewMode
            ? 'p-2'
            : `p-3 border-2 cursor-pointer hover:border-primary/50 ${
                selectedWidgetId === widget.id
                  ? 'border-primary shadow-lg'
                  : 'border-transparent hover:bg-default-100'
              }`
        }`}
        onClick={(e) => {
          e.stopPropagation();
          if (!isPreviewMode) setSelectedWidgetId(widget.id);
        }}
      >
        {/* Widget Label */}
        {!isPreviewMode && selectedWidgetId === widget.id && (
          <div className="absolute -top-3 left-2 flex items-center gap-1 bg-primary text-white px-2 py-0.5 rounded text-xs font-medium z-10">
            <span>{widgetDefinitions.find((d) => d.type === widget.type)?.label}</span>
          </div>
        )}
        
        {/* Widget Controls */}
        {!isPreviewMode && !isInColumn && (
          <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <Tooltip content="Move Up">
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                className="bg-background h-6 w-6 min-w-6"
                onPress={() => moveWidget(widget.id, 'up')}
                isDisabled={index === 0}
              >
                <FiChevronUp size={12} />
              </Button>
            </Tooltip>
            <Tooltip content="Move Down">
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                className="bg-background h-6 w-6 min-w-6"
                onPress={() => moveWidget(widget.id, 'down')}
                isDisabled={index === widgets.length - 1}
              >
                <FiChevronDown size={12} />
              </Button>
            </Tooltip>
            <Tooltip content="Duplicate">
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                className="bg-background h-6 w-6 min-w-6"
                onPress={() => duplicateWidget(widget.id)}
              >
                <FiCopy size={12} />
              </Button>
            </Tooltip>
            <Tooltip content="Delete">
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                color="danger"
                className="bg-background h-6 w-6 min-w-6"
                onPress={() => deleteWidget(widget.id)}
              >
                <FiTrash2 size={12} />
              </Button>
            </Tooltip>
          </div>
        )}

        {/* Delete button for nested widgets */}
        {!isPreviewMode && isInColumn && (
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <Tooltip content="Delete">
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                color="danger"
                className="bg-background h-6 w-6 min-w-6"
                onPress={() => deleteWidget(widget.id)}
              >
                <FiTrash2 size={12} />
              </Button>
            </Tooltip>
          </div>
        )}

        {/* Widget Content */}
        {renderWidgetContent(widget)}
      </div>
    );
  };

  // Render widget content (handles columns specially)
  const renderWidgetContent = (widget: Widget) => {
    if (widget.type === 'columns') {
      return renderColumnsWidget(widget as ColumnsWidget);
    }
    
    // Regular widget rendering
    return <WidgetContent widget={widget} />;
  };

  // Render columns widget with drop zones
  const renderColumnsWidget = (widget: ColumnsWidget) => {
    const { columns, gap, verticalAlign, columnWidths } = widget.settings;
    const children = widget.children || [];

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
          gap: gap || '16px',
        }}
      >
        {Array.from({ length: columns }).map((_, colIdx) => {
          const columnWidgets = children[colIdx] || [];
          const isDropTarget = columnDropTarget?.widgetId === widget.id && columnDropTarget?.columnIndex === colIdx;

          return (
            <div
              key={colIdx}
              className={`min-h-[80px] rounded-lg transition-all ${
                isPreviewMode
                  ? ''
                  : `border-2 border-dashed ${isDropTarget ? 'border-primary bg-primary/10' : 'border-default-300 hover:border-default-400'}`
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleColumnDragOver(e, widget.id, colIdx, columnWidgets.length);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleColumnDrop(e, widget.id, colIdx, columnWidgets.length);
              }}
            >
              {columnWidgets.length === 0 ? (
                <div className={`flex items-center justify-center h-full min-h-[80px] p-2 ${isPreviewMode ? '' : 'text-default-400'}`}>
                  {!isPreviewMode && (
                    <span className="text-xs text-center">Drop widgets here</span>
                  )}
                </div>
              ) : (
                <div className={"space-y-2"}>
                  {columnWidgets.map((childWidget, childIdx) => (
                    <div key={childWidget.id}>
                      {/* Drop zone before each widget */}
                      {!isPreviewMode && (
                        <div
                          className={`h-1 transition-all rounded mb-1 ${
                            columnDropTarget?.widgetId === widget.id &&
                            columnDropTarget?.columnIndex === colIdx &&
                            columnDropTarget?.insertIndex === childIdx
                              ? 'bg-primary h-6'
                              : ''
                          }`}
                          onDragOver={(e) => handleColumnDragOver(e, widget.id, colIdx, childIdx)}
                          onDrop={(e) => handleColumnDrop(e, widget.id, colIdx, childIdx)}
                        />
                      )}
                      {renderWidget(childWidget, childIdx, widget.id, colIdx)}
                    </div>
                  ))}
                  {/* Drop zone after last widget */}
                  {!isPreviewMode && (
                    <div
                      className={`h-1 transition-all rounded ${
                        columnDropTarget?.widgetId === widget.id &&
                        columnDropTarget?.columnIndex === colIdx &&
                        columnDropTarget?.insertIndex === columnWidgets.length
                          ? 'bg-primary h-6'
                          : ''
                      }`}
                      onDragOver={(e) => handleColumnDragOver(e, widget.id, colIdx, columnWidgets.length)}
                      onDrop={(e) => handleColumnDrop(e, widget.id, colIdx, columnWidgets.length)}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-[700px] border border-border rounded-lg overflow-hidden bg-background">
      {/* Widgets Sidebar */}
      {!isPreviewMode && (
        <div className="w-64 border-r border-border bg-backgroundSecondary flex flex-col">
          <div className="p-3 border-b border-border">
            <h3 className="font-semibold text-text text-sm">Widgets</h3>
            <p className="text-xs text-default-500 mt-1">Drag or click to add</p>
          </div>
          <ScrollShadow className="flex-1 p-3">
            <div className="grid grid-cols-2 gap-2">
              {widgetDefinitions.map((def) => (
                <div
                  key={def.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, def.type)}
                  onDragEnd={handleDragEnd}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg border border-border bg-background hover:border-primary hover:bg-primary/5 cursor-grab active:cursor-grabbing transition-all"
                  onClick={() => addWidget(def.type)}
                >
                  <span className="text-text">{def.icon}</span>
                  <span className="text-xs text-text">{def.label}</span>
                </div>
              ))}
            </div>
          </ScrollShadow>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-backgroundSecondary">
          <div className="flex items-center gap-2">
            <span className="text-sm text-text font-medium">
              {widgets.length} widget{widgets.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip content={isPreviewMode ? 'Edit Mode' : 'Preview Mode'}>
              <Button
                isIconOnly
                size="sm"
                variant={isPreviewMode ? 'solid' : 'flat'}
                color={isPreviewMode ? 'primary' : 'default'}
                onPress={() => {
                  setIsPreviewMode(!isPreviewMode);
                  setSelectedWidgetId(null);
                }}
              >
                {isPreviewMode ? <FiEdit3 /> : <FiEye />}
              </Button>
            </Tooltip>
          </div>
        </div>

        {/* Canvas Content */}
        <ScrollShadow className="flex-1 bg-default-50 overflow-auto">
          {/* Preview Navbar - shows when on_menu is true and in preview mode */}
          {isPreviewMode && options?.on_menu && (
            <div className="sticky top-0 z-10 bg-background border-b border-border shadow-sm">
              <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FiHome className="text-primary" size={20} />
                  </div>
                  <span className="font-semibold text-text">StrengthOS</span>
                </div>
                <nav className="flex items-center gap-6">
                  <span className="text-sm text-default-500 hover:text-text cursor-pointer">Home</span>
                  <span className="text-sm text-primary font-medium cursor-pointer border-b-2 border-primary pb-1">
                    {pageTitle || 'This Page'}
                  </span>
                  <span className="text-sm text-default-500 hover:text-text cursor-pointer">Other Pages...</span>
                </nav>
                <Button size="sm" color="default" variant="solid">
                  Login
                </Button>
              </div>
            </div>
          )}
          
          <div
            className={`min-h-full p-4 ${isDragging ? 'bg-primary/5' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              if (widgets.length === 0) {
                setDragOverIndex(0);
              }
            }}
            onDrop={(e) => {
              if (widgets.length === 0) {
                handleDrop(e, 0);
              }
            }}
          >
            {widgets.length === 0 ? (
              <div
                className={`flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed rounded-lg ${isDragging ? 'border-primary bg-primary/5' : 'border-default-300'}`}
              >
                <FiMove size={40} className="text-default-400 mb-4" />
                <p className="text-default-500 text-center">
                  Drag and drop widgets here
                  <br />
                  <span className="text-sm">or click a widget to add it</span>
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {widgets.map((widget, index) => (
                  <div key={widget.id}>
                    {/* Drop Zone Before */}
                    {!isPreviewMode && (
                      <div
                        className={`h-2 transition-all rounded ${dragOverIndex === index ? 'bg-primary h-8' : ''}`}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                      />
                    )}
                    {renderWidget(widget, index)}
                  </div>
                ))}
                
                {/* Drop Zone After Last Widget */}
                {!isPreviewMode && (
                  <div
                    className={`h-2 transition-all rounded ${dragOverIndex === widgets.length ? 'bg-primary h-8' : ''}`}
                    onDragOver={(e) => handleDragOver(e, widgets.length)}
                    onDrop={(e) => handleDrop(e, widgets.length)}
                  />
                )}
              </div>
            )}
          </div>
        </ScrollShadow>
      </div>

      {/* Settings Panel */}
      {!isPreviewMode && selectedWidget && (
        <div className="w-80 border-l border-border bg-backgroundSecondary">
          <WidgetSettings
            widget={selectedWidget}
            onUpdate={(settings) => updateWidget(selectedWidget.id, settings)}
            onClose={() => setSelectedWidgetId(null)}
            onDelete={() => deleteWidget(selectedWidget.id)}
          />
        </div>
      )}
    </div>
  );
}

// Separate component for widget content to avoid circular issues
import { Button as HeroButton } from '@heroui/react';
import {
  FiStar as IconStar,
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
  FiHome as FiHomeIcon,
  FiShield,
  FiAward,
  FiTarget,
  FiTrendingUp,
  FiZap,
} from 'react-icons/fi';

const iconMap: Record<string, React.ComponentType<{ size?: string | number; color?: string }>> = {
  FiStar: IconStar,
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
  FiHome: FiHomeIcon,
  FiShield,
  FiAward,
  FiTarget,
  FiTrendingUp,
  FiZap,
};

function WidgetContent({ widget }: { widget: Widget }) {
  switch (widget.type) {
    case 'heading': {
      const { text, tag, alignment, color, fontSize, fontWeight } = widget.settings;
      const Tag = tag as keyof JSX.IntrinsicElements;
      return (
        <Tag
          style={{
            textAlign: alignment,
            color: color || undefined,
            fontSize: fontSize || undefined,
            fontWeight: fontWeight || undefined,
          }}
          className="text-text"
        >
          {text || 'Heading'}
        </Tag>
      );
    }

    case 'text': {
      const { content, alignment, color, fontSize } = widget.settings;
      return (
        <div
          style={{
            textAlign: alignment,
            color: color || undefined,
            fontSize: fontSize || undefined,
          }}
          className="text-text prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: content || 'Add your text here...' }}
        />
      );
    }

    case 'image': {
      const { src, alt, width, height, alignment, borderRadius, objectFit } = widget.settings;
      const alignClass = { left: 'mr-auto', center: 'mx-auto', right: 'ml-auto' }[alignment as string] || 'mx-auto';

      return src ? (
        <img
          src={src}
          alt={alt || ''}
          style={{
            width: width || '100%',
            height: height || 'auto',
            borderRadius: borderRadius || '0',
            objectFit: objectFit || 'cover',
          }}
          className={`block ${alignClass}`}
        />
      ) : (
        <div
          style={{ width: width || '100%', height: height || '200px', borderRadius: borderRadius || '0' }}
          className={`bg-default-200 flex items-center justify-center ${alignClass}`}
        >
          <span className="text-default-400">No image selected</span>
        </div>
      );
    }

    case 'button': {
      const { text, variant, color, size, alignment, fullWidth } = widget.settings;
      const alignClass = { left: 'justify-start', center: 'justify-center', right: 'justify-end' }[alignment as string] || 'justify-start';

      return (
        <div className={`flex ${alignClass}`}>
          <HeroButton
            variant={variant}
            color={color}
            size={size}
            className={fullWidth ? 'w-full' : ''}
          >
            {text || 'Button'}
          </HeroButton>
        </div>
      );
    }

    case 'spacer': {
      return <div style={{ height: widget.settings.height || '40px' }} />;
    }

    case 'divider': {
      const { style, color, width, thickness, alignment } = widget.settings;
      const alignClass = { left: 'mr-auto', center: 'mx-auto', right: 'ml-auto' }[alignment as string] || 'mx-auto';

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

    case 'video': {
      const { src, type, aspectRatio, width } = widget.settings;

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
        const match = src.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        const videoId = match ? match[1] : null;
        if (!videoId) return <div className="text-danger">Invalid YouTube URL</div>;
        return (
          <div style={{ width: width || '100%', aspectRatio: aspectRatio?.replace(':', '/') || '16/9' }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="w-full h-full rounded-lg"
              allowFullScreen
            />
          </div>
        );
      }

      return <div className="text-default-500">Video preview</div>;
    }

    case 'icon': {
      const { icon, size, color, alignment } = widget.settings;
      const IconComponent = iconMap[icon] || IconStar;
      const alignClass = { left: 'justify-start', center: 'justify-center', right: 'justify-end' }[alignment as string] || 'justify-center';

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
          <ol style={{ color: textColor, fontSize }} className="list-decimal list-inside">
            {listItems.map((item: string, idx: number) => (
              <li key={idx} style={{ marginBottom: spacing || '8px' }}>{item}</li>
            ))}
          </ol>
        );
      }
      if (type === 'none') {
        return (
          <ul style={{ color: textColor, fontSize, listStyleType: 'none', paddingLeft: 0 }} className="list-none pl-0">
            {listItems.map((item: string, idx: number) => (
              <li key={idx} style={{ marginBottom: spacing || '8px' }}>{item}</li>
            ))}
          </ul>
        );
      }

      return (
        <ul style={{ color: textColor, fontSize }} className="list-disc list-inside">
          {listItems.map((item: string, idx: number) => (
            <li key={idx} style={{ marginBottom: spacing || '8px' }}>{item}</li>
          ))}
        </ul>
      );
    }

    case 'html': {
      return <div dangerouslySetInnerHTML={{ __html: widget.settings.code || '' }} />;
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

      const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' }[alignment as string] || 'text-left';
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
            <div className="mb-4 -mx-4 -mt-4">
              <img
                src={imageSrc}
                alt={imageAlt || title}
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
              className="mb-4 -mx-4 -mt-4 bg-default-200 flex items-center justify-center"
              style={{ height: imageHeight || '192px' }}
            >
              <span className="text-default-400 text-sm">Card Image</span>
            </div>
          )}
          <h3 className="text-lg font-semibold text-text mb-2">{title || 'Card Title'}</h3>
          <p className="text-default-600 text-sm mb-4">{description || 'Card description goes here.'}</p>
          {showButton && (
            <HeroButton
              size="sm"
              color={buttonColor || 'primary'}
              as="a"
              href={buttonLink || '#'}
            >
              {buttonText || 'Learn More'}
            </HeroButton>
          )}
        </div>
      );
    }

    default:
      return <div className="text-danger">Unknown widget type</div>;
  }
}
