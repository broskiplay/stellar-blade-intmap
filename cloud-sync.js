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

    function progressRef(user, mapId) {
        return db.collection("users").doc(user.uid).collection("mapProgress").doc(mapId);
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

    async function synchronizeProgress(user, mapId, state, forceWrite = false) {
        if (state.syncPromise) return state.syncPromise;

        const syncPromise = (async () => {
            const ref = progressRef(user, mapId);
            const snapshot = await ref.get();
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
                console.error("Не удалось загрузить прогресс из Google Cloud Firestore:", error);
                if (state.onError) state.onError(error);
            });
        });
    };

    window.saveMapProgressToCloud = function (mapId, foundIds) {
        const user = auth.currentUser;
        const state = mapStates.get(mapId);
        if (!user || !state || state.uid !== user.uid) return;

        if (!state.ready) {
            return synchronizeProgress(user, mapId, state).catch(error => {
                console.error("Не удалось загрузить прогресс из Google Cloud Firestore:", error);
                if (state.onError) state.onError(error);
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
            console.error("Не удалось сохранить прогресс в Google Cloud Firestore:", error);
            if (state.onError) state.onError(error);
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
})();