// Thu Dec 07 2023
// require function ajax

const articles = [];

const searchInfo = {
    counter: 0,
    isLoading: false,
    isReady: false,
    hasUnfinishedTask: false,
    unfinishedTaskType: "",
    keywords: []
};

function decodeBase64(text) {
    return new TextDecoder().decode(Uint8Array.from(atob(text), (c) => c.charCodeAt(0)));
}

function decode(fragment) {
    if (fragment.startsWith("@utf(\"") && fragment.endsWith("\");")) {
        fragment = fragment.replaceAll("&lt;", "<");
        fragment = fragment.substr("@utf(\"".length, fragment.length - "@utf(\"".length - "\");".length);
        const segments = [];
        let tempZh = "", tempEn = "", isInZh = false, isInEn = false;
        for (let i = 0; i < fragment.length; ++i) {
            const ch = fragment[i];
            if (ch === "<") {
                if (isInZh) {
                    segments.push({
                        text: tempZh,
                        isZh: true
                    });
                    tempZh = "";
                }
                isInEn = true;
                isInZh = false;
                tempEn = "";
            } else if (ch === ">") {
                if (isInEn) {
                    segments.push({
                        text: tempEn,
                        isEn: true
                    });
                    tempEn = "";
                }
                isInEn = false;
                isInZh = true;
                tempZh = "";
            } else {
                if (!isInEn && !isInZh) {
                    isInZh = true;
                    tempZh = ch;
                } else if (isInZh) {
                    tempZh += ch;
                } else if (isInEn) {
                    tempEn += ch;
                }
            }
        }
        if (tempZh.length) {
            segments.push({
                text: tempZh,
                isZh: true
            });
        }
        let result = "";
        for (const segment of segments) {
            if (segment.isEn) {
                result += segment.text;
            } else if (segment.isZh) {
                result += (function (segment) {
                    const encodedZh = segment.text;
                    let handle = "";
                    for (let i = 0; i < encodedZh.length; ++i) {
                        if (i % 2 === 0) {
                            handle += "%";
                        }
                        handle += encodedZh[i];
                    }
                    let decodedZh = "";
                    try {
                        decodedZh = decodeURIComponent(handle);
                    } catch {
                        return encodedZh;
                    }
                    return decodedZh;
                })(segment);
            }
        }
        return result;
    } else if (fragment.startsWith("@base64(\"") && fragment.endsWith("\");")) {
        fragment = fragment.substr("@base64(\"".length, fragment.length - "@base64(\"".length - "\");".length);
        return decodeBase64(fragment);
    }
    return fragment;
}

function initSearch(resultWrapper, configs) {
    if (articles.length == 0) {
        for (const book of window.books) {
            if (book != undefined && book["indexList"] != undefined) {
                for (const { fakeUrl, realUrl } of book["indexList"]) {
                    articles.push({
                        "fakeUrl": fakeUrl,
                        "realUrl": realUrl,
                        "text": undefined
                    });
                }
            }
        }
    }
    searchInfo.counter = 0;
    searchInfo.isLoading = true;
    searchInfo.isReady = false;
    const infoDom = document.querySelector(".global-navbar .info") || document.querySelector("#navbar .info");

    function searchLoading() {
        if (++searchInfo.counter == articles.length) {
            searchInfo.isLoading = false;
            searchInfo.isReady = true;
            infoDom.innerText = "Search Ready";
            if (searchInfo.hasUnfinishedTask) {
                if (searchInfo.keywords.length) {
                    if (searchInfo.unfinishedTaskType === "searchKeywords") {
                        searchKeywords(searchInfo.keywords, configs);
                    } else if (searchInfo.unfinishedTaskType === "advancedSearch") {
                        advancedSearch(searchInfo.keywords);
                    }
                }
                searchInfo.hasUnfinishedTask = false;
                searchInfo.keywords = [];
            }
        } else {
            const indicator = "Search Loading " + searchInfo.counter + "/" + articles.length;
            infoDom.innerText = indicator;
            resultWrapper.innerText = indicator;
        }
    }

    for (const i in articles) {
        const url = articles[i].realUrl;
        ajax(url, articles[i]["text"], window.localStorage.getItem("enable-cache-for-search") === "true", function (responseText) {
            articles[i].text = responseText;
            searchLoading();
        }, function () {
            articles[i].text = "";
            searchLoading();
        });
    }
}

