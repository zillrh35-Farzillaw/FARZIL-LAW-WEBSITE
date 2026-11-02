// Reader comments widget. Renders approved comments for the current
// article and lets visitors submit a new one (name, optional photo,
// message) for moderation. Backed by a Google Apps Script Web App
// (see assets/js/comments-config.js and COMMENTS_SETUP.md) -- until
// that's configured this degrades gracefully to a quiet notice instead
// of a broken form.
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

    var endpoint = window.FARZIL_COMMENTS_ENDPOINT;
    var configured = endpoint && endpoint.indexOf('REPLACE_ME') === -1;

    if (!configured) {
        showNotice('Comments are being set up for this site — check back soon.');
        return;
    }

    function formatDate(ts) {
        try {
            var d = new Date(ts);
            if (isNaN(d.getTime())) return '';
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
            return new Date(b.timestamp) - new Date(a.timestamp);
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
                        '<p class="comment-meta"><strong>' + escapeHtml(c.name) + '</strong> <span>' + formatDate(c.timestamp) + '</span></p>' +
                        '<p class="comment-text">' + escapeHtml(c.text).replace(/\n/g, '<br>') + '</p>' +
                    '</div>' +
                '</div>';
        }).join('');
    }

    fetch(endpoint + '?article=' + encodeURIComponent(slug))
        .then(function (res) { return res.json(); })
        .then(function (data) { renderComments(data.comments || []); })
        .catch(function () {
            listEl.innerHTML = '<p class="comments-notice">Couldn&rsquo;t load comments right now. Please try again later.</p>';
        });

    if (!formEl) return;

    function resizeImage(file, maxDim, quality) {
        return new Promise(function (resolve, reject) {
            var img = new Image();
            var reader = new FileReader();
            reader.onload = function (e) {
                img.onload = function () {
                    var scale = Math.min(1, maxDim / Math.max(img.width, img.height));
                    var w = Math.max(1, Math.round(img.width * scale));
                    var h = Math.max(1, Math.round(img.height * scale));
                    var canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = function () { reject(new Error('Could not read image.')); };
                img.src = e.target.result;
            };
            reader.onerror = function () { reject(new Error('Could not read file.')); };
            reader.readAsDataURL(file);
        });
    }

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
            if (file.size > 8 * 1024 * 1024) {
                statusEl.textContent = 'Photo must be smaller than 8MB.';
                statusEl.className = 'comment-form-status comment-form-status-error';
                return;
            }
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting…';
        statusEl.textContent = '';
        statusEl.className = 'comment-form-status';

        var photoPromise = file ? resizeImage(file, 400, 0.72) : Promise.resolve('');

        photoPromise.then(function (photoData) {
            return fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    articleSlug: slug,
                    name: name,
                    text: text,
                    photoData: photoData
                })
            });
        }).then(function (res) { return res.json(); })
        .then(function (data) {
            if (!data || !data.ok) throw new Error((data && data.error) || 'Unknown error');
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
