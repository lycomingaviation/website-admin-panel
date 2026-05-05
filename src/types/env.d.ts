declare namespace NodeJS {
    interface ProcessEnv {
        REACT_APP_API_URL: string; // Add any other environment variables here
        [key: string]: string | undefined;
    }
}
