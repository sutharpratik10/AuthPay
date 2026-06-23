'use client';

import React from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PlusCircle, CheckCircle2 } from "lucide-react";
import { WidgetLayout } from "@/app/protected/admin/dashboard/actions/analytics";

interface WidgetSelectorProps {
  availableWidgets: any[];
  activeWidgets: WidgetLayout[];
  onAddWidget: (widget: any) => void;
}

export function WidgetSelector({ availableWidgets, activeWidgets, onAddWidget }: WidgetSelectorProps) {
  const isWidgetActive = (id: string) => {
    return activeWidgets.some(w => w.chartType === id && w.isVisible);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Widget
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Available Widgets</SheetTitle>
          <SheetDescription>
            Select a widget to add to your dashboard.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-4">
          {availableWidgets.map((widget) => {
            const active = isWidgetActive(widget.id);
            return (
              <div 
                key={widget.id} 
                className={`flex items-center justify-between p-4 border rounded-lg ${active ? 'bg-muted/50' : 'bg-card'}`}
              >
                <div>
                  <h4 className="font-medium text-sm">{widget.label}</h4>
                  <p className="text-xs text-muted-foreground">{widget.description}</p>
                </div>
                {active ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => onAddWidget(widget)}>
                    Add
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
