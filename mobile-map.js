(() => {
    const mapSelector = document.getElementById("page-nav-selector");
    const menuButton = document.querySelector(".mobile-maps-toggle");
    const mapNav = document.querySelector(".mobile-map-nav");

    if (!mapSelector || !menuButton || !mapNav) return;

    mapSelector.querySelectorAll("option").forEach(option => {
        const link = document.createElement("a");
        link.href = option.value;
        link.textContent = option.textContent.replace(/^🗺\s*/, "");

        if (new URL(link.href, window.location.href).pathname === window.location.pathname) {
            link.setAttribute("aria-current", "page");
        }

        mapNav.appendChild(link);
    });

    const setMenuOpen = isOpen => {
        mapNav.classList.toggle("is-open", isOpen);
        menuButton.setAttribute("aria-expanded", String(isOpen));
    };

    menuButton.addEventListener("click", () => {
        setMenuOpen(menuButton.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("click", event => {
        if (!event.target.closest(".mobile-map-header")) setMenuOpen(false);
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") setMenuOpen(false);
    });

    const revealSidebarTarget = (target, focusSelector) => {
        const sidebar = document.getElementById("sidebar");
        if (sidebar.classList.contains("collapsed")) toggleSidebar();

        window.setTimeout(() => {
            const element = sidebar.querySelector(target);
            if (element) element.scrollIntoView({ block: "nearest", behavior: "smooth" });
            if (focusSelector) sidebar.querySelector(focusSelector)?.focus();
        }, 320);

        setMenuOpen(false);
    };

    document.querySelector("[data-mobile-action='search']").addEventListener("click", () => {
        revealSidebarTarget("#search-input", "#search-input");
    });
    document.querySelector("[data-mobile-action='filters']").addEventListener("click", () => {
        revealSidebarTarget("#filters-container");
    });
    document.querySelector("[data-mobile-action='profile']").addEventListener("click", () => {
        revealSidebarTarget(".auth-mini-box");
    });
})();