function searchInput(input, configs) {
    if ((input == undefined || input.value == undefined || input.value == "") && (!configs || !configs.type || ["text", "title"].includes(configs.type))) {
        return false;
    }
    const keywords = input.value.split(",");
    searchKeywords(keywords, configs);
}

function searchElement(element) {
    const nameIndex = element.getAttribute("data-name-index");
    if (nameIndex == undefined) {
        return false;
    }
    const keywords = window.peoplesNames[nameIndex];
    searchKeywords(keywords);
}

function searchKeywords(keywords, configs) {
    const searchWrapper = document.getElementsByClassName("search")[0];
    const keywordWrapper = document.getElementsByClassName("search-keyword")[0];
    const resultWrapper = searchWrapper.getElementsByClassName("search-result")[0];
    document.body.classList.add("modal-open");
    searchWrapper.parentElement.classList.add("on");
    keywordWrapper.innerText = keywords.join(",");
    keywordWrapper.parentElement.classList.add("on");
    if (searchInfo.isReady) {
        resultWrapper.innerHTML = "";
        for (const item of articles) {
            if (!item.text || !item.text.length) {
                continue;
            }
            item.text = item.text.split("\n").map(line => {
                return line.split(" ").map(decode).join(" ");
            }).join("\n");
            let times = 0;
            let isMatched = false;
            for (const keyword of keywords) {
                if (!keyword || !keyword.length) {
                    continue;
                }
                if (!configs || !configs.type || configs.type === "text") {
                    if (item.text.includes(keyword)) {
                        isMatched = true;
                        times += item.text.split(keyword).length - 1;
                    }
                } else if (configs.type === "image") {
                    if (item.text.split("\n").find(line => line.includes("<img ") && line.includes(keyword))) {
                        isMatched = true;
                        times += item.text.split("\n").filter(line => line.includes("<img ") && line.includes(keyword)).length;
                    }
                } else if (configs.type === "filename") {
                    const urlSegments = item.fakeUrl.split("/");
                    const filename = urlSegments.pop();
                    if (filename.includes(keyword)) {
                        isMatched = true;
                        times += filename.split(keyword).length - 1;
                    }
                } else if (configs.type === "folder") {
                    const urlSegments = item.fakeUrl.split("/");
                    urlSegments.pop();
                    const folder = urlSegments.pop();
                    if (folder.includes(keyword)) {
                        isMatched = true;
                        times += folder.split(keyword).length - 1;
                    }
                }
            }
            if (isMatched == true) {
                let link = document.createElement("div");
                link.classList.add("link");
                link.setAttribute("data-times", times);
                const nameSplit = item.fakeUrl.split("/");
                item.filename = nameSplit.pop();
                item.folder = nameSplit.pop();
                const folder = (configs && configs.type === "folder") ? highlight(item.folder, keywords, configs) : item.folder;
                const filename = (configs && configs.type === "filename") ? highlight(item.filename, keywords, configs) : item.filename;
                const textContent = (!configs || !configs.type || ["text", "image"].includes(configs.type)) ? highlight(item.text, keywords, configs) : item.text;
                const lines = textContent.split("\n");
                const imgs = [], maxSizeOfImgs = 8;
                for (let i = 0; i < lines.length; ++i) {
                    if (lines[i].startsWith('<img ')) {
                        if (imgs.length < maxSizeOfImgs) {
                            imgs.push(lines[i]);
                        } else {
                            lines[i] = lines[i].replace("<", "&lt;");
                        }
                    }
                }
                let targetUrl = "book-reader.html?fakeUrl=" + item.fakeUrl;
                window.sessionStorage.setItem("q", JSON.stringify(keywords));
                if (configs) {
                    window.sessionStorage.setItem("conf", JSON.stringify(configs));
                }
                link.innerHTML = "<a target='_self' href='" + targetUrl + "'>"
                    + "<span class='folder'>" + folder + "</span> / <span>" + filename + "</span></a>"
                    + "<div class='cover-wrapper'><div class='cover' onclick=\"window.open('" + targetUrl + "','_self','noopener,noreferrer');\"></div></div>"
                    + "<div class='text' fake-url=\"" + item.fakeUrl + "\"><pre></pre></div>";
                resultWrapper.appendChild(link);
                resultWrapper.querySelector(`.text[fake-url="${item.fakeUrl}"]>pre`).innerHTML = lines.join("\n");
                resultWrapper.querySelectorAll(".marker-wrapper").forEach(marker => {
                    marker.scrollIntoView({behavior: 'instant', block: 'center'});
                });
                document.querySelector(".search-backdrop.on").scrollTo({top: 0, left: 0, behavior: "instant"});
            }
        }
        if (resultWrapper.innerHTML === "") {
            resultWrapper.innerHTML = "No Result";
        }
    } else {
        searchInfo.hasUnfinishedTask = true;
        searchInfo.unfinishedTaskType = "searchKeywords";
        searchInfo.keywords = keywords;
        if (searchInfo.isLoading == false) {
            initSearch(resultWrapper, configs);
        }
    }
}

