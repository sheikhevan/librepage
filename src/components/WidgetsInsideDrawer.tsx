import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Clock, Cloud, Newspaper, CheckSquare, Calendar, Plus } from "lucide-react";

interface WidgetsInsideDrawerProps {
    onWidgetAdd?: (widgetType: string) => void;
}

export default function WidgetsInsideDrawer({ onWidgetAdd }: WidgetsInsideDrawerProps) {
    const [selectedWidget, setSelectedWidget] = React.useState<string | null>(null);

    const widgets = [
        { title: "Clock", icon: Clock },
        { title: "Weather", icon: Cloud },
        { title: "News (WIP)", icon: Newspaper },
        { title: "Google Tasks", icon: CheckSquare },
        { title: "Google Calendar (WIP)", icon: Calendar }
    ];

    const handleWidgetClick = (title: string) => {
        setSelectedWidget(title);
    };

    const handleAddWidget = () => {
        if (selectedWidget && onWidgetAdd) {
            onWidgetAdd(selectedWidget);
        }
    };

    return (
        <div className="space-y-4">
            <Carousel className="w-full max-w-xs">
                <CarouselContent>
                    {widgets.map((widget, index) => {
                        const Icon = widget.icon;
                        const isSelected = selectedWidget === widget.title;

                        return (
                            <CarouselItem key={index}>
                                <div className="p-1">
                                    <Card
                                        onClick={() => handleWidgetClick(widget.title)}
                                        className={`cursor-pointer hover:shadow-lg transition-all duration-300 ${
                                            isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
                                        }`}
                                    >
                                        <CardContent className="flex flex-col aspect-square items-center justify-center p-6">
                                            <Icon size={48} className={`mb-4 ${isSelected ? 'text-blue-600' : 'text-blue-500'}`} />
                                            <span className="text-xl font-semibold">{widget.title}</span>
                                            <p className="text-sm text-gray-500 mt-2">Click to select</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </CarouselItem>
                        );
                    })}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>

            <div className="flex justify-center mt-4">
                <Button
                    onClick={handleAddWidget}
                    disabled={!selectedWidget}
                    className="w-full flex items-center justify-center gap-2"
                >
                    <Plus size={16} />
                    Add {selectedWidget || 'Widget'} to Dashboard
                </Button>
            </div>
        </div>
    );
}