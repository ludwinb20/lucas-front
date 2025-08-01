# **App Name**: LucasMed

## Core Features:

- **Secure Authentication**: Firebase-based authentication with role-based access (doctor, admin, superadmin)
- **Real-Time Chat**: AI-powered medical consultation chat with MedGemma backend
- **Medical Image Analysis**: Upload and analyze medical images (X-rays, MRIs, CT scans)
- **Symptom Diagnosis**: AI-assisted differential diagnosis with structured prompts
- **Dashboard Analytics**: Medical metrics and statistics visualization
- **Profile Management**: User profile with role-based information and settings
- **Dark Mode**: Toggle between light and dark themes
- **Company Management**: Multi-tenant support with company-based user organization

## Technical Stack:

- **Frontend**: Next.js 14 with TypeScript
- **UI Framework**: Radix UI + Tailwind CSS
- **Authentication**: Firebase Auth with session cookies
- **Database**: Firestore
- **AI Backend**: Custom MedGemma API (FastAPI)
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React

## AI Integration:

### MedGemma API Endpoints:
- **`POST /api/process-text`**: Text-based medical consultations and diagnosis
- **`POST /api/process-image`**: Medical image analysis (X-rays, MRIs, etc.)

### Authentication:
- Session cookies (`__session`) for secure API communication
- Firebase Admin SDK for server-side verification

### Token Tracking:
- Real-time token usage monitoring for cost optimization
- Console logging of total tokens used per request

## Style Guidelines:

### Color Palette (Verde-Azul Profesional):
- **Primary**: `hsl(162 47% 46%)` - Professional medical green
- **Secondary**: `hsl(162 47% 95%)` - Light green background
- **Accent**: `hsl(162 47% 85%)` - Interactive elements
- **Muted**: `hsl(162 47% 90%)` - Subtle backgrounds
- **Border**: `hsl(162 47% 80%)` - Clean borders
- **Chart Colors**: Green-blue gradient for medical data visualization

### Typography:
- **Body**: Inter (sans-serif) for readability
- **Headlines**: Space Grotesk for modern feel
- **Medical**: Professional, clean typography

### UI Components:
- **Sidebar**: Medical-themed navigation with role-based access
- **Dashboard**: Medical metrics with green-blue charts
- **Chat Interface**: Clean, professional medical consultation UI
- **Profile**: Role badges with medical color coding
- **Dark Mode**: Subtle borders and professional dark theme

## User Roles:

### Doctor:
- Access to chat consultations
- Medical image analysis
- Symptom diagnosis
- Personal dashboard

### Admin:
- User management
- Company oversight
- All doctor features

### Superadmin:
- System-wide administration
- All features access

## Medical Features:

### Chat Consultation:
- Context-aware medical conversations
- Image support in chat
- Professional medical responses

### Image Analysis:
- Support for medical image formats
- Radiological analysis prompts
- Structured findings and disclaimers

### Diagnosis:
- Differential diagnosis assistance
- Common vs. rare diagnosis modes
- Probability scoring and recommendations

## Security & Compliance:
- HIPAA-compliant data handling
- Secure session management
- Role-based access control
- Medical disclaimer integration