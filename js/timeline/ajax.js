// Thu Dec 07 2023
// Mon Jan 06 2025
window.isCacheEnabled = true;

function setCache(key, value) {
    return localStorage.setItem("cache[\"" + key + "\"]", value);
}

function getCache(key) {
    return localStorage.getItem("cache[\"" + key + "\"]");
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