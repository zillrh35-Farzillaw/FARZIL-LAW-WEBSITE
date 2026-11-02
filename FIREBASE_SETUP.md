# Reader Comments: Firebase Setup

The reader-comments feature (name + optional photo + message, held for
approval before it goes live) needs a free Firebase project to store
comments and uploaded photos. The site itself stays on GitHub Pages —
nothing about hosting changes. Follow these steps once to turn it on.

## 1. Create the Firebase project

1. Go to https://console.firebase.google.com and sign in with a Google account.
2. Click **Add project**, give it a name (e.g. `farzil-law-comments`), and finish the wizard (Google Analytics is optional — you can skip it).

## 2. Enable Firestore (the comments database)

1. In the left-hand menu, click **Build > Firestore Database**.
2. Click **Create database**.
3. Choose **Start in production mode**, pick a location close to Pakistan (e.g. `asia-south1`), and click **Enable**.
4. Go to the **Rules** tab and replace the contents with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /comments/{commentId} {
      allow read: if resource.data.approved == true;
      allow create: if request.resource.data.keys().hasOnly(['articleSlug','name','text','photoURL','approved','createdAt'])
                    && request.resource.data.approved == false
                    && request.resource.data.articleSlug is string
                    && request.resource.data.name is string
                    && request.resource.data.name.size() > 0
                    && request.resource.data.name.size() <= 80
                    && request.resource.data.text is string
                    && request.resource.data.text.size() > 0
                    && request.resource.data.text.size() <= 2000
                    && request.resource.data.createdAt == request.time;
      allow update, delete: if false;
    }
  }
}
```

5. Click **Publish**.

This means: anyone can submit a new comment (as long as it's shaped correctly and marked unapproved), but nobody can read, edit, delete, or self-approve a comment from the website. Only *you*, logged into the Firebase Console, can see and approve pending comments — the console has its own access, separate from these rules.

## 3. Enable Storage (for uploaded photos)

1. In the left-hand menu, click **Build > Storage**.
2. Click **Get started** and accept the defaults.
3. Go to the **Rules** tab and replace the contents with:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /comments/{articleSlug}/{fileName} {
      allow read: if true;
      allow write: if request.resource.size < 4 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
      allow delete: if false;
    }
  }
}
```

4. Click **Publish**.

## 4. Get your web app config

1. Click the gear icon next to **Project Overview** > **Project settings**.
2. Under **Your apps**, click the **</>** (web) icon to register a new web app. Give it any nickname (e.g. `farzillaw-site`) and skip Firebase Hosting.
3. It will show a `firebaseConfig` object like this:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "farzil-law-comments.firebaseapp.com",
  projectId: "farzil-law-comments",
  storageBucket: "farzil-law-comments.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

4. Send me those six values (or paste them into `assets/js/firebase-config.js` yourself) and I'll wire it in and ship it.

These values are safe to be public in the site's code — they're not secret keys. What actually protects your data is the Rules set up in steps 2 and 3.

## 5. Moderating comments (your day-to-day workflow)

No separate admin panel is needed:

1. Go to the Firebase Console > **Firestore Database** > **Data** tab.
2. Open the `comments` collection. Each pending comment has `approved: false`.
3. To publish a comment: click it, click the `approved` field, change `false` to `true`, and save. It will appear on the site (readers see it on their next page load).
4. To reject a comment: open it and click the trash icon to delete the document entirely.

## 6. Cost

Firebase's free "Spark" plan covers this comfortably for a law firm site's comment volume (tens of thousands of reads/writes per day, 1GB of photo storage, 5GB/month of downloads) — no billing setup required unless traffic grows far beyond that.
