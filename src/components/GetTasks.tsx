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
import { Checkbox } from "@/components/ui/checkbox";
import { LucideTrash2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
    onTaskComplete: (taskId: string, listId: string, completed: boolean) => Promise<boolean>;
    onDeleteTasks?: (tasksToDelete: TaskItem[]) => Promise<boolean>; // Prop for deleting tasks
}

const GetTasks: React.FC<TaskListProps> = ({
                                               allTasks,
                                               taskLists,
                                               selectedTaskList,
                                               onTaskListChange,
                                               viewAllTasks,
                                               onToggleViewAll,
                                               onTaskComplete,
                                               onDeleteTasks
                                           }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString();
    };

    const displayedTasks = viewAllTasks
        ? allTasks
        : allTasks.filter(task => task.listId === selectedTaskList);

    const completedTasks = displayedTasks.filter(task => !!task.completed);

    const hasCompletedTasks = completedTasks.length > 0;

    const handleSelectChange = (value: string) => {
        onTaskListChange(value);
    };

    const handleCheckboxChange = async (taskId: string, listId: string, isCompleted: boolean) => {
        try {
            // @ts-ignore
            const success = await onTaskComplete(taskId, listId, !isCompleted);
        } catch (error) {
            console.error("Error updating task completion status:", error);
        }
    };

    const deleteCompleted = async () => {
        if (!onDeleteTasks) {
            console.error("Delete functionality not implemented");
            return;
        }

        try {
            const success = await onDeleteTasks(completedTasks);
            if (success) {
                console.log(`Successfully deleted ${completedTasks.length} completed tasks`);
            } else {
                console.error("Failed to delete completed tasks");
            }
        } catch (error) {
            console.error("Error deleting completed tasks:", error);
        }

        setShowDeleteConfirm(false);
    };

    return (
        <Card className="w-full">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="destructive"
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={!hasCompletedTasks}
                        >
                            <LucideTrash2 className="mr-2" />
                            Delete Completed
                        </Button>

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
                                {displayedTasks.map(task => {
                                    const isCompleted = !!task.completed;

                                    return (
                                        <div
                                            key={`${task.listId}-${task.id}`}
                                            className={`p-3 hover:bg-gray-100 rounded-md transition-colors duration-150 ${isCompleted ? 'opacity-60' : ''}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <Checkbox
                                                    id={`task-${task.id}`}
                                                    checked={isCompleted}
                                                    onCheckedChange={() => handleCheckboxChange(task.id, task.listId || '', isCompleted)}
                                                    className="mt-1"
                                                />
                                                <div className="flex flex-col gap-1">
                                                    <h3 className={`font-medium ${isCompleted ? 'line-through text-gray-500' : ''}`}>
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
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    ) : (
                        <p className="text-gray-500 italic py-4">No tasks found.</p>
                    )}
                </div>
            </CardContent>

            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Completed Tasks</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete {completedTasks.length} completed {completedTasks.length === 1 ? 'task' : 'tasks'}.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteCompleted}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
};

export default GetTasks;