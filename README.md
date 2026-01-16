# Elevare LMS

Elevare is a modern Learning Management System (LMS) designed for educational institutions. It features specialized interfaces for Students and Faculty, streamlined course management, and AI-powered assignment grading.

## Features

-   **Role-Based Access**: Specialized dashboards for Students and Faculty.
-   **Classroom Management**: Create, join, and manage courses.
-   **Assignments & OCR**: Upload assignments (PDF/Image) with automatic text extraction (OCR).
-   **AI Auto-Grading**: Powered by Gemini API to provide instant grades and feedback.
-   **Secure Auth**: Custom JWT authentication with Refresh Tokens and Audit Logging.
-   **Modern UI**: Built with React and TailwindCSS.

## Tech Stack

-   **Frontend**: React (Vite), TailwindCSS
-   **Backend**: Node.js, Express, MongoDB
-   **AI/ML**: Google Gemini API, Tesseract.js (OCR)

## Getting Started

### Prerequisites

-   Node.js (v16+)
-   MongoDB (Local or Atlas)
-   Gemini API Key

### Installation

1.  **Clone the repository**

2.  **Setup Backend**
    ```bash
    cd server
    npm install
    ```
    Create a `.env` file in `server/` with:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_uri
    JWT_SECRET=your_jwt_secret
    JWT_REFRESH_SECRET=your_refresh_secret
    GEMINI_API_KEY=your_gemini_key
    ```
    Start the server:
    ```bash
    npm start
    ```

3.  **Setup Frontend**
    ```bash
    cd client
    npm install
    ```
    Start the client:
    ```bash
    npm run dev
    ```

## Usage

1.  Register as a **Faculty** to create courses and assignments.
2.  Register as a **Student** to join courses and submit work.
3.  Upload submissions and use the "Grade with Gemini" feature (Faculty view) to see AI scoring.
