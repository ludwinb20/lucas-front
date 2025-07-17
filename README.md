# LucasMed - AI Medical Assistant

Welcome to LucasMed, an advanced web application built with Next.js and Firebase, designed to serve as an intelligent medical assistant. This platform leverages generative AI through Genkit to provide functionalities like AI-powered chat consultations, symptom diagnosis, and medical exam analysis.

## ✨ Key Features

- **AI Chat Consultation**: An interactive chat interface where users can ask medical questions and receive instant answers from an AI assistant.
- **Symptom Diagnosis**: A guided, conversational flow where the AI asks clarifying questions to assess symptoms and provide a preliminary list of possible conditions.
- **Medical Exam Analysis**: Users can upload medical images (like X-rays or MRIs), and the AI will provide a detailed analysis, summary, and potential findings.
- **Role-Based Access Control (RBAC)**: The application supports multiple user roles with different permissions:
  - **Doctor**: Access to patient-facing features like Chat, Diagnosis, and Exams.
  - **Admin**: Manages users within their assigned company.
  - **Superadmin**: Global administrator with access to manage companies and all users across the platform.
- **User and Company Management**: Dedicated dashboards for admins and superadmins to manage users and company profiles within the system.
- **Secure Authentication**: Built on Firebase Authentication for secure user login and registration.

## 🚀 Tech Stack

This project is built with a modern, robust, and scalable technology stack:

- **Framework**: [Next.js](https://nextjs.org/) (with App Router)
- **UI Library**: [React](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **AI/Generative AI**: [Genkit](https://firebase.google.com/docs/genkit)
- **Backend & Database**: [Firebase](https://firebase.google.com/) (Authentication, Firestore, Cloud Storage)

## 📂 Project Structure

Here's a brief overview of the key directories in the project:

- **/src/app/**: Contains the main application pages and layouts, following the Next.js App Router structure.
  - **/src/app/(app)/**: Protected routes accessible only to authenticated users.
  - **/src/app/(auth)/**: Authentication-related pages like Login and Sign Up.
- **/src/ai/flows/**: Home to the Genkit flows that power the application's AI features. Each file defines a specific AI-driven task.
- **/src/components/**: A collection of reusable React components, including UI components from ShadCN (`/ui`) and custom application components.
- **/src/hooks/**: Custom React hooks, such as `useAuth.ts` for managing authentication state.
- **/src/lib/**: Utility functions and Firebase configuration files (`firebase.ts`, `firebase-admin.ts`).
- **/firestore.rules**: Contains the security rules for the Firestore database, ensuring users can only access their own data.

## 🏁 Getting Started

To get started with the application, the primary entry point is the root page (`/`), which will automatically redirect you to the login page (`/login`) if you are not authenticated, or to the chat page (`/chat`) if you are.
