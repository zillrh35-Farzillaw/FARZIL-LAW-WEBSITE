// Page loader
(function () {
    var loader = document.getElementById('pageLoader');
    if (!loader) return;
    var hidden = false;
    var hide = function () {
        if (hidden) return;
        hidden = true;
        loader.classList.add('loader-hidden');
        setTimeout(function () {
            if (loader.parentNode) loader.parentNode.removeChild(loader);
        }, 650);
    };
    var minDelay = 1500;
    var start = Date.now();
    window.addEventListener('load', function () {
        var elapsed = Date.now() - start;
        setTimeout(hide, Math.max(0, minDelay - elapsed));
    });
    setTimeout(hide, 3000);
})();

document.addEventListener('DOMContentLoaded', function () {
    // Capabilities tabs
    var capTabs = document.querySelectorAll('.cap-tab');
    if (capTabs.length) {
        capTabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                var target = tab.getAttribute('data-tab');
                capTabs.forEach(function (t) { t.classList.remove('active'); });
                tab.classList.add('active');
                document.querySelectorAll('.capabilities-panel').forEach(function (panel) {
                    panel.classList.toggle('active', panel.id === 'cap-' + target);
                });
            });
        });
    }

    // Mobile nav toggle
    var toggle = document.querySelector('.nav-toggle');
    var navList = document.querySelector('nav ul');
    if (toggle && navList) {
        toggle.addEventListener('click', function () {
            var isOpen = navList.classList.toggle('open');
            toggle.classList.toggle('open', isOpen);
            toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
        navList.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                navList.classList.remove('open');
                toggle.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // Animated count-up stats
    var counters = document.querySelectorAll('.stat-number[data-target]');
    if (counters.length) {
        var animateCounter = function (el) {
            var target = parseInt(el.getAttribute('data-target'), 10) || 0;
            var suffix = el.getAttribute('data-suffix') || '';
            var duration = 1400;
            var start = null;

            function step(timestamp) {
                if (!start) start = timestamp;
                var progress = Math.min((timestamp - start) / duration, 1);
                var eased = 1 - Math.pow(1 - progress, 3);
                var value = Math.floor(eased * target);
                el.textContent = value + suffix;
                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    el.textContent = target + suffix;
                }
            }
            requestAnimationFrame(step);
        };

        if ('IntersectionObserver' in window) {
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.4 });
            counters.forEach(function (el) { observer.observe(el); });
        } else {
            counters.forEach(animateCounter);
        }
    }

    // Gallery lightbox
    var galleryGrid = document.querySelector('.gallery-grid');
    if (galleryGrid) {
        var lightbox = document.createElement('div');
        lightbox.className = 'lightbox-overlay';
        lightbox.innerHTML = '<button class="lightbox-close" aria-label="Close">&times;</button>' +
            '<div class="lightbox-content">' +
            '<img src="" alt="">' +
            '<div class="lightbox-info"><p class="lightbox-title"></p><p class="lightbox-description"></p></div>' +
            '</div>';
        document.body.appendChild(lightbox);
        var lightboxImg = lightbox.querySelector('img');
        var lightboxTitle = lightbox.querySelector('.lightbox-title');
        var lightboxDescription = lightbox.querySelector('.lightbox-description');

        var closeLightbox = function () {
            lightbox.classList.remove('open');
            lightboxImg.src = '';
        };

        galleryGrid.addEventListener('click', function (e) {
            var item = e.target.closest('.gallery-item');
            if (!item) return;
            var img = e.target.tagName === 'IMG' ? e.target : item.querySelector('img');
            var title = item.querySelector('.gallery-event');
            var description = item.querySelector('.gallery-meta');
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt || '';
            lightboxTitle.textContent = title ? title.textContent : '';
            lightboxDescription.textContent = description ? description.textContent : '';
            lightbox.classList.add('open');
        });
        lightbox.addEventListener('click', function (e) {
            if (e.target === lightbox || e.target.classList.contains('lightbox-close')) closeLightbox();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeLightbox();
        });
    }

    // Contact form -> WhatsApp handoff
    var waForm = document.getElementById('whatsappContactForm');
    if (waForm) {
        waForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var number = waForm.getAttribute('data-whatsapp-number');
            var name = (waForm.querySelector('#name') || {}).value || '';
            var email = (waForm.querySelector('#email') || {}).value || '';
            var subject = (waForm.querySelector('#subject') || {}).value || '';
            var message = (waForm.querySelector('#message') || {}).value || '';

            var lines = [
                'New inquiry from farzillaw.com',
                'Name: ' + name,
                'Email: ' + email
            ];
            if (subject) lines.push('Subject: ' + subject);
            lines.push('Message: ' + message);

            var text = encodeURIComponent(lines.join('\n'));
            window.location.href = 'https://wa.me/' + number + '?text=' + text;
        });
    }
});
