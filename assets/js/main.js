document.addEventListener('DOMContentLoaded', function () {
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
});
