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
  // State variables
  const [isGapiLoaded, setIsGapiLoaded] = useState<boolean>(false);
  const [isGisLoaded, setIsGisLoaded] = useState<boolean>(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [allTasks, setAllTasks] = useState<TaskItem[]>([]);
  const [taskLists, setTaskLists] = useState<{id: string, title: string}[]>([]);
  const [selectedTaskList, setSelectedTaskList] = useState<string>('');
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [viewAllTasks, setViewAllTasks] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(true);


  // Constants
  const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest';
  const SCOPES = 'https://www.googleapis.com/auth/tasks';

  // Load the Google API client library
  useEffect(() => {
    const script1 = document.createElement('script');
    script1.src = 'https://apis.google.com/js/api.js';
    script1.async = true;
    script1.defer = true;
    script1.onload = () => initializeGapiClient();
    document.body.appendChild(script1);

    const script2 = document.createElement('script');
    script2.src = 'https://accounts.google.com/gsi/client';
    script2.async = true;
    script2.defer = true;
    script2.onload = () => initializeGisClient();
    document.body.appendChild(script2);

    return () => {
      document.body.removeChild(script1);
      document.body.removeChild(script2);
    };
  }, []);

  // Initialize the Google API client
  const initializeGapiClient = async () => {
    try {
      await (window as any).gapi.load('client', async () => {
        await (window as any).gapi.client.init({
          apiKey: import.meta.env.VITE_PUBLIC_GOOGLE_API_KEY,
          discoveryDocs: [DISCOVERY_DOC],
        });
        setIsGapiLoaded(true);
      });
    } catch (error) {
      console.error('Error initializing GAPI client:', error);
    }
  };

  // Initialize the Google Identity Services client
  const initializeGisClient = () => {
    try {
      const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.VITE_PUBLIC_GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.error !== undefined) {
            throw response;
          }
          setIsAuthorized(true);
          listTaskLists();
        },
      });
      setTokenClient(tokenClient);
      setIsGisLoaded(true);
    } catch (error) {
      console.error('Error initializing GIS client:', error);
    }
  };

  // Handle authorization click
  const handleAuthClick = () => {
    if (tokenClient) {
      if ((window as any).gapi.client.getToken() === null) {
        // Request a new token
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        // Reuse an existing token
        tokenClient.requestAccessToken({ prompt: '' });
      }
    }
  };

  // Handle sign out click
  const handleSignoutClick = () => {
    const token = (window as any).gapi.client.getToken();
    if (token !== null) {
      (window as any).google.accounts.oauth2.revoke(token.access_token);
      (window as any).gapi.client.setToken('');
      setIsAuthorized(false);
      setAllTasks([]);
      setTaskLists([]);
      setSelectedTaskList('');
    }
  };

  // List all task lists
  const listTaskLists = async () => {
    try {
      setIsLoading(true);
      const response = await (window as any).gapi.client.tasks.tasklists.list({
        maxResults: 100,
      });

      const taskLists = response.result.items || [];
      if (taskLists.length > 0) {
        const formattedLists = taskLists.map((list: any) => ({
          id: list.id,
          title: list.title,
        }));

        setTaskLists(formattedLists);
        setSelectedTaskList(taskLists[0].id);

        // Load all tasks from all lists
        await loadAllTasks(formattedLists);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error listing task lists:', error);
      setIsLoading(false);
    }
  };

  // Load all tasks from all lists
  const loadAllTasks = async (lists: {id: string, title: string}[]) => {
    try {
      const allTasksPromises = lists.map(list =>
          fetchTasksForList(list.id, list.title)
      );

      const tasksArrays = await Promise.all(allTasksPromises);
      const combinedTasks = tasksArrays.flat();

      setAllTasks(combinedTasks);
    } catch (error) {
      console.error('Error loading all tasks:', error);
    }
  };

  // Fetch tasks for a specific list
  const fetchTasksForList = async (listId: string, listTitle: string): Promise<TaskItem[]> => {
    try {
      const response = await (window as any).gapi.client.tasks.tasks.list({
        tasklist: listId,
        maxResults: 100,
      });

      const tasks = response.result.items || [];

      return tasks.map((task: any) => ({
        id: task.id,
        title: task.title || '(No title)',
        due: task.due,
        notes: task.notes,
        completed: task.completed,
        listId: listId,
        listName: listTitle
      }));
    } catch (error) {
      console.error(`Error fetching tasks for list ${listId}:`, error);
      return [];
    }
  };

  // Handle task list selection change
  const handleTaskListChange = (value: string) => {
    setSelectedTaskList(value);
  };

  // Toggle between viewing all tasks and a single list
  const handleToggleViewAll = () => {
    setViewAllTasks(prev => !prev);
  };

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

        {isLoading && (
            <div className="text-center py-4">
              <p>Loading tasks...</p>
            </div>
        )}

        {isAuthorized && !isLoading && (
            <GetTasks
                allTasks={allTasks}
                taskLists={taskLists}
                selectedTaskList={selectedTaskList}
                onTaskListChange={handleTaskListChange}
                viewAllTasks={viewAllTasks}
                onToggleViewAll={handleToggleViewAll}
            />
        )}
      </div>
  );
};

export default App;