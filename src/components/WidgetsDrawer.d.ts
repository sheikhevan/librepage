import * as React from "react";
import { Button } from "@/components/ui/button";
interface WidgetsDrawerProps extends React.ComponentPropsWithoutRef<typeof Button> {
    onWidgetAdd?: (widgetType: string) => void;
}
declare const WidgetsDrawer: React.ForwardRefExoticComponent<WidgetsDrawerProps & React.RefAttributes<HTMLButtonElement>>;
export default WidgetsDrawer;
