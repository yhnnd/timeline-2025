// Mon Jan 06 2025
// Requires localforage.nopromises.min.js 
window.isCacheEnabled = true;
window.db = window["localforage"] || window["localStorage"];

function setCache(key, value) {
    return window.db.setItem("cache[\"" + key + "\"]", JSON.stringify(value));
}

async function getCache(key) {
    let cache = await window.db.getItem("cache[\"" + key + "\"]");
    if (cache === undefined || cache === null) {
        return cache;
    } else {
        try {
            cache = JSON.parse(cache);
        } catch {
            cache = null;
        }
        return cache;
    }
}

function ajax(url, responseText, callback, errorCallback) {
    if (responseText != undefined && callback && typeof callback === "function") {
        // short circuit.
        callback(responseText);
        return;
    } else if (window.isCacheEnabled && callback && typeof callback === "function") {
        const cache = getCache(url);
        if (cache !== undefined && cache !== null) {
            callback(cache);
            return;
        }
    }
    const req = new XMLHttpRequest();
    req.addEventListener("load", () => {
        if (callback && typeof callback === "function") {
            callback(req.responseText);
            if (window.isCacheEnabled) {
                setCache(url, req.responseText);
            }
        } else {
            console.log("loadData: no callback");
        }
    });
    req.addEventListener("error", () => {
        if (errorCallback && typeof errorCallback === "function") {
            errorCallback(req);
        } else {
            console.log("loadData: no errorCallback");
        }
    });
    req.open("GET", url);
    req.send();
}
