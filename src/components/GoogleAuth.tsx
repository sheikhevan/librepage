import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
    setTaskLists: React.Dispatch<React.SetStateAction<{id: string, title: string}[]>>;
    setSelectedTaskList: React.Dispatch<React.SetStateAction<string>>;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

// Key for storing authentication state in localStorage
const AUTH_STORAGE_KEY = 'googleTasksAuthState';

const GoogleAuth: React.FC<GoogleAuthComponentProps> = ({
                                                                     setIsAuthorized,
                                                                     setAllTasks,
                                                                     setTaskLists,
                                                                     setSelectedTaskList,
                                                                     setIsLoading
                                                                 }) => {
    const [isGapiLoaded, setIsGapiLoaded] = useState<boolean>(false);
    const [isGisLoaded, setIsGisLoaded] = useState<boolean>(false);
    const [tokenClient, setTokenClient] = useState<any>(null);
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
            if (document.body.contains(script1)) {
                document.body.removeChild(script1);
            }
            if (document.body.contains(script2)) {
                document.body.removeChild(script2);
            }
        };
    }, []);

    // Store auth token in localStorage
    const saveAuthStateToStorage = (token: any) => {
        try {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(token));
        } catch (error) {
            console.error('Error saving auth state to localStorage:', error);
        }
    };

    // Load auth token from localStorage
    const loadAuthStateFromStorage = () => {
        try {
            const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
            return savedAuth ? JSON.parse(savedAuth) : null;
        } catch (error) {
            console.error('Error loading auth state from localStorage:', error);
            return null;
        }
    };

    // Initialize the Google API client
    const initializeGapiClient = async () => {
        try {
            await (window as any).gapi.load('client', async () => {
                await (window as any).gapi.client.init({
                    apiKey: import.meta.env.VITE_PUBLIC_GOOGLE_API_KEY,
                    discoveryDocs: [DISCOVERY_DOC],
                });
                setIsGapiLoaded(true);

                // Check for saved token after GAPI is initialized
                checkSavedAuthToken();
            });
        } catch (error) {
            console.error('Error initializing GAPI client:', error);
        }
    };

    // Check for saved auth token and restore session if available
    const checkSavedAuthToken = async () => {
        const savedToken = loadAuthStateFromStorage();
        if (savedToken) {
            try {
                // Set the token
                (window as any).gapi.client.setToken(savedToken);

                // Validate the token is still valid by making a test request
                await (window as any).gapi.client.tasks.tasklists.list({
                    maxResults: 1,
                });

                // If we get here, the token is valid
                setIsAuthorized(true);
                listTaskLists();
            } catch (error) {
                console.error('Saved token is invalid or expired:', error);
                // Clear invalid token
                localStorage.removeItem(AUTH_STORAGE_KEY);
                (window as any).gapi.client.setToken('');
            }
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

                    // Save token to localStorage
                    const currentToken = (window as any).gapi.client.getToken();
                    if (currentToken) {
                        saveAuthStateToStorage(currentToken);
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

            // Remove token from localStorage on sign out
            localStorage.removeItem(AUTH_STORAGE_KEY);
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

            // If there's an authentication error, clear the stored token
            if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
                localStorage.removeItem(AUTH_STORAGE_KEY);
                setIsAuthorized(false);
            }
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

    // Render auth component
    return (
        <>
            {(isGapiLoaded && isGisLoaded) && (
                <>
                    {!(window as any).gapi.client.getToken() ? (
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Authentication Required</DialogTitle>
                                    <DialogDescription>
                                        To integrate Librepage with Google services, sign in with Google.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button onClick={handleAuthClick}>Sign in with Google</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    ) : (
                        <div className="fixed bottom-4 right-4 z-50">
                            <Button
                                variant="destructive"
                                onClick={handleSignoutClick}
                                className="shadow-lg"
                            >
                                Sign Out
                            </Button>
                        </div>
                    )}
                </>
            )}
        </>
    );
};

export default GoogleAuth;