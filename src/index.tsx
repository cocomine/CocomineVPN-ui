import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
import App, {ErrorScreen} from './App';
import reportWebVitals from './reportWebVitals';
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import {loader} from "./Menu";
import {Action, ErrorElement, loader as actionLoader} from "./action";

const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        loader: loader,
        errorElement: <ErrorScreen />,
        children: [
            {
                path: ':id',
                loader: actionLoader,
                element: <Action />,
                errorElement: <ErrorElement />
            }
        ]
    }
])

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
root.render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