function highlight(text, keywords, configs) {
    text = text.replaceAll("<", "&lt;");
    for (const keyword of keywords) {
        if (!keyword) {
            continue;
        }
        if (!configs || !configs.type || ["text", "folder", "filename"].includes(configs.type)) {
            const marker = "<code class='marker-wrapper'><var class='marker'><span>" + keyword.split("").map(ch => ch === '<' ? "&lt;" : ch).join("</span><span>") + "</span></var></code>";
            text = text.replaceAll(keyword.replaceAll("<", "&lt;"), marker);
        } else if (configs.type === "image") {
            text = text.split("\n").map(line => {
                if (line.includes("&lt;img ") && line.includes(keyword) && !line.includes("<code class='marker-wrapper'><var class='marker'>")) {
                    const tmp = document.createElement("div");
                    tmp.innerHTML = line.replace("&lt;img ", "<img ");
                    if (!tmp.querySelector("img").classList.contains("thumbnail")) {
                        tmp.querySelector("img").classList.add("thumbnail-2x");
                    }
                    return "<code class='marker-wrapper'><var class='marker'><span>" + tmp.innerHTML + "</span></var></code>";
                } else {
                    return line;
                }
            }).join("\n");
        }
    }
    return text;
}

function closeSearch() {
    const target = document.getElementsByClassName("search-backdrop")[0];
    target.classList.remove("on");
    const searchBar = document.getElementsByClassName("search-bar")[0];
    searchBar.classList.remove("on");
    document.body.classList.remove("modal-open");
    searchInfo.hasUnfinishedTask = false;
    searchInfo.keywords = [];
    window.sessionStorage.removeItem("q");
    window.sessionStorage.removeItem("conf");
}

