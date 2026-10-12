# SafarSaathi Frontend Prototype

A responsive HTML/CSS/JavaScript frontend for a multilingual Indian travel companion hackathon demo.

## Run locally
1. Extract the ZIP file.
2. Open the `safar-saathi-frontend` folder in VS Code.
3. Open `index.html` in a browser, or use the VS Code Live Server extension.
4. No build step or npm install is required.

## Included interactions
- Responsive dashboard and mobile sidebar
- English, Bengali, and Hindi language selector (demo UI copy and responses)
- Ticket upload modal with file selection and a clearly labelled placeholder analysis state
- Voice assistant modal using browser speech recognition where supported
- Browser speech synthesis for sample answers
- Notice translator modal with sample action-plan preview
- Editable sample journey details
- Interactive journey checklist and progress indicator
- Toasts, navigation, tips and about modals

## Important
This is frontend-only. It does **not** call Sarvam APIs, perform real OCR/translation, verify train bookings, or provide live railway information. Ticket/notice uploads stay in the browser and are not sent anywhere in this prototype. Connect a backend and Sarvam APIs to enable real processing. Do not put an API key in frontend JavaScript.
