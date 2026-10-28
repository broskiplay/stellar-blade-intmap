(function () {
    const firebaseConfig = {
        apiKey: "AIzaSyBZ29h18Z1k0gE4dAEca5JH8yePQgxhaII",
        authDomain: "broskiplaymaps.firebaseapp.com",
        projectId: "broskiplaymaps",
        storageBucket: "broskiplaymaps.firebasestorage.app",
        messagingSenderId: "418362476965",
        appId: "1:418362476965:web:59ce4e677b1a0a84d7404c",
        measurementId: "G-D5PQJQ7HZG"
    };

    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

    const auth = firebase.auth();
    const db = firebase.firestore();
    const mapStates = new Map();
    const persistenceReady = db.enablePersistence({ synchronizeTabs: true }).catch(error => {
        console.warn("Постоянный кэш Firestore недоступен:", error);
    });

    function progressRef(user, mapId) {
        return db.collection("users").doc(user.uid).collection("mapProgress").doc(mapId);
    }

    function customMarkersRef(user, mapId) {
        return db.collection("users").doc(user.uid).collection("customMarkers").doc(mapId);
    }

    function uniqueIds(ids) {
        const seen = new Set();
        return (Array.isArray(ids) ? ids : []).filter(id => {
            const key = String(id);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    function cloudIdsFromSnapshot(snapshot) {
        if (!snapshot.exists) return [];
        const data = snapshot.data();
        if (Array.isArray(data.foundIds)) return data.foundIds;
        if (Array.isArray(data.found)) return data.found;
        return [];
    }

    function isOfflineError(error) {
        return error?.code === "unavailable" || /client is offline/i.test(error?.message || "");
    }

    async function readProgress(ref) {
        await persistenceReady;
        try {
            return await ref.get();
        } catch (error) {
            if (!isOfflineError(error)) throw error;
            try {
                return await ref.get({ source: "cache" });
            } catch (cacheError) {
                if (!isOfflineError(cacheError) && cacheError?.code !== "not-found") throw cacheError;
                const offlineError = new Error("Нет подключения к Google, и данные этой карты ещё не сохранены в локальном кэше. Они останутся на устройстве и синхронизируются после восстановления сети.");
                offlineError.code = "unavailable";
                throw offlineError;
            }
        }
    }

    function reportError(state, message, error) {
        console.warn(message, error);
        if (state.onError) state.onError(error);
    }

    async function synchronizeProgress(user, mapId, state, forceWrite = false) {
        if (state.syncPromise) return state.syncPromise;

        const syncPromise = (async () => {
            const ref = progressRef(user, mapId);
            const snapshot = await readProgress(ref);
            if (mapStates.get(mapId) !== state || auth.currentUser?.uid !== user.uid) return null;

            const mergedIds = uniqueIds([...state.getLocalIds(), ...cloudIdsFromSnapshot(snapshot)]);
            state.applyIds(mergedIds);
            state.ready = true;

            const idsKey = JSON.stringify(mergedIds.map(String).sort());
            if (forceWrite || idsKey !== state.lastSavedKey) {
                await ref.set({
                    foundIds: mergedIds,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                state.lastSavedKey = idsKey;
            }
            return mergedIds;
        })();

        state.syncPromise = syncPromise;
        try {
            return await syncPromise;
        } finally {
            if (state.syncPromise === syncPromise) state.syncPromise = null;
        }
    }

    window.connectMapProgressSync = function (mapId, getLocalIds, applyIds, onError) {
        auth.onAuthStateChanged(user => {
            const state = {
                uid: user?.uid,
                ready: false,
                lastSavedKey: null,
                getLocalIds,
                applyIds,
                onError,
                syncPromise: null
            };
            mapStates.set(mapId, state);
            if (!user) return;

            synchronizeProgress(user, mapId, state).catch(error => {
                reportError(state, "Не удалось загрузить прогресс из Google Cloud Firestore:", error);
            });
        });
    };

    window.saveMapProgressToCloud = function (mapId, foundIds) {
        const user = auth.currentUser;
        const state = mapStates.get(mapId);
        if (!user || !state || state.uid !== user.uid) return;
        if (typeof navigator !== "undefined" && !navigator.onLine) return;

        if (!state.ready) {
            return synchronizeProgress(user, mapId, state).catch(error => {
                reportError(state, "Не удалось загрузить прогресс из Google Cloud Firestore:", error);
            });
        }

        const normalizedIds = uniqueIds(foundIds);
        const idsKey = JSON.stringify(normalizedIds.map(String).sort());
        if (idsKey === state.lastSavedKey) return;

        return progressRef(user, mapId).set({
            foundIds: normalizedIds,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            state.lastSavedKey = idsKey;
        }).catch(error => {
            reportError(state, "Не удалось сохранить прогресс в Google Cloud Firestore:", error);
        });
    };

    window.syncMapProgressToCloud = async function (mapId, getLocalIds, applyIds) {
        const user = auth.currentUser;
        if (!user) throw new Error("Сначала войдите через Google.");

        let state = mapStates.get(mapId);
        if (!state || state.uid !== user.uid) {
            state = { uid: user.uid, ready: false, lastSavedKey: null, syncPromise: null, getLocalIds, applyIds, onError: null };
            mapStates.set(mapId, state);
        }

        state.getLocalIds = getLocalIds;
        state.applyIds = applyIds;
        return synchronizeProgress(user, mapId, state, true);
    };

    window.syncUserMarkersToCloud = async function (mapId, localMarkers) {
        const user = auth.currentUser;
        if (!user) throw new Error("Войдите через Google, чтобы синхронизировать свои метки.");

        const ref = customMarkersRef(user, mapId);
        const snapshot = await readProgress(ref);
        if (auth.currentUser?.uid !== user.uid) return [];

        const cloudMarkers = snapshot.exists && Array.isArray(snapshot.data().markers)
            ? snapshot.data().markers
            : [];
        const markersById = new Map(
            cloudMarkers
                .filter(marker => marker && marker.id != null)
                .map(marker => [String(marker.id), marker])
        );
        for (const marker of localMarkers) {
            if (marker && marker.id != null) markersById.set(String(marker.id), marker);
        }

        const markers = Array.from(markersById.values());
        if (JSON.stringify(markers) !== JSON.stringify(cloudMarkers)) {
            await ref.set({
                markers,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        return markers;
    };

    window.addEventListener("offline", () => {
        const error = new Error("Нет подключения к сети. Прогресс сохранён локально и будет синхронизирован после подключения.");
        for (const state of mapStates.values()) {
            if (state.onError) state.onError(error);
        }
    });

    window.addEventListener("online", () => {
        const user = auth.currentUser;
        if (!user) return;
        for (const [mapId, state] of mapStates) {
            if (state.uid !== user.uid) continue;
            synchronizeProgress(user, mapId, state).catch(error => {
                reportError(state, "Не удалось повторно синхронизировать прогресс:", error);
            });
        }
    });
})();