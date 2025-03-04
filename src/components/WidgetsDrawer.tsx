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

const WidgetsDrawer = React.forwardRef<
    HTMLButtonElement,
    React.ComponentPropsWithoutRef<typeof Button>
>((props, ref) => {
    return (
        <Drawer>
            <DrawerTrigger asChild>
                <Button
                    {...props}
                    ref={ref}
                    variant="outline"
                    className={`hidden ${props.className || ''}`}
                >
                    {props.children || "Open Drawer"}
                </Button>
            </DrawerTrigger>
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <WidgetsInsideDrawer />
                    </DrawerHeader>
                    <DrawerFooter>
                        <DrawerClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
})

WidgetsDrawer.displayName = "WidgetsDrawer"

export default WidgetsDrawer