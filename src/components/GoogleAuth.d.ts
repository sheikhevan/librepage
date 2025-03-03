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
interface GoogleAuthComponentProps {
    setIsAuthorized: React.Dispatch<React.SetStateAction<boolean>>;
    setAllTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>;
    setTaskLists: React.Dispatch<React.SetStateAction<{
        id: string;
        title: string;
    }[]>>;
    setSelectedTaskList: React.Dispatch<React.SetStateAction<string>>;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}
declare const GoogleAuthComponent: React.FC<GoogleAuthComponentProps>;
export default GoogleAuthComponent;
