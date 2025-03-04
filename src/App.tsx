import React, { useState, useEffect, useRef } from 'react';
import GetTasks from '@/components/GetTasks';
import GoogleAuthComponent from '@/components/GoogleAuth';
import { createSwapy, Swapy } from 'swapy';
import WidgetsDrawer from '@/components/WidgetsDrawer';
import { Button } from "@/components/ui/button";
import { LayoutGrid, Clock, Cloud, Newspaper, CheckSquare, Calendar } from "lucide-react";

interface TaskItem {
  id: string;
  title: string;
  due?: string;
  notes?: string;
  completed?: string;
  listId?: string;
  listName?: string;
}

interface LayoutState {
  [key: string]: string;
}

const LAYOUT_STORAGE_KEY = 'taskDashboardLayout';

const App: React.FC = () => {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [allTasks, setAllTasks] = useState<TaskItem[]>([]);
  const [taskLists, setTaskLists] = useState<{id: string, title: string}[]>([]);
  const [selectedTaskList, setSelectedTaskList] = useState<string>('');
  const [viewAllTasks, setViewAllTasks] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Track widget types for each widget slot
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

  // Load widget types from localStorage on initial load
  useEffect(() => {
    try {
      const savedWidgetTypes = localStorage.getItem('widgetTypes');
      if (savedWidgetTypes) {
        setWidgetTypes(JSON.parse(savedWidgetTypes));
      }
    } catch (error) {
      console.error('Error loading widget types from localStorage:', error);
    }
  }, []);

  // Save widget types to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('widgetTypes', JSON.stringify(widgetTypes));
    } catch (error) {
      console.error('Error saving widget types to localStorage:', error);
    }
  }, [widgetTypes]);

  const loadLayout = (): LayoutState | null => {
    try {
      const savedLayout = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (savedLayout) {
        return JSON.parse(savedLayout);
      }
    } catch (error) {
      console.error('Error loading layout from localStorage:', error);
    }
    return null;
  };

  const saveLayout = (layout: LayoutState) => {
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
    } catch (error) {
      console.error('Error saving layout to localStorage:', error);
    }
  };

  // Setup swapy and handle drop events
  useEffect(() => {
    if (isAuthorized && !isLoading && container.current) {
      const timer = setTimeout(() => {
        if (swapy.current) {
          swapy.current.destroy();
        }

        if (container.current) {
          // @ts-ignore - Ignoring the type error for createSwapy
          swapy.current = createSwapy(container.current);
        }

        const savedLayout = loadLayout();

        if (savedLayout && swapy.current) {
          Object.entries(savedLayout).forEach(([widgetId, zoneId]) => {
            try {
              const widgetElement = document.querySelector(`[data-swapy-item="${widgetId}"]`);
              const zoneElement = document.querySelector(`[data-swapy-slot="${zoneId}"]`);

              if (widgetElement && zoneElement && swapy.current) {
                setTimeout(() => {
                  // @ts-ignore - Ignoring the moveItem type error
                  swapy.current?.moveItem(widgetElement as HTMLElement, zoneElement as HTMLElement);
                }, 50);
              }
            } catch (error) {
              console.error(`Error applying saved layout for widget ${widgetId}:`, error);
            }
          });
        }

        swapy.current?.onSwap((event) => {
          console.log('swap', event);

          try {
            const currentLayout: LayoutState = {};

            document.querySelectorAll('[data-swapy-item]').forEach((widget) => {
              const widgetId = widget.getAttribute('data-swapy-item');
              const zone = widget.closest('[data-swapy-slot]');
              const zoneId = zone?.getAttribute('data-swapy-slot');

              if (widgetId && zoneId) {
                currentLayout[widgetId] = zoneId;
              }
            });

            saveLayout(currentLayout);
            console.log('Layout saved:', currentLayout);
          } catch (error) {
            console.error('Error saving layout after swap:', error);
          }
        });
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

  // Handle adding a widget from the drawer
  const handleAddWidget = (widgetType: string) => {
    // Find the first empty widget
    const emptyWidgetId = Object.entries(widgetTypes)
        .find(([id, type]) => type === "Widget")?.[0];

    if (emptyWidgetId) {
      // Update the widget type
      setWidgetTypes(prev => ({
        ...prev,
        [emptyWidgetId]: widgetType
      }));

      // Close the drawer
      if (drawerTriggerRef.current) {
        drawerTriggerRef.current.click();
      }
    } else {
      alert("No empty widgets available. Please remove a widget first.");
    }
  };

  // Render widget content based on widget type
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
                onTaskComplete={handleTaskComplete}
                onDeleteTasks={handleDeleteTasks}
            />
        );
      case "Clock":
        return (
            <div className="flex flex-col items-center justify-center h-full">
              <Clock size={48} className="mb-4 text-blue-500" />
              <div className="text-2xl font-semibold">
                {new Date().toLocaleTimeString()}
              </div>
              <div className="text-gray-500">
                {new Date().toLocaleDateString()}
              </div>
            </div>
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
            <div className="text-center py-2">
              <p>Loading tasks...</p>
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