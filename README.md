# QR Particle Magic (v1.0)

A web application that transforms standard QR codes into stunning, animated particle videos. Built with React, Canvas API, and Google Gemini API.

## 🌟 Features

*   **QR Code Processing**: Uploads and analyzes QR code images to extract pixel data.
*   **Particle Engine**: Custom physics engine supporting multiple animation behaviors.
    *   *Effects*: Converge, Spiral, Matrix, Explosion, Vortex, Raindrop, Scanwave.
*   **Fine-Tuning System**: 
    *   Speed Control (0.5x - 3.0x).
    *   Particle Size Control.
    *   Color Themes (White, Matrix Green, Neon, Fire, Rainbow).
*   **Visual Fidelity**: Ensures the final frame (and "ghost" background) matches the user's selected color theme for 100% scannability.
*   **AI Integration**: Google Gemini API integration to generate viral social media captions based on user context.
*   **Export**: Client-side rendering and recording to `.webm` video format.

## 📂 Project Structure

```
/
├── index.html              # Entry HTML
├── index.tsx               # Entry React render
├── App.tsx                 # Main Application Layout & State Management
├── metadata.json           # Application Metadata
├── types.ts                # TypeScript Interfaces & Enums
├── components/
│   ├── DropZone.tsx        # File Upload Component
│   └── CanvasRenderer.tsx  # Core Animation & Recording Logic (Canvas API)
├── services/
│   ├── imageProcessor.ts   # Pixel extraction logic
│   └── geminiService.ts    # AI Caption generation logic
└── docs/                   # (Optional) Additional documentation
```

## 🚀 Getting Started

### Prerequisites

*   Node.js installed.
*   A Google Cloud Project with Gemini API Key (for caption features).

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/nanaco666/nana.git
    cd nana
    ```

2.  Install dependencies (if using a local bundler like Vite/Parcel):
    ```bash
    npm install
    ```

3.  Set up Environment Variables:
    Create a `.env` file and add:
    ```
    API_KEY=your_google_gemini_api_key
    ```

4.  Run the development server.

## 🛠 Tech Stack

*   **Frontend**: React 19, TypeScript
*   **Styling**: Tailwind CSS
*   **Graphics**: HTML5 Canvas API
*   **AI**: @google/genai SDK

## 📝 License

This project is created for educational and creative purposes.
