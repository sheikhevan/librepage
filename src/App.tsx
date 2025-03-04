<<<<<<< HEAD
import React, { useState, useEffect, useRef } from 'react';
import GetTasks from '@/components/GetTasks';
import GoogleAuthComponent from '@/components/GoogleAuth';
import { createSwapy, Swapy } from 'swapy';
import WidgetsDrawer from '@/components/WidgetsDrawer';
import { Button } from "@/components/ui/button";
import { LayoutGrid, Cloud, Newspaper, Calendar } from "lucide-react";
import {Skeleton} from "@/components/ui/skeleton.tsx";
import GetClock from "@/components/Clock.tsx";
=======
import React, { useState, useEffect } from 'react';
import GetTasks from '@/components/GetTasks.tsx';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
>>>>>>> parent of 79d7c23 (PLEASE BE PROUD OF ME)


interface TaskItem {
  id: string;
  title: string;
  due?: string;
  notes?: string;
  completed?: string;
  listId?: string;
  listName?: string;
}

const App: React.FC = () => {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [allTasks, setAllTasks] = useState<TaskItem[]>([]);
  const [taskLists, setTaskLists] = useState<{id: string, title: string}[]>([]);
  const [selectedTaskList, setSelectedTaskList] = useState<string>('');
  const [viewAllTasks, setViewAllTasks] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [widgetTypes, setWidgetTypes] = useState<Record<string, string>>({
    widget1: "Google Tasks",
    widget2: "Widget",
    widget3: "Widget",
    widget4: "Widget",
    widget5: "Widget",
    widget6: "Widget"
  });

  const swapy = useRef<Swapy | null>(null);
  const container = useRef<HTMLDivElement | null>(null);
  const drawerTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isAuthorized && !isLoading && container.current) {
      const timer = setTimeout(() => {
        if (swapy.current) {
          swapy.current.destroy();
        }

        if (container.current) {
          swapy.current = createSwapy(container.current);
        }

      }, 100);

      return () => {
        clearTimeout(timer);
        swapy.current?.destroy();
      };
    }
  }, [isAuthorized, isLoading]);

  const handleTaskListChange = (value: string) => {
    setSelectedTaskList(value);
  };

  const handleToggleViewAll = () => {
    setViewAllTasks(prev => !prev);
  };

