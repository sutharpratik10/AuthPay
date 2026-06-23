'use client';

import React, { useState, useEffect } from 'react';
import GridLayout from 'react-grid-layout';
const ReactGridLayout = GridLayout as any;
import { WidgetLayout, saveDashboardLayout } from '@/app/protected/admin/dashboard/actions/analytics';
import { RevenueChart } from './charts/RevenueChart';
import { UserGrowthChart } from './charts/UserGrowthChart';
import { ChurnRateChart } from './charts/ChurnRateChart';
import { Button } from '@/components/ui/button';
import { Settings2, Save } from 'lucide-react';
import { WidgetSelector } from './WidgetSelector';
import { useToast } from "@/hooks/use-toast";

interface DashboardGridProps {
  userId: string;
  initialLayout: WidgetLayout[];
  availableWidgets: any[];
  initialData: {
    revenue: any[];
    growth: any[];
    churn: any[];
  };
}

export function DashboardGrid({ userId, initialLayout, availableWidgets, initialData }: DashboardGridProps) {
  const [layout, setLayout] = useState<WidgetLayout[]>(initialLayout);
  const [isEditMode, setIsEditMode] = useState(false);
  const [data, setData] = useState(initialData);
  const [width, setWidth] = useState(1200);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) setWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Handle SSE for real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/protected/admin/dashboard/stream');

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === 'revenue') setData(prev => ({ ...prev, revenue: parsed.payload }));
        if (parsed.type === 'user-growth') setData(prev => ({ ...prev, growth: parsed.payload }));
        if (parsed.type === 'churn') setData(prev => ({ ...prev, churn: parsed.payload }));
      } catch (e) {
        console.error('Error parsing SSE data:', e);
      }
    };

    return () => eventSource.close();
  }, []);

  const onLayoutChange = (newLayout: readonly any[]) => {
    if (!isEditMode) return;

    const updated = layout.map(item => {
      const changed = newLayout.find(l => l.i === item.id);
      if (changed) {
        return { ...item, x: changed.x, y: changed.y, w: changed.w, h: changed.h };
      }
      return item;
    });
    setLayout(updated);
  };

  const handleSave = async () => {
    try {
      await saveDashboardLayout(userId, layout);
      setIsEditMode(false);
      toast({
        title: "Layout saved",
        description: "Your dashboard layout has been updated successfully.",
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to save layout.",
        variant: "destructive"
      });
    }
  };

  const handleAddWidget = (widget: any) => {
    const newWidget: WidgetLayout = {
      id: `${widget.id}-${Date.now()}`,
      chartType: widget.id,
      x: 0, y: Infinity, w: widget.defaultW, h: widget.defaultH,
      dateRange: "30d",
      isVisible: true
    };
    setLayout([...layout, newWidget]);
    setIsEditMode(true);
  };

  const handleRemoveWidget = (id: string) => {
    setLayout(layout.map(l => l.id === id ? { ...l, isVisible: false } : l));
  };

  const renderWidget = (item: WidgetLayout) => {
    if (!item.isVisible) return null;

    switch (item.chartType) {
      case 'revenue':
        return <RevenueChart data={data.revenue} />;
      case 'user-growth':
        return <UserGrowthChart data={data.growth} />;
      case 'churn':
        return <ChurnRateChart data={data.churn} />;
      default:
        return <div className="p-4 border rounded shadow bg-card">Unknown Widget</div>;
    }
  };

  const isMobile = width < 768;

  const gridLayout = layout.map((l, index) => ({
    i: l.id,
    x: isMobile ? 0 : l.x,
    y: isMobile ? index * 10 : l.y, // Stack sequentially
    w: isMobile ? 12 : l.w,
    h: l.h
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Analytics Overview</h2>
        <div className="flex items-center gap-2">
          {!isMobile && (
            <>
              {isEditMode ? (
                <Button size="sm" onClick={handleSave} className="gap-2">
                  <Save className="h-4 w-4" /> Save Layout
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsEditMode(true)} className="gap-2">
                  <Settings2 className="h-4 w-4" /> Edit Layout
                </Button>
              )}
              {isEditMode && (
                <WidgetSelector
                  availableWidgets={availableWidgets}
                  activeWidgets={layout}
                  onAddWidget={handleAddWidget}
                />
              )}
            </>
          )}
        </div>
      </div>

      <div ref={containerRef} className="bg-muted/20 rounded-xl p-4 min-h-[500px]">
        {/* @ts-ignore */}
        <ReactGridLayout
          key={isMobile ? 'mobile' : 'desktop'}
          className="layout"
          layout={gridLayout}
          cols={12}
          rowHeight={100}
          width={width}
          onLayoutChange={onLayoutChange}
          isDraggable={isEditMode && !isMobile}
          isResizable={isEditMode && !isMobile}
          margin={[16, 16]}
        >
          {layout.filter(l => l.isVisible).map(item => (
            <div key={item.id} className="group relative bg-card rounded-xl shadow-sm border overflow-hidden">
              {isEditMode && (
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-6 w-6 rounded-full"
                    onClick={() => handleRemoveWidget(item.id)}
                  >
                    &times;
                  </Button>
                </div>
              )}
              {isEditMode && (
                <div className="absolute inset-0 z-0 bg-background/10 cursor-move" />
              )}
              <div className="relative z-0 h-full w-full pointer-events-auto">
                {renderWidget(item)}
              </div>
            </div>
          ))}
        </ReactGridLayout>
      </div>
    </div>
  );
}
