(function () {
    const ownerEmail = "vitspuzyrev@gmail.com";
    const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

    window.isMapOwner = function (user = firebase.auth().currentUser) {
        const isLocalHost = localHosts.has(window.location.hostname);
        const searchParams = new URLSearchParams(window.location.search);
        if (isLocalHost && (searchParams.get("dev") === "1" || searchParams.has("dev=1"))) {
            sessionStorage.setItem("sb_local_dev_mode", "1");
        }
        const localDeveloperMode = isLocalHost && sessionStorage.getItem("sb_local_dev_mode") === "1";
        return localDeveloperMode || Boolean(user?.emailVerified && user.email?.toLowerCase() === ownerEmail);
    };

    function updateAccess(user) {
        if (!document.body) {
            document.addEventListener("DOMContentLoaded", () => updateAccess(user), { once: true });
            return;
        }
        const isOwner = window.isMapOwner(user);
        document.body.classList.toggle("map-owner", isOwner);
        document.querySelectorAll("[data-owner-only]").forEach(element => {
            element.hidden = !isOwner;
        });
        window.dispatchEvent(new CustomEvent("map-auth-state-changed", {
            detail: { user, isOwner }
        }));
    }

    firebase.auth().onAuthStateChanged(updateAccess);
})();
