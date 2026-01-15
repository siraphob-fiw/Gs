'use client';

import React, { useState, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { cn, Skeleton } from '@heroui/react';

// ---------- Types ----------
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ChartMetric {
  id: string;
  name: string;
  data: ChartDataPoint[];
  color?: string;
  unit?: string;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
}

export interface ChartProps {
  type: 'line' | 'bar' | 'area';
  metrics: ChartMetric[];
  title?: string;
  loading?: boolean;
  error?: string | null;
  className?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  onDataPointClick?: (point: ChartDataPoint, metric: ChartMetric) => void;
}

// ---------- Legend ----------
const ChartLegend = ({ metrics }: { metrics: ChartMetric[] }) => {
  const visibleMetrics = useMemo(
    () =>
      metrics.filter(
        (metric) => !metric.id.includes('_baseline') && !metric.name.includes('Baseline'),
      ),
    [metrics],
  );

  return (
    <div className="flex flex-wrap items-center gap-4 mt-4 justify-center">
      {visibleMetrics.map((metric) => (
        <div
          key={metric.id}
          className="flex items-center gap-2 p-1 rounded-md hover:bg-backgroundSecondary transition-colors"
        >
          <div
            className="w-3 h-3 rounded-full shadow-sm"
            style={{ backgroundColor: metric.color || '#3B82F6' }}
          />
          <span className="text-sm font-medium text-textSecondary">{metric.name}</span>
        </div>
      ))}
    </div>
  );
};

// ---------- Base Chart Component ----------
const BaseChart = ({
  metrics,
  height,
  showGrid,
  type,
  onDataPointClick,
}: {
  metrics: ChartMetric[];
  height: number;
  showGrid: boolean;
  type: 'line' | 'bar' | 'area';
  onDataPointClick?: (point: ChartDataPoint, metric: ChartMetric) => void;
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    metric: ChartMetric;
    point: ChartDataPoint;
  } | null>(null);

  // Resize handling
  useLayoutEffect(() => {
    let observer: ResizeObserver | null = null;
    const handleResize = () => {
      if (wrapperRef.current) setContainerWidth(wrapperRef.current.offsetWidth);
    };
    handleResize();

    if (typeof window !== 'undefined') {
      if ('ResizeObserver' in window) {
        observer = new window.ResizeObserver(handleResize);
        if (wrapperRef.current) observer.observe(wrapperRef.current);
      } else {
        (window as Window).addEventListener('resize', handleResize);
      }
    }
    return () => {
      if (observer) observer.disconnect();
      else (window as Window).removeEventListener('resize', handleResize);
    };
  }, []);

  const svgWidth = containerWidth || 500;
  const padding = { top: 25, right: 30, bottom: 55, left: 65 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Normalize dates
  const normalizeDate = useCallback((dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toISOString().split('T')[0];
    } catch {
      return dateStr;
    }
  }, []);

  // Get all unique dates
  const allDates = useMemo(() => {
    const dates = new Set<string>();
    for (const metric of metrics) {
      for (const pt of metric.data) {
        dates.add(normalizeDate(pt.date));
      }
    }
    return Array.from(dates).sort((a, b) => +new Date(a) - +new Date(b));
  }, [metrics, normalizeDate]);

  const numDates = allDates.length;

  // Calculate max value
  const maxValue = useMemo(() => {
    let max = 0;
    for (const m of metrics) {
      for (const p of m.data) {
        if (p.value > max) max = p.value;
      }
    }
    return max > 0 ? max * 1.1 : 1;
  }, [metrics]);

  const getX = useCallback(
    (i: number) => {
      if (numDates <= 1) {
        return padding.left + chartWidth / 2;
      }
      // Ensure proper spacing even for sparse dates
      return padding.left + (i / Math.max(1, numDates - 1)) * chartWidth;
    },
    [numDates, chartWidth, padding.left],
  );

  const getY = useCallback(
    (val: number) => padding.top + chartHeight - (val / maxValue) * chartHeight,
    [chartHeight, maxValue, padding.top],
  );

  // Grid lines and axis lines
  const gridLines = useMemo(() => {
    if (!showGrid) {
      // Still show axis lines even if grid is disabled
      return (
        <>
          {/* X-axis line */}
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={svgWidth - padding.right}
            y2={padding.top + chartHeight}
            stroke="#D1D5DB"
            strokeWidth={1.5}
          />
          {/* Y-axis line */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + chartHeight}
            stroke="#D1D5DB"
            strokeWidth={1.5}
          />
        </>
      );
    }
    const lines: JSX.Element[] = [];
    // Horizontal lines
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (i / 4) * chartHeight;
      const isAxisLine = i === 4; // Bottom line is the X-axis
      lines.push(
        <line
          key={`h-${i}`}
          x1={padding.left}
          y1={y}
          x2={svgWidth - padding.right}
          y2={y}
          stroke={isAxisLine ? '#D1D5DB' : '#E5E7EB'}
          strokeWidth={isAxisLine ? 1.5 : 1}
          opacity={isAxisLine ? 1 : 0.5}
        />,
      );
    }
    // Vertical lines - show fewer lines if there are many dates
    const maxVerticalLines = Math.floor(chartWidth / 60);
    const verticalStep = Math.max(1, Math.ceil(numDates / maxVerticalLines));
    for (let i = 0; i < numDates; i += verticalStep) {
      const x = getX(i);
      const isAxisLine = i === 0; // First line is the Y-axis
      lines.push(
        <line
          key={`v-${i}`}
          x1={x}
          y1={padding.top}
          x2={x}
          y2={padding.top + chartHeight}
          stroke={isAxisLine ? '#D1D5DB' : '#E5E7EB'}
          strokeWidth={isAxisLine ? 1.5 : 1}
          opacity={isAxisLine ? 1 : 0.4}
        />,
      );
    }
    return lines;
  }, [showGrid, chartHeight, numDates, getX, padding, svgWidth, chartWidth]);

  // Y axis labels
  const yAxisLabels = useMemo(
    () =>
      Array.from({ length: 5 }).map((_, i) => {
        const value = (maxValue / 4) * (4 - i);
        const y = padding.top + (i / 4) * chartHeight;
        return (
          <text
            key={i}
            x={padding.left - 15}
            y={y + 4}
            textAnchor="end"
            fontSize="12"
            fill="#6B7280"
            fontWeight="500"
            style={{ userSelect: 'none' }}
          >
            {Math.round(value)}
          </text>
        );
      }),
    [maxValue, chartHeight, padding.top, padding.left],
  );

  // X axis labels - show fewer labels if there are many dates to prevent overlap
  const xAxisLabels = useMemo(() => {
    const maxLabels = Math.floor(chartWidth / 80); // Show max 1 label per 80px
    const step = Math.max(1, Math.ceil(allDates.length / maxLabels));

    return allDates
      .map((date, idx) => {
        // Only show labels at intervals to prevent overlap
        if (idx % step !== 0 && idx !== allDates.length - 1) {
          return null;
        }
        return (
          <text
            key={idx}
            x={getX(idx)}
            y={padding.top + chartHeight + 22}
            textAnchor="middle"
            fontSize="12"
            fill="#6B7280"
            fontWeight="500"
            style={{ userSelect: 'none' }}
          >
            {new Date(date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </text>
        );
      })
      .filter(Boolean);
  }, [allDates, getX, chartHeight, padding.top, chartWidth]);

  // Render chart elements based on type
  const chartElements = useMemo(() => {
    return metrics.map((metric, metricIndex) => {
      const color = metric.color || `hsl(${metricIndex * 60}, 70%, 50%)`;
      const points = allDates.map((date, idx) => {
        const normalizedDate = normalizeDate(date);
        const dataPoint = metric.data.find((d) => normalizeDate(d.date) === normalizedDate);
        const value = dataPoint?.value ?? 0;
        return {
          x: getX(idx),
          y: getY(value),
          value,
          date,
          dataPoint: dataPoint || { date, value: 0 },
        };
      });

      const validPoints = points.filter((p) => p.value > 0);

      if (type === 'line' || type === 'area') {
        const pathData =
          validPoints.length > 0
            ? validPoints
                .map((p, idx) => (idx === 0 ? `M${p.x} ${p.y}` : `L${p.x} ${p.y}`))
                .join(' ')
            : '';

        return (
          <g key={metric.id}>
            {pathData && type === 'area' && (
              <path
                d={`${pathData} L${validPoints[validPoints.length - 1].x} ${
                  padding.top + chartHeight
                } L${validPoints[0].x} ${padding.top + chartHeight} Z`}
                fill={color}
                fillOpacity={0.2}
              />
            )}
            {pathData && (
              <path
                d={pathData}
                fill="none"
                stroke={color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={
                  metric.lineStyle === 'dashed'
                    ? '8,4'
                    : metric.lineStyle === 'dotted'
                      ? '2,4'
                      : 'none'
                }
                style={{
                  transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                  filter:
                    metric.lineStyle === 'solid' || !metric.lineStyle
                      ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.05))'
                      : 'none',
                }}
              />
            )}
            {/* Only show data points for non-baseline metrics */}
            {!metric.id.includes('_baseline') &&
              !metric.name.includes('Baseline') &&
              validPoints.map((point, idx) => (
                <g key={idx}>
                  {/* Hover area - larger invisible circle for better interaction */}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={8}
                    fill="transparent"
                    style={{
                      cursor: onDataPointClick ? 'pointer' : 'default',
                    }}
                    onMouseEnter={() =>
                      setHoveredPoint({
                        x: point.x,
                        y: point.y,
                        metric,
                        point: point.dataPoint,
                      })
                    }
                    onMouseLeave={() => setHoveredPoint(null)}
                    onClick={() => onDataPointClick?.(point.dataPoint, metric)}
                  />
                  {/* Visible data point */}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={4}
                    fill={color}
                    stroke="white"
                    strokeWidth={2}
                    style={{
                      transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                      cursor: onDataPointClick ? 'pointer' : 'default',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.setAttribute('r', '6');
                      setHoveredPoint({
                        x: point.x,
                        y: point.y,
                        metric,
                        point: point.dataPoint,
                      });
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.setAttribute('r', '4');
                      setHoveredPoint(null);
                    }}
                    onClick={() => onDataPointClick?.(point.dataPoint, metric)}
                  >
                    <title>{`${metric.name}: ${point.value}${metric.unit ?? ''}`}</title>
                  </circle>
                </g>
              ))}
          </g>
        );
      } else if (type === 'bar') {
        const barWidth = Math.max(
          8,
          chartWidth / (numDates * metrics.length + metrics.length * 1.5),
        );
        const barSpacing = barWidth * 0.1;
        return (
          <g key={metric.id}>
            {validPoints.map((point, idx) => {
              const barHeight = padding.top + chartHeight - point.y;
              const totalBarWidth = barWidth * metrics.length + barSpacing * (metrics.length - 1);
              const barX = point.x - totalBarWidth / 2 + metricIndex * (barWidth + barSpacing);
              return (
                <g key={idx}>
                  {/* Hover area */}
                  <rect
                    x={barX - 2}
                    y={padding.top}
                    width={barWidth + 4}
                    height={chartHeight}
                    fill="transparent"
                    style={{
                      cursor: onDataPointClick ? 'pointer' : 'default',
                    }}
                    onMouseEnter={() =>
                      setHoveredPoint({
                        x: point.x,
                        y: point.y - 20,
                        metric,
                        point: point.dataPoint,
                      })
                    }
                    onMouseLeave={() => setHoveredPoint(null)}
                    onClick={() => onDataPointClick?.(point.dataPoint, metric)}
                  />
                  {/* Bar */}
                  <rect
                    x={barX}
                    y={point.y}
                    width={barWidth}
                    height={barHeight}
                    fill={color}
                    rx={2}
                    style={{
                      transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                      cursor: onDataPointClick ? 'pointer' : 'default',
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.setAttribute('opacity', '0.8');
                      setHoveredPoint({
                        x: point.x,
                        y: point.y - 20,
                        metric,
                        point: point.dataPoint,
                      });
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.setAttribute('opacity', '1');
                      setHoveredPoint(null);
                    }}
                    onClick={() => onDataPointClick?.(point.dataPoint, metric)}
                  >
                    <title>{`${metric.name}: ${point.value}${metric.unit ?? ''}`}</title>
                  </rect>
                </g>
              );
            })}
          </g>
        );
      }
      return null;
    });
  }, [
    metrics,
    allDates,
    getX,
    getY,
    type,
    chartHeight,
    padding.top,
    chartWidth,
    numDates,
    normalizeDate,
    onDataPointClick,
  ]);

  return (
    <div ref={wrapperRef} className="w-full relative">
      <svg width={svgWidth} height={height} style={{ width: '100%', display: 'block' }}>
        {gridLines}
        {chartElements}
        {yAxisLabels}
        {xAxisLabels}
      </svg>
      {hoveredPoint && (
        <div
          className="absolute bg-background border border-border rounded-lg shadow-xl p-3 pointer-events-none z-10 whitespace-nowrap backdrop-blur-sm"
          style={{
            left: `${Math.min(Math.max(hoveredPoint.x, 100), svgWidth - 100)}px`,
            top: `${Math.max(hoveredPoint.y - 10, 10)}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="text-sm font-semibold textSecondary mb-1">{hoveredPoint.metric.name}</div>
          <div className="text-base font-bold textSecondary mb-1">
            {hoveredPoint.point.value}
            {hoveredPoint.metric.unit ? (
              <span className="text-sm font-normal ml-1 text-textMuted">
                {hoveredPoint.metric.unit}
              </span>
            ) : null}
          </div>
          <div className="text-xs text-textMuted border-t border-border pt-1 mt-1">
            {hoveredPoint.metric.name.includes('ago') && hoveredPoint.point.label
              ? new Date(hoveredPoint.point.label).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : new Date(hoveredPoint.point.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- Main Component ----------
export const Chart = ({
  type,
  metrics,
  title,
  loading = false,
  error = null,
  className,
  height = 400,
  showLegend = true,
  showGrid = true,
  showTooltip = true,
  xAxisLabel,
  yAxisLabel,
  onDataPointClick,
}: ChartProps) => {
  if (error) {
    return (
      <div className={cn('text-center py-8', className)}>
        <div className="text-error mb-2">
          <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium textSecondary mb-1">Failed to load chart data</h3>
        <p className="text-Secondary">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cn('bg-background rounded-lg border border-border p-6', className)}>
        <Skeleton className="w-full" style={{ height }} />
      </div>
    );
  }

  if (!metrics.length) {
    return (
      <div
        className={cn('bg-background rounded-lg border border-border p-6 text-center', className)}
      >
        <div className="text-textMuted mb-2">
          <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-text mb-1">No chart data available</h3>
        <p className="text-textMuted">Chart data will appear here once metrics are available.</p>
      </div>
    );
  }

  return (
    <div className={cn('bg-background rounded-lg border border-border p-6 shadow-sm', className)}>
      {title && (
        <div className="mb-6 pb-4 border-b border-border">
          <h3 className="text-xl font-semibold textSecondary capitalize">{title}</h3>
          {yAxisLabel && <p className="text-sm text-textMuted mt-1.5">{yAxisLabel}</p>}
        </div>
      )}
      <div className="mb-4 w-full">
        <BaseChart
          metrics={metrics}
          height={height - (title ? 140 : 100)}
          showGrid={showGrid}
          type={type}
          onDataPointClick={onDataPointClick}
        />
      </div>
      {xAxisLabel && (
        <p className="text-sm text-textMuted text-center mb-3 font-medium">{xAxisLabel}</p>
      )}
      {showLegend && metrics.length > 0 && <ChartLegend metrics={metrics} />}
    </div>
  );
};

export default Chart;
