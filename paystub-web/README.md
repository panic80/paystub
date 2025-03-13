# Paystub Manager

A simple, elegant standalone utility for managing and analyzing paystubs from PDF files. This application runs completely in the browser with no backend server required.

## Features

- Upload and process PDF paystubs directly in your browser
- Extract names, dates, and amounts from paystubs
- Store all data locally in your browser's IndexedDB
- View and manage paystubs in a clean database interface
- Track individuals and their earnings history
- Edit contact information for individuals
- Light/dark theme support

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm start
```

The application will be available at http://localhost:3000.

## Technology Stack

- React
- Tailwind CSS
- PDF processing with pdf-lib and pdfjs-dist
- Client-side database with Dexie.js (IndexedDB)
- File handling with react-dropzone

## How It Works

1. **PDF Processing**: All PDF processing happens in your browser using pdf-lib and pdfjs-dist
2. **Text Extraction**: The application extracts relevant information from your paystubs using regex patterns
3. **Data Storage**: Everything is stored in your browser's IndexedDB, so your data stays on your device
4. **Individual Management**: The app automatically organizes paystubs by individual and allows you to add contact details

## Privacy

Since all processing happens locally in your browser and data is stored in IndexedDB, your sensitive paystub information never leaves your computer. No server is required or contacted during usage.

## Project Structure

```
paystub-web/
├── public/
├── src/
│   ├── components/       # Reusable UI components
│   ├── context/          # React context for state management
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components
│   ├── utils/            # Utility functions
│   ├── App.js            # Main application component
│   ├── index.js          # Application entry point
│   └── index.css         # Global styles and Tailwind imports
├── package.json
├── tailwind.config.js    # Tailwind CSS configuration
└── README.md
```

## Backend Integration

This frontend application is designed to work with a backend API for PDF processing and data storage. In the current implementation, mock data is used for demonstration purposes.

To connect to a real backend:
1. Create API service files in the `src/utils` directory
2. Replace the mock data with API calls
3. Handle authentication and error states

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- This project was converted from a PyQt5 desktop application to a modern web application
- Icons provided by [Heroicons](https://heroicons.com/)
- UI components styled with [Tailwind CSS](https://tailwindcss.com/) 