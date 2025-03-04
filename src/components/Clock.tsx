import { useState, useEffect } from "react";
import { Clock as ClockIcon } from "lucide-react";

export default function Clock() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const intervalId = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');

    return (
        <div className="flex bg-white flex-col items-center justify-center h-full">
            <ClockIcon size={48} className="mb-4 text-blue-500" />
            <div className="text-6xl font-semibold">
                {hours}:{minutes}:{seconds}
            </div>
            <div className="text-lg text-gray-500 mt-2">
                {time.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
        </div>
    );
}