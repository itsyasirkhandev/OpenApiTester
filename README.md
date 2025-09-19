# API Craft & Plan

An intelligent, modern API testing and planning web application designed for developers. Craft requests, manage environments, and inspect responses with a clean, intuitive, and powerful interface.

**Created by [Yasir](https://yasir.qzz.io)**

---

## ✨ Features

- **Multi-Tab Interface**: Work on multiple API requests simultaneously without losing context. Manage tabs just like in your favorite editor—create, duplicate, rename, and close them with ease.
- **Comprehensive Request Builder**:
    - Supports all standard HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, etc.).
    - Easily manage Query Params, Headers, and Request Body.
    - Built-in JSON editor with syntax highlighting for the request body.
- **Powerful Authorization**: Built-in support for common authentication schemes, including **Bearer Token** and **Basic Auth**.
- **Environments & Global Variables**: Define environment-specific variables (like `{{base_url}}`, `{{auth_token}}`) in the "Environment" panel. Use them anywhere in your requests for maximum reusability and to avoid hardcoding values.
- **Automatic Request History**: Every request you send is automatically saved to the History sidebar, allowing you to quickly find and re-run previous calls.
- **Code Generation**: Instantly generate a `cURL` command from your current request with a single click.
- **Import from cURL**: Have a cURL command? Paste it into the importer, and the application will automatically parse it into a new request tab.
- **Rich Response Viewer**:
    - **Pretty View**: Formatted and interactive JSON viewer.
    - **Raw View**: See the raw response text.
    - **Preview Mode**: Render HTML responses directly within the app.
    - Displays crucial metadata like HTTP Status, response time, and content size.
- **Resizable Layout**: Adjust the vertical split between the request and response panels to fit your needs.
- **Keyboard-First Design**:
    - **Command Palette (`Ctrl+K` / `⌘+K`)**: Quickly access all major actions, from sending requests to switching tabs.
    - **Shortcuts**: Send requests (`Ctrl+Enter`), create new tabs (`Ctrl+N`), and more.
- **Modern & Aesthetic UI**: A thoughtfully designed dark-mode interface that's both beautiful and functional.

## 🚀 How It Works

### 1. Building a Request
- **Select the HTTP Method**: Use the dropdown next to the URL bar.
- **Enter the URL**: Type your API endpoint into the main input field. As you add query parameters in the URL, they will automatically populate the "Params" tab.
- **Add Details**:
    - **Params**: Manage URL query parameters in the "Params" tab.
    - **Authorization**: Select an auth type (e.g., Bearer Token) and enter your credentials.
    - **Headers**: Add or override request headers. `Content-Type: application/json` is added by default.
    - **Body**: For `POST`, `PUT`, or `PATCH` requests, enter your payload in the "Body" tab.

### 2. Using Environment Variables
1.  Open the **Environment** tab in the sidebar.
2.  Click "Add" to create a new variable (e.g., `baseUrl` with the value `https://api.example.com`).
3.  In your URL bar or any other input, reference it using double curly braces: `{{baseUrl}}/users`. The app will substitute the variable's value when you send the request.

### 3. Sending the Request
- Click the purple **"Send"** button or use the keyboard shortcut (`Ctrl+Enter` or `⌘+Enter`).
- A loading indicator will appear while the request is in flight.

### 4. Inspecting the Response
- The right-hand panel will display the complete response from the server.
- The status bar shows the HTTP status code, response time, and size.
- Use the "Body" and "Headers" tabs to inspect the response payload and headers. For the body, you can switch between "Pretty", "Raw", and "Preview" modes.

### 5. Managing Your Workspace
- **Tabs**: Use the `+` button to create a new tab. Right-click any tab for more options like renaming, duplicating, or closing.
- **History**: Access previously sent requests from the "History" tab in the sidebar. Clicking an item will open it in a new tab.

This application runs entirely in your browser and uses `localStorage` to persist your tabs, history, and environment variables between sessions.
