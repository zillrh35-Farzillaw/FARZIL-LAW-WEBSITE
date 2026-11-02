# Reader Comments: Setup

The reader-comments feature (name + optional photo + message, held for
approval before it goes live) is backed by a free Google Sheet and a
small Google Apps Script — no Firebase, no Cloudflare, nothing new to
host. The site itself stays exactly as it is on GitHub Pages. Follow
these steps once to turn it on.

## 1. Create the Sheet

1. Go to https://sheets.google.com and create a new blank spreadsheet.
2. Name it whatever you like (e.g. "FARZIL LAW Comments").

## 2. Add the script

1. In the Sheet, click **Extensions > Apps Script**.
2. Delete any starter code in the editor, and paste in the script below exactly as-is.
3. Click the **Save** icon (or Ctrl/Cmd+S).

```javascript
var SHEET_NAME = 'Comments';
var PHOTOS_FOLDER_NAME = 'FARZIL LAW Comment Photos';

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Timestamp', 'ArticleSlug', 'Name', 'PhotoURL', 'Text', 'Approved']);
  }
  return sheet;
}

function getPhotosFolder() {
  var folders = DriveApp.getFoldersByName(PHOTOS_FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(PHOTOS_FOLDER_NAME);
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var slug = e.parameter.article || '';
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var approved = String(row[5]).toUpperCase() === 'TRUE';
    if (row[1] === slug && approved) {
      out.push({
        name: row[2],
        photoURL: row[3] || '',
        text: row[4],
        timestamp: row[0]
      });
    }
  }
  return jsonOutput({ comments: out });
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var slug = String(payload.articleSlug || '').trim().slice(0, 200);
    var name = String(payload.name || '').trim().slice(0, 80);
    var text = String(payload.text || '').trim().slice(0, 2000);
    var photoData = payload.photoData || '';

    if (!slug || !name || !text) {
      return jsonOutput({ ok: false, error: 'Missing required fields.' });
    }

    var photoURL = '';
    if (photoData) {
      var match = photoData.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
      if (!match) {
        return jsonOutput({ ok: false, error: 'Invalid photo data.' });
      }
      var mimeType = match[1];
      var base64 = match[2];
      if (base64.length > 700000) {
        return jsonOutput({ ok: false, error: 'Photo too large.' });
      }
      var bytes = Utilities.base64Decode(base64);
      var blob = Utilities.newBlob(bytes, mimeType, 'comment-photo');
      var file = getPhotosFolder().createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      photoURL = 'https://lh3.googleusercontent.com/d/' + file.getId();
    }

    getSheet().appendRow([new Date(), slug, name, photoURL, text, false]);
    return jsonOutput({ ok: true });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err) });
  }
}
```

## 3. Deploy it as a Web App

1. Still in the Apps Script editor, click **Deploy > New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set **Execute as**: Me. Set **Who has access**: Anyone.
4. Click **Deploy**.
5. Google will ask you to authorize the script (it needs to read/write your Sheet and Drive). Click **Authorize access**, choose your Google account, and if you see an "unverified app" warning, click **Advanced > Go to [project name] (unsafe)** — this is normal for a personal script you wrote yourself; it's only accessing your own Google account.
6. Copy the **Web app URL** shown (it ends in `/exec`).

## 4. Send me the URL

Send me that `/exec` URL and I'll paste it into `assets/js/comments-config.js` and ship it — comments go live within a couple minutes.

## 5. Moderating comments (your day-to-day workflow)

1. Open the Sheet. New comments appear as rows in the "Comments" tab with the **Approved** column set to `FALSE`.
2. To publish a comment: change that cell to `TRUE`. It appears on the site on the next page load.
3. To reject a comment: delete the row.

Uploaded photos land in a folder named "FARZIL LAW Comment Photos" in your Google Drive, automatically created by the script the first time someone uploads one.

## 6. Cost

Entirely free — this uses your own Google account's Sheets, Drive, and Apps Script quotas, which are far more than a law firm site's comment volume would ever use.

## A note on re-deploying

If you ever edit the script later, Apps Script requires a **new deployment version** to take effect (Deploy > Manage deployments > edit (pencil) icon > New version > Deploy) — just saving the script isn't enough to update the live Web App.