function doAdvancedSearch(conditions, keywords) {
    const resultWrapper = document.getElementsByClassName("search-result")[0];
    resultWrapper.innerHTML = "";
    for (const item of articles) {
        item.text = item.text.split("\n").map(line => {
            return line.split(" ").map(decode).join(" ");
        }).join("\n");
        let isMatched = true;
        for (const condition of conditions) {
            if (condition.type === "TEXT") {
                if (!item.text.includes(condition.value)) {
                    isMatched = false;
                    break;
                }
            } else if (condition.type === "TIME") {
                const urlSegments = item.fakeUrl.split("/");
                const filename = urlSegments.pop();
                if (condition.value.includes("-")) {
                    let [timeA, timeB] = condition.value.split("-").map(e => parseInt(e));
                    let isTimeMatched = false;
                    for (let tempTime = timeA; tempTime <= timeB; ++tempTime) {
                        if (filename.includes(tempTime) || item.text.includes(tempTime + " 年") || item.text.includes(tempTime + "年")) {
                            isTimeMatched = true;
                            break;
                        }
                    }
                    if (!isTimeMatched) {
                        isMatched = false;
                        break;
                    }
                } else {
                    let tempTime = parseInt(condition.value);
                    if (filename.includes(tempTime) || item.text.includes(tempTime + " 年") || item.text.includes(tempTime + "年")) {
                    } else {
                        isMatched = false;
                        break;
                    }
                }
            }
        }
        if (isMatched == true) {
            let link = document.createElement("div");
            link.classList.add("link");
            link.setAttribute("data-times", true);
            const nameSplit = item.fakeUrl.split("/");
            item.filename = nameSplit.pop();
            item.folder = nameSplit.pop();
            const folder = item.folder;
            const filename = item.filename;
            const textContent = highlight(item.text, keywords);
            const lines = textContent.split("\n");
            const imgs = [], maxSizeOfImgs = 8;
            for (let i = 0; i < lines.length; ++i) {
                if (lines[i].startsWith('<img ')) {
                    if (imgs.length < maxSizeOfImgs) {
                        imgs.push(lines[i]);
                    } else {
                        lines[i] = lines[i].replace("<", "&lt;");
                    }
                }
            }
            link.innerHTML = "<a target='_self' href='book-reader.html?fakeUrl=" + item.fakeUrl + "'>"
                + "<span class='folder'>" + folder + "</span> / <span>" + filename + "</span></a>"
                + "<div class='cover-wrapper'><div class='cover' onclick=\"window.open('book-reader.html?fakeUrl=" + item.fakeUrl + "','_self','noopener,noreferrer');\"></div></div>"
                + "<div class='text'><pre>" + lines.join("\n") + "</pre></div>";
            resultWrapper.appendChild(link);
            resultWrapper.querySelectorAll(".marker-wrapper").forEach(marker => {
                marker.scrollIntoView({behavior: 'instant', block: 'center'});
            });
            document.querySelector(".search-backdrop.on").scrollTo({top: 0, left: 0, behavior: "instant"});
        }
    }
    if (resultWrapper.innerHTML === "") {
        resultWrapper.innerHTML = "No Result";
    }
}

function advancedSearch(conditions) {
    const searchWrapper = document.getElementsByClassName("search")[0];
    const keywordWrapper = document.getElementsByClassName("search-keyword")[0];
    const resultWrapper = document.getElementsByClassName("search-result")[0];
    document.body.classList.add("modal-open");
    searchWrapper.parentElement.classList.add("on");
    const keywords = [];
    keywordWrapper.innerHTML = "";
    for (const condition of conditions) {
        let conditionInput = document.createElement("input");
        conditionInput.value = condition.value;
        conditionInput.type = "text";
        conditionInput.setAttribute("condition-type", condition.type);
        keywordWrapper.append(conditionInput);
        if (condition.type === "TEXT") {
            keywords.push(condition.value);
        }
    }
    const refreshBtn = document.createElement("button");
    refreshBtn.innerHTML = "refresh";
    refreshBtn.setAttribute("onclick", "refreshAdvancedSearch();");
    keywordWrapper.append(refreshBtn);
    keywordWrapper.parentElement.classList.add("on");
    if (searchInfo.isReady) {
        doAdvancedSearch(conditions, keywords);
    } else {
        searchInfo.hasUnfinishedTask = true;
        searchInfo.unfinishedTaskType = "advancedSearch";
        searchInfo.keywords = conditions;
        if (searchInfo.isLoading == false) {
            initSearch(resultWrapper);
        }
    }
}

function refreshAdvancedSearch() {
    if (!searchInfo.isReady) {
        return;
    }
    const keywordWrapper = document.getElementsByClassName("search-keyword")[0];
    const conditions = [];
    const conditionInputs = keywordWrapper.querySelectorAll("input");
    const keywords = [];
    for (let i = 0; i < conditionInputs.length; ++i) {
        const conditionInput = conditionInputs[i];
        if (!conditionInput.value) {
            continue;
        }
        const condition = {
            type: conditionInput.getAttribute("condition-type"),
            value: conditionInput.value
        };
        conditions.push(condition);
        if (condition.type === "TEXT") {
            keywords.push(condition.value);
        }
    }
    doAdvancedSearch(conditions, keywords);
}
