import React from 'react';
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
    taskLists: {
        id: string;
        title: string;
    }[];
    selectedTaskList: string;
    onTaskListChange: (value: string) => void;
    viewAllTasks: boolean;
    onToggleViewAll: () => void;
    onTaskComplete: (taskId: string, listId: string, completed: boolean) => Promise<boolean>;
    onDeleteTasks?: (tasksToDelete: TaskItem[]) => Promise<boolean>;
}
declare const GetTasks: React.FC<TaskListProps>;
export default GetTasks;
