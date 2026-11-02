// Reader comments widget. Renders approved comments for the current
// article and lets visitors submit a new one (name, optional photo,
// message) for moderation. Requires assets/js/firebase-config.js to hold
// a real Firebase project config -- until then this degrades gracefully
// and shows a quiet "coming soon" notice instead of a broken form.
document.addEventListener('DOMContentLoaded', function () {
    var root = document.querySelector('.comments-section[data-article]');
    if (!root) return;

    var slug = root.getAttribute('data-article');
    var listEl = root.querySelector('.comment-list');
    var formEl = root.querySelector('.comment-form');
    var statusEl = root.querySelector('.comment-form-status');
    var countEl = root.querySelector('.comments-count');

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str == null ? '' : String(str);
        return div.innerHTML;
    }

    function showNotice(message) {
        listEl.innerHTML = '<p class="comments-notice">' + escapeHtml(message) + '</p>';
        if (formEl) formEl.style.display = 'none';
    }

    var config = window.FARZIL_FIREBASE_CONFIG;
    var configured = config && config.apiKey && config.apiKey.indexOf('REPLACE_ME') === -1;

    if (!configured || typeof firebase === 'undefined') {
        showNotice('Comments are being set up for this site — check back soon.');
        return;
    }

    var app;
    try {
        app = firebase.apps && firebase.apps.length ? firebase.apps[0] : firebase.initializeApp(config);
    } catch (e) {
        showNotice('Comments are temporarily unavailable.');
        return;
    }

    var db = firebase.firestore();
    var storage = firebase.storage();

    function formatDate(ts) {
        try {
            var d = ts && ts.toDate ? ts.toDate() : new Date(ts);
            return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (e) {
            return '';
        }
    }

    function renderComments(docs) {
        if (!docs.length) {
            listEl.innerHTML = '<p class="comments-notice">Be the first to comment on this article.</p>';
            if (countEl) countEl.textContent = '';
            return;
        }
        docs.sort(function (a, b) {
            var ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
            var tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
            return tb - ta;
        });
        if (countEl) countEl.textContent = docs.length + (docs.length === 1 ? ' Comment' : ' Comments');
        listEl.innerHTML = docs.map(function (c) {
            var initials = (c.name || '?').trim().charAt(0).toUpperCase();
            var avatar = c.photoURL
                ? '<div class="comment-avatar" style="background-image: url(\'' + escapeHtml(c.photoURL) + '\');"></div>'
                : '<div class="comment-avatar comment-avatar-initials">' + escapeHtml(initials) + '</div>';
            return '' +
                '<div class="comment-card">' +
                    avatar +
                    '<div class="comment-body">' +
                        '<p class="comment-meta"><strong>' + escapeHtml(c.name) + '</strong> <span>' + formatDate(c.createdAt) + '</span></p>' +
                        '<p class="comment-text">' + escapeHtml(c.text).replace(/\n/g, '<br>') + '</p>' +
                    '</div>' +
                '</div>';
        }).join('');
    }

    db.collection('comments')
        .where('articleSlug', '==', slug)
        .where('approved', '==', true)
        .get()
        .then(function (snap) {
            var docs = [];
            snap.forEach(function (doc) { docs.push(doc.data()); });
            renderComments(docs);
        })
        .catch(function () {
            listEl.innerHTML = '<p class="comments-notice">Couldn&rsquo;t load comments right now. Please try again later.</p>';
        });

    if (!formEl) return;

    formEl.addEventListener('submit', function (e) {
        e.preventDefault();

        // Honeypot: real visitors never fill this hidden field.
        var honeypot = formEl.querySelector('[name="website"]');
        if (honeypot && honeypot.value) return;

        var nameInput = formEl.querySelector('[name="commenter-name"]');
        var textInput = formEl.querySelector('[name="commenter-text"]');
        var photoInput = formEl.querySelector('[name="commenter-photo"]');
        var submitBtn = formEl.querySelector('button[type="submit"]');

        var name = (nameInput.value || '').trim();
        var text = (textInput.value || '').trim();

        if (!name || !text) {
            statusEl.textContent = 'Please enter your name and a comment.';
            statusEl.className = 'comment-form-status comment-form-status-error';
            return;
        }
        if (name.length > 80) {
            statusEl.textContent = 'Name is too long (80 characters max).';
            statusEl.className = 'comment-form-status comment-form-status-error';
            return;
        }
        if (text.length > 2000) {
            statusEl.textContent = 'Comment is too long (2000 characters max).';
            statusEl.className = 'comment-form-status comment-form-status-error';
            return;
        }

        var file = photoInput && photoInput.files && photoInput.files[0];
        if (file) {
            if (!/^image\//.test(file.type)) {
                statusEl.textContent = 'Photo must be an image file.';
                statusEl.className = 'comment-form-status comment-form-status-error';
                return;
            }
            if (file.size > 4 * 1024 * 1024) {
                statusEl.textContent = 'Photo must be smaller than 4MB.';
                statusEl.className = 'comment-form-status comment-form-status-error';
                return;
            }
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting…';
        statusEl.textContent = '';
        statusEl.className = 'comment-form-status';

        function saveComment(photoURL) {
            return db.collection('comments').add({
                articleSlug: slug,
                name: name,
                text: text,
                photoURL: photoURL || null,
                approved: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        var upload = Promise.resolve(null);
        if (file) {
            var safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            var ref = storage.ref().child('comments/' + slug + '/' + Date.now() + '_' + safeName);
            upload = ref.put(file).then(function (snapshot) {
                return snapshot.ref.getDownloadURL();
            });
        }

        upload.then(saveComment).then(function () {
            formEl.reset();
            statusEl.textContent = 'Thank you! Your comment has been submitted and will appear once reviewed.';
            statusEl.className = 'comment-form-status comment-form-status-success';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Comment';
        }).catch(function () {
            statusEl.textContent = 'Something went wrong submitting your comment. Please try again.';
            statusEl.className = 'comment-form-status comment-form-status-error';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Comment';
        });
    });
});