<<<<<<< HEAD
  const handleTaskComplete = async (taskId: string, listId: string, completed: boolean): Promise<boolean> => {
    try {
      const response = await (window as any).gapi.client.tasks.tasks.get({
        tasklist: listId,
        task: taskId
      });

      const taskData = response.result;

      if (completed) {
        taskData.status = 'completed';
        taskData.completed = new Date().toISOString();
      } else {
        taskData.status = 'needsAction';
        delete taskData.completed;
      }

      await (window as any).gapi.client.tasks.tasks.update({
        tasklist: listId,
        task: taskId,
        resource: taskData
      });

      setAllTasks(prevTasks =>
          prevTasks.map(task => {
            if (task.id === taskId && task.listId === listId) {
              return {
                ...task,
                completed: completed ? new Date().toISOString() : undefined
              };
            }
            return task;
          })
      );

      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      return false;
    }
  };

  const handleDeleteTasks = async (tasksToDelete: TaskItem[]): Promise<boolean> => {
    try {
      const tasksByList: Record<string, string[]> = {};
=======
  return (
      <div className="p-4 max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Google Tasks API Quickstart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              {(isGapiLoaded && isGisLoaded) && (
                  <>
                    {!isAuthorized ? (
                        <div>
                          <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Authentication Required</AlertDialogTitle>
                                <AlertDialogDescription>
                                  To integrate Librepage with Google services, sign in with Google.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <Button onClick={handleAuthClick}>Sign in with Google</Button>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                    ) : (
                        <Button
                            variant="destructive"
                            onClick={handleSignoutClick}
                        >
                          Sign Out
                        </Button>
                    )}
                  </>
              )}
            </div>
          </CardContent>
        </Card>
>>>>>>> parent of 79d7c23 (PLEASE BE PROUD OF ME)

      tasksToDelete.forEach(task => {
        if (task.listId) {
          if (!tasksByList[task.listId]) {
            tasksByList[task.listId] = [];
          }
          tasksByList[task.listId].push(task.id);
        }
      });

      const deletePromises = Object.entries(tasksByList).map(async ([listId, taskIds]) => {
        const deletePromises = taskIds.map(taskId =>
            (window as any).gapi.client.tasks.tasks.delete({
              tasklist: listId,
              task: taskId
            })
        );

        return Promise.all(deletePromises);
      });

      await Promise.all(deletePromises);

      setAllTasks(prevTasks =>
          prevTasks.filter(task =>
              !tasksToDelete.some(deleteTask =>
                  deleteTask.id === task.id && deleteTask.listId === task.listId
              )
          )
      );

      return true;
    } catch (error) {
      console.error('Error deleting tasks:', error);
      return false;
    }
  };

  const openDrawer = () => {
    if (drawerTriggerRef.current) {
      drawerTriggerRef.current.click();
    }
  };

  const handleAddWidget = (widgetType: string) => {
    const emptyWidgetId = Object.entries(widgetTypes)
        // @ts-ignore
        .find(([id, type]) => type === "Widget")?.[0];

    if (emptyWidgetId) {
      setWidgetTypes(prev => ({
        ...prev,
        [emptyWidgetId]: widgetType
      }));

      if (drawerTriggerRef.current) {
        drawerTriggerRef.current.click();
      }
    } else {
      alert("No empty widgets available. Please remove a widget first.");
    }
  };

  const renderWidgetContent = (widgetId: string) => {
    const widgetType = widgetTypes[widgetId] || "Widget";

    switch (widgetType) {
      case "Google Tasks":
        return (
            <GetTasks
                allTasks={allTasks}
                taskLists={taskLists}
                selectedTaskList={selectedTaskList}
                onTaskListChange={handleTaskListChange}
                viewAllTasks={viewAllTasks}
                onToggleViewAll={handleToggleViewAll}
<<<<<<< HEAD
                onTaskComplete={handleTaskComplete}
                onDeleteTasks={handleDeleteTasks}
=======
>>>>>>> parent of 79d7c23 (PLEASE BE PROUD OF ME)
            />
        );
      case "Clock":
        return (
            <GetClock />
        );
      case "Weather":
        return (
            <div className="flex flex-col items-center justify-center h-full">
              <Cloud size={48} className="mb-4 text-blue-500" />
              <div className="text-2xl font-semibold">Weather</div>
              <div className="text-gray-500">Weather information would appear here</div>
            </div>
        );
      case "News (WIP)":
        return (
            <div className="flex flex-col items-center justify-center h-full">
              <Newspaper size={48} className="mb-4 text-blue-500" />
              <div className="text-2xl font-semibold">News Headlines</div>
              <div className="text-gray-500">Latest news would appear here</div>
            </div>
        );
      case "Google Calendar (WIP)":
        return (
            <div className="flex flex-col items-center justify-center h-full">
              <Calendar size={48} className="mb-4 text-blue-500" />
              <div className="text-2xl font-semibold">Calendar</div>
              <div className="text-gray-500">Calendar events would appear here</div>
            </div>
        );
      default:
        return (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500 mb-2">Empty Widget</p>
                <p className="text-sm text-gray-400">Add a widget from the Widget Gallery</p>
              </div>
            </div>
        );
    }
  };

  const items = Array.from({ length: 6 });

  return (
      <div className="w-full h-screen p-4 flex flex-col relative">
        <GoogleAuthComponent
            setIsAuthorized={setIsAuthorized}
            setAllTasks={setAllTasks}
            setTaskLists={setTaskLists}
            setSelectedTaskList={setSelectedTaskList}
            setIsLoading={setIsLoading}
        />

        {isLoading && (
            <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-4 overflow-hidden">
              {items.map((_, index) => (
                  <Skeleton key={index} className="overflow-auto rounded-lg" />
              ))}
            </div>
        )}

        {isAuthorized && !isLoading && (
            <div ref={container} className="flex-1 grid grid-cols-3 grid-rows-2 gap-4 overflow-hidden">
              <div data-swapy-slot="zone1" className="overflow-auto border-2 border-dashed border-gray-200 rounded-lg">
                <div data-swapy-item="widget1" className="h-full cursor-move hover:z-50">
                  <div className="p-2 h-full overflow-auto">
                    {renderWidgetContent("widget1")}
                  </div>
                </div>
              </div>

              <div data-swapy-slot="zone2" className="overflow-auto border-2 border-dashed border-gray-200 rounded-lg">
                <div data-swapy-item="widget2" className="h-full cursor-move">
                  <div className="p-4 h-full bg-gray-50">
                    {renderWidgetContent("widget2")}
                  </div>
                </div>
              </div>

              <div data-swapy-slot="zone3" className="overflow-auto border-2 border-dashed border-gray-200 rounded-lg">
                <div data-swapy-item="widget3" className="h-full cursor-move">
                  <div className="p-4 h-full bg-gray-50">
                    {renderWidgetContent("widget3")}
                  </div>
                </div>
              </div>

              <div data-swapy-slot="zone4" className="overflow-auto border-2 border-dashed border-gray-200 rounded-lg">
                <div data-swapy-item="widget4" className="h-full cursor-move">
                  <div className="p-4 h-full bg-gray-50">
                    {renderWidgetContent("widget4")}
                  </div>
                </div>
              </div>

              <div data-swapy-slot="zone5" className="overflow-auto border-2 border-dashed border-gray-200 rounded-lg">
                <div data-swapy-item="widget5" className="h-full cursor-move">
                  <div className="p-4 h-full bg-gray-50">
                    {renderWidgetContent("widget5")}
                  </div>
                </div>
              </div>

              <div data-swapy-slot="zone6" className="overflow-auto border-2 border-dashed border-gray-200 rounded-lg">
                <div data-swapy-item="widget6" className="h-full cursor-move">
                  <div className="p-4 h-full bg-gray-50">
                    {renderWidgetContent("widget6")}
                  </div>
                </div>
              </div>
            </div>
        )}

        {isAuthorized && !isLoading && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center">
              <Button
                  onClick={openDrawer}
                  className="rounded-full shadow-lg px-6 flex items-center gap-2"
              >
                <LayoutGrid size={18} />
                Widgets
              </Button>
            </div>
        )}

        <div className="hidden">
          <WidgetsDrawer
              ref={drawerTriggerRef}
              onWidgetAdd={handleAddWidget}
          />
        </div>
      </div>
  );
};

export default App;