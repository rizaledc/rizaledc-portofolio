document.addEventListener('DOMContentLoaded', () => {
    const nav = document.getElementById('nav');
    const menuBtn = document.getElementById('menuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const progress = document.getElementById('scrollProgress');

    // Mobile menu
    const setMenu = (open) => {
        nav.classList.toggle('open', open);
        menuBtn.setAttribute('aria-expanded', String(open));
        menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
    mobileMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

    // Nav border + scroll progress
    const onScroll = () => {
        const y = window.scrollY;
        nav.classList.toggle('scrolled', y > 24);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Active nav link
    const links = [...document.querySelectorAll('.nav-links a')];
    const sections = links.map((l) => document.querySelector(l.getAttribute('href'))).filter(Boolean);
    if ('IntersectionObserver' in window) {
        const spy = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id));
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        sections.forEach((s) => spy.observe(s));
    }

    // Reveal on scroll
    const reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        reveals.forEach((el, i) => {
            el.style.transitionDelay = (i % 4) * 70 + 'ms';
            io.observe(el);
        });
    } else {
        reveals.forEach((el) => el.classList.add('in'));
    }

    // Counters in hero
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) {
        document.querySelectorAll('.counter').forEach((el) => {
            const target = parseFloat(el.dataset.target);
            const decimals = parseInt(el.dataset.decimals || '0', 10);
            const start = performance.now();
            const dur = 1400;
            const tick = (now) => {
                const p = Math.min((now - start) / dur, 1);
                const eased = 1 - Math.pow(1 - p, 3);
                el.textContent = (target * eased).toFixed(decimals);
                if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });
    }

    // Experience timeline: progress line + travelling dot follow the scroll
    const timeline = document.getElementById('timeline');
    if (timeline) {
        const items = [...timeline.querySelectorAll('li')];
        let ticking = false;
        const updateTimeline = () => {
            ticking = false;
            const rect = timeline.getBoundingClientRect();
            const anchor = window.innerHeight * 0.55;
            const p = Math.min(Math.max((anchor - rect.top) / rect.height, 0), 1);
            timeline.style.setProperty('--p', p.toFixed(4));
            items.forEach((li) => {
                li.classList.toggle('passed', li.getBoundingClientRect().top + 12 <= anchor);
            });
        };
        const requestTimeline = () => { if (!ticking) { ticking = true; requestAnimationFrame(updateTimeline); } };
        window.addEventListener('scroll', requestTimeline, { passive: true });
        window.addEventListener('resize', requestTimeline);
        updateTimeline();
    }

    // Contact note: appears once per visit, 30s after opening, if the visitor has scrolled
    const toast = document.getElementById('contactToast');
    if (toast) {
        const storage = {
            get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
            set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } }
        };
        const contact = document.getElementById('contact');
        let hasScrolled = false;
        let dueTime = false;
        let shown = storage.get('contactToastSeen') === '1';

        const contactInView = () => {
            const r = contact.getBoundingClientRect();
            return r.top < window.innerHeight && r.bottom > 0;
        };
        const show = () => {
            if (shown || !hasScrolled || !dueTime || contactInView()) return;
            shown = true;
            storage.set('contactToastSeen', '1');
            toast.hidden = false;
            requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
        };
        const hide = () => {
            toast.classList.remove('show');
            setTimeout(() => { toast.hidden = true; }, 500);
        };
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) hasScrolled = true;
            show();
        }, { passive: true });
        setTimeout(() => { dueTime = true; show(); }, 30000);
        document.getElementById('toastClose').addEventListener('click', hide);
        document.getElementById('toastLater').addEventListener('click', hide);
        toast.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setTimeout(hide, 300)));
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !toast.hidden) hide(); });
    }

    document.getElementById('year').textContent = new Date().getFullYear();
});
