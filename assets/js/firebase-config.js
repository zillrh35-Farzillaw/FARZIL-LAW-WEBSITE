// Firebase project configuration for the FARZIL LAW reader-comments feature.
//
// This feature is not live until the placeholder values below are replaced
// with a real Firebase project's config. To finish setup:
//
// 1. Go to https://console.firebase.google.com and create a free project.
// 2. In the project, enable "Firestore Database" (start in production mode)
//    and "Storage" (for commenter photos), both from the left-hand menu.
// 3. Go to Project Settings (gear icon) > General > "Your apps" > Add app > Web (</>).
//    Register the app (any nickname), skip Firebase Hosting.
// 4. Copy the firebaseConfig object it shows you and paste the values below.
// 5. In Firestore Database > Rules, and in Storage > Rules, paste the rule
//    sets provided separately (see FIREBASE_SETUP.md in this repo).
// 6. To moderate comments: open Firestore Database > Data > "comments"
//    collection in the console, and flip a comment's "approved" field to
//    true to publish it, or delete the document to remove it. No extra
//    admin panel is needed.
window.FARZIL_FIREBASE_CONFIG = {
    apiKey: "REPLACE_ME",
    authDomain: "REPLACE_ME.firebaseapp.com",
    projectId: "REPLACE_ME",
    storageBucket: "REPLACE_ME.appspot.com",
    messagingSenderId: "REPLACE_ME",
    appId: "REPLACE_ME"
};
