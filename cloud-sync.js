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

    window.connectMapProgressSync = function (mapId, getLocalIds, applyIds) {
        auth.onAuthStateChanged(async user => {
            const state = { uid: user?.uid, ready: false };
            mapStates.set(mapId, state);
            if (!user) return;

            try {
                const ref = progressRef(user, mapId);
                const snapshot = await ref.get();
                if (mapStates.get(mapId) !== state || auth.currentUser?.uid !== user.uid) return;

                const cloudIds = snapshot.exists && Array.isArray(snapshot.data().foundIds)
                    ? snapshot.data().foundIds
                    : [];
                const mergedIds = Array.from(new Set([...getLocalIds(), ...cloudIds]));
                applyIds(mergedIds);
                state.ready = true;
                await ref.set({
                    foundIds: mergedIds,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (error) {
                console.error("Не удалось загрузить прогресс из Google Cloud Firestore:", error);
            }
        });
    };

    window.saveMapProgressToCloud = function (mapId, foundIds) {
        const user = auth.currentUser;
        const state = mapStates.get(mapId);
        if (!user || !state?.ready || state.uid !== user.uid) return;

        return progressRef(user, mapId).set({
            foundIds: Array.from(new Set(foundIds)),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(error => {
            console.error("Не удалось сохранить прогресс в Google Cloud Firestore:", error);
        });
    };
})();