import React, { useState, useEffect } from 'react';

interface TaskItem {
  id: string;
  title: string;
  due?: string;
  notes?: string;
  completed?: string;
}

interface TasksApiProps {
  apiKey: string;
  clientId: string;
}

const TasksApi: React.FC<TasksApiProps> = ({ apiKey, clientId }) => {
  const [isGapiLoaded, setIsGapiLoaded] = useState<boolean>(false);
  const [isGisLoaded, setIsGisLoaded] = useState<boolean>(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [taskLists, setTaskLists] = useState<{id: string, title: string}[]>([]);
  const [selectedTaskList, setSelectedTaskList] = useState<string>('');
  const [tokenClient, setTokenClient] = useState<any>(null);

  const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest';
  const SCOPES = 'https://www.googleapis.com/auth/tasks.readonly';

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

  const handleSignoutClick = () => {
    const token = (window as any).gapi.client.getToken();
    if (token !== null) {
      (window as any).google.accounts.oauth2.revoke(token.access_token);
      (window as any).gapi.client.setToken('');
      setIsAuthorized(false);
      setTasks([]);
      setTaskLists([]);
      setSelectedTaskList('');
    }
  };

  // List all task lists
  const listTaskLists = async () => {
    try {
      const response = await (window as any).gapi.client.tasks.tasklists.list({
        maxResults: 10,
      });

      const taskLists = response.result.items;
      if (taskLists && taskLists.length > 0) {
        setTaskLists(taskLists.map((list: any) => ({
          id: list.id,
          title: list.title,
        })));

        // Select the first task list by default
        setSelectedTaskList(taskLists[0].id);
        listTasks(taskLists[0].id);
      }
    } catch (error) {
      console.error('Error listing task lists:', error);
    }
  };

  // List tasks for a specific task list
  const listTasks = async (taskListId: string) => {
    try {
      const response = await (window as any).gapi.client.tasks.tasks.list({
        tasklist: taskListId,
        maxResults: 10,
      });

      const tasks = response.result.items;
      if (tasks && tasks.length > 0) {
        setTasks(tasks.map((task: any) => ({
          id: task.id,
          title: task.title || '(No title)',
          due: task.due,
          notes: task.notes,
          completed: task.completed,
        })));
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Error listing tasks:', error);
    }
  };

  // Handle task list selection change
  const handleTaskListChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const taskListId = event.target.value;
    setSelectedTaskList(taskListId);
    listTasks(taskListId);
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
      <div className="tasks-api-container p-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Google Tasks API Quickstart</h1>

        <div className="mb-4 flex space-x-2">
          {(isGapiLoaded && isGisLoaded) && (
              <>
                {!isAuthorized ? (
                    <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                        onClick={handleAuthClick}>
                      Authorize
                    </button>
                ) : (
                    <button
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                        onClick={handleSignoutClick}>
                      Sign Out
                    </button>
                )}
              </>
          )}
        </div>

        {isAuthorized && (
            <>
              {taskLists.length > 0 && (
                  <div className="mb-4">
                    <label className="block mb-2 font-medium">
                      Select Task List:
                      <select
                          className="mt-1 block w-full p-2 border border-gray-300 rounded"
                          value={selectedTaskList}
                          onChange={handleTaskListChange}
                      >
                        {taskLists.map(list => (
                            <option key={list.id} value={list.id}>
                              {list.title}
                            </option>
                        ))}
                      </select>
                    </label>
                  </div>
              )}

              <div className="task-list">
                <h2 className="text-xl font-semibold mb-2">Tasks</h2>
                {tasks.length > 0 ? (
                    <ul className="border rounded divide-y">
                      {tasks.map(task => (
                          <li key={task.id} className="p-3 hover:bg-gray-50">
                            <div className={`task-item ${task.completed ? 'line-through text-gray-500' : ''}`}>
                              <h3 className="font-medium">{task.title}</h3>
                              {task.due && (
                                  <p className="text-sm text-gray-600">Due: {formatDate(task.due)}</p>
                              )}
                              {task.notes && (
                                  <p className="text-sm mt-1">{task.notes}</p>
                              )}
                            </div>
                          </li>
                      ))}
                    </ul>
                ) : (
                    <p>No tasks found in this list.</p>
                )}
              </div>
            </>
        )}
      </div>
  );
};

export default TasksApi;
