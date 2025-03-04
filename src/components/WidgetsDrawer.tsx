import * as React from "react"

import { Button } from "@/components/ui/button"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import WidgetsInsideDrawer from "@/components/WidgetsInsideDrawer.tsx";

interface WidgetsDrawerProps extends React.ComponentPropsWithoutRef<typeof Button> {
    onWidgetAdd?: (widgetType: string) => void;
}

const WidgetsDrawer = React.forwardRef<
    HTMLButtonElement,
    WidgetsDrawerProps
>((props, ref) => {
    const { onWidgetAdd, ...buttonProps } = props;

    return (
        <Drawer>
            <DrawerTrigger asChild>
                <Button
                    {...buttonProps}
                    ref={ref}
                    variant="outline"
                    className={`hidden ${buttonProps.className || ''}`}
                >
                    {buttonProps.children || "Open Drawer"}
                </Button>
            </DrawerTrigger>
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle>Widget Gallery</DrawerTitle>
                        <DrawerDescription>Select a widget and click the Add button to add it to your dashboard</DrawerDescription>
                        <WidgetsInsideDrawer onWidgetAdd={onWidgetAdd} />
                    </DrawerHeader>
                    <DrawerFooter>
                        <DrawerClose asChild>
                            <Button variant="outline">Close</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
})

WidgetsDrawer.displayName = "WidgetsDrawer"

export default WidgetsDrawer