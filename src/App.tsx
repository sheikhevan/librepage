import React, { useState, useEffect, useRef } from 'react';
import GetTasks from '@/components/GetTasks';
import GoogleAuthComponent from '@/components/GoogleAuth';
import { createSwapy, Swapy } from 'swapy'; // Import the Swapy type

interface TaskItem {
  id: string;
  title: string;
  due?: string;
  notes?: string;
  completed?: string;
  listId?: string;
  listName?: string;
}

// Define a type for the layout data we'll store
interface LayoutState {
  [key: string]: string; // Maps widgetId to zoneId
}

const LAYOUT_STORAGE_KEY = 'taskDashboardLayout';

const App: React.FC = () => {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [allTasks, setAllTasks] = useState<TaskItem[]>([]);
  const [taskLists, setTaskLists] = useState<{id: string, title: string}[]>([]);
  const [selectedTaskList, setSelectedTaskList] = useState<string>('');
  const [viewAllTasks, setViewAllTasks] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Properly type the ref with the correct type or null
  const swapy = useRef<Swapy | null>(null);
  const container = useRef<HTMLDivElement | null>(null);

  // Function to load layout from localStorage
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

  // Function to save layout to localStorage
  const saveLayout = (layout: LayoutState) => {
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
    } catch (error) {
      console.error('Error saving layout to localStorage:', error);
    }
  };

  // Initialize Swapy when the user is authorized and content is loaded
  useEffect(() => {
    if (isAuthorized && !isLoading && container.current) {
      // Small delay to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        // Clean up previous instance if it exists
        if (swapy.current) {
          swapy.current.destroy();
        }

        // Create new Swapy instance
        swapy.current = createSwapy(container.current);

        // Try to load saved layout from localStorage
        const savedLayout = loadLayout();

        if (savedLayout) {
          // Apply saved layout
          Object.entries(savedLayout).forEach(([widgetId, zoneId]) => {
            try {
              // For each saved widget position, move it to the corresponding zone
              const widgetElement = document.querySelector(`[data-swapy-item="${widgetId}"]`);
              const zoneElement = document.querySelector(`[data-swapy-slot="${zoneId}"]`);

              if (widgetElement && zoneElement && swapy.current) {
                // Using a timeout to ensure Swapy is fully initialized
                setTimeout(() => {
                  swapy.current?.moveItem(widgetElement as HTMLElement, zoneElement as HTMLElement);
                }, 50);
              }
            } catch (error) {
              console.error(`Error applying saved layout for widget ${widgetId}:`, error);
            }
          });
        }

        // Set up event listeners for saving layout
        swapy.current?.onSwap((event) => {
          console.log('swap', event);

          // After a swap, save the current layout
          try {
            const currentLayout: LayoutState = {};

            // For each widget, find its current zone
            document.querySelectorAll('[data-swapy-item]').forEach((widget) => {
              const widgetId = widget.getAttribute('data-swapy-item');
              // Find the zone that contains this widget
              const zone = widget.closest('[data-swapy-slot]');
              const zoneId = zone?.getAttribute('data-swapy-slot');

              if (widgetId && zoneId) {
                currentLayout[widgetId] = zoneId;
              }
            });

            // Save the layout to localStorage
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

  // Handle task list selection change
  const handleTaskListChange = (value: string) => {
    setSelectedTaskList(value);
  };

  // Toggle between viewing all tasks and a single list
  const handleToggleViewAll = () => {
    setViewAllTasks(prev => !prev);
  };

  // Update task completion status
  const handleTaskComplete = async (taskId: string, listId: string, completed: boolean): Promise<boolean> => {
    try {
      // First, get the current task details
      const response = await (window as any).gapi.client.tasks.tasks.get({
        tasklist: listId,
        task: taskId
      });

      const taskData = response.result;

      // Update the completion status
      if (completed) {
        taskData.status = 'completed';
        taskData.completed = new Date().toISOString();
      } else {
        taskData.status = 'needsAction';
        delete taskData.completed;
      }

      // Send the update to Google Tasks API
      await (window as any).gapi.client.tasks.tasks.update({
        tasklist: listId,
        task: taskId,
        resource: taskData
      });

      // Update local state
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

  // Function to handle deleting completed tasks
  const handleDeleteTasks = async (tasksToDelete: TaskItem[]): Promise<boolean> => {
    try {
      // Group tasks by listId for batch processing
      const tasksByList: Record<string, string[]> = {};

      tasksToDelete.forEach(task => {
        if (task.listId) {
          if (!tasksByList[task.listId]) {
            tasksByList[task.listId] = [];
          }
          tasksByList[task.listId].push(task.id);
        }
      });

      // Process each list's tasks
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

      // Update local state by filtering out deleted tasks
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

  return (
      <div className="w-full h-screen p-4 flex flex-col">
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
                  </div>
                </div>
              </div>

              <div data-swapy-slot="zone2" className="overflow-auto border-2 border-dashed border-gray-200 rounded-lg">
                <div data-swapy-item="widget2" className="h-full cursor-move">
                  <div className="p-4 h-full bg-gray-50">
                    <div className="flex items-center justify-center h-4/5">
                      <p className="text-gray-500">Widget</p>
                    </div>
                  </div>
                </div>
              </div>

              <div data-swapy-slot="zone3" className="overflow-auto border-2 border-dashed border-gray-200 rounded-lg">
                <div data-swapy-item="widget3" className="h-full cursor-move">
                  <div className="p-4 h-full bg-gray-50">
                    <div className="flex items-center justify-center h-4/5">
                      <p className="text-gray-500">Widget</p>
                    </div>
                  </div>
                </div>
              </div>

              <div data-swapy-slot="zone4" className="overflow-auto border-2 border-dashed border-gray-200 rounded-lg">
                <div data-swapy-item="widget4" className="h-full cursor-move">
                  <div className="p-4 h-full bg-gray-50">
                    <div className="flex items-center justify-center h-4/5">
                      <p className="text-gray-500">Widget</p>
                    </div>
                  </div>
                </div>
              </div>

              <div data-swapy-slot="zone5" className="overflow-auto border-2 border-dashed border-gray-200 rounded-lg">
                <div data-swapy-item="widget5" className="h-full cursor-move">
                  <div className="p-4 h-full bg-gray-50">
                    <div className="flex items-center justify-center h-4/5">
                      <p className="text-gray-500">Widget</p>
                    </div>
                  </div>
                </div>
              </div>

              <div data-swapy-slot="zone6" className="overflow-auto border-2 border-dashed border-gray-200 rounded-lg">
                <div data-swapy-item="widget6" className="h-full cursor-move">
                  <div className="p-4 h-full bg-gray-50">
                    <div className="flex items-center justify-center h-4/5">
                      <p className="text-gray-500">Widget</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default App;