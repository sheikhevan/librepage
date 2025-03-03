import React from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface TaskItem {
    id: string;
    title: string;
    due?: string;
    notes?: string;
    completed?: string;
    listId?: string;
    listName?: string;
}

interface TaskListProps {
    allTasks: TaskItem[];
    taskLists: {id: string, title: string}[];
    selectedTaskList: string;
    onTaskListChange: (value: string) => void;
    viewAllTasks: boolean;
    onToggleViewAll: () => void;
}

const GetTasks: React.FC<TaskListProps> = ({
                                               allTasks,
                                               taskLists,
                                               selectedTaskList,
                                               onTaskListChange,
                                               viewAllTasks,
                                               onToggleViewAll
                                           }) => {
    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString();
    };

    const displayedTasks = viewAllTasks
        ? allTasks
        : allTasks.filter(task => task.listId === selectedTaskList);

    const handleSelectChange = (value: string) => {
        onTaskListChange(value);
    };

    return (
        <Card className="w-full">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant={viewAllTasks ? "default" : "outline"}
                            onClick={onToggleViewAll}
                        >
                            {viewAllTasks ? 'Viewing All Tasks' : 'View All Tasks'}
                        </Button>

                        {!viewAllTasks && taskLists.length > 0 && (
                            <Select value={selectedTaskList} onValueChange={handleSelectChange}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select a list" />
                                </SelectTrigger>
                                <SelectContent>
                                    {taskLists.map(list => (
                                        <SelectItem key={list.id} value={list.id}>
                                            {list.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="task-list">
                    <CardTitle className="text-xl font-semibold mb-4">
                        {viewAllTasks ? 'All Tasks' : `Tasks in ${taskLists.find(list => list.id === selectedTaskList)?.title || ''}`}
                    </CardTitle>

                    {displayedTasks.length > 0 ? (
                        <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-1">
                                {displayedTasks.map(task => (
                                    <React.Fragment key={`${task.listId}-${task.id}`}>
                                        <div className={`p-3 hover:bg-gray-100 rounded-md transition-colors duration-150 ${task.completed ? 'opacity-60' : ''}`}>
                                            <div className="flex flex-col gap-1">
                                                <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                                                    {task.title}
                                                </h3>

                                                {viewAllTasks && task.listName && (
                                                    <Badge variant="outline" className="w-fit">
                                                        {task.listName}
                                                    </Badge>
                                                )}

                                                {task.due && (
                                                    <p className="text-sm text-gray-600">Due: {formatDate(task.due)}</p>
                                                )}

                                                {task.notes && (
                                                    <p className="text-sm mt-1 text-gray-700">{task.notes}</p>
                                                )}
                                            </div>
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                        </ScrollArea>
                    ) : (
                        <p className="text-gray-500 italic py-4">No tasks found.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default GetTasks;