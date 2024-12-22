// Thu Dec 07 2023
function ajax(url, responseText, callback, errorCallback) {
    if (responseText != undefined && callback && typeof callback === "function") {
        // short circuit.
        callback(responseText);
        return;
    }
    const req = new XMLHttpRequest();
    req.addEventListener("load", () => {
        if (callback && typeof callback === "function") {
            callback(req.responseText);
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