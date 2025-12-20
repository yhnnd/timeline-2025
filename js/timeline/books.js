/** Requires param.js */
/** Requires books-index.js */

const bookNames = window.bookNames;

const bookList = document.getElementsByClassName("book-list");
if (bookList.length) {
    for (const i in bookNames) {
        if (i > 0) {
            const listItem = document.createElement("li");
            const link = document.createElement("a");
            link.href = "javascript: openFile(\"book.html?book=" + i + "\");";
            link.innerHTML = "<span>" + i + "</span>";
            if (bookNames[i].startsWith("致王震書")) {
                link.innerHTML += '&nbsp;<span class="rounded-circle" style="display: inline-block; width: 1rem; height: 1rem; background: var(--studio-blue-50); position: relative; top: 3px;"></span>';
                link.innerHTML += '&nbsp;<span class="rounded-circle" style="display: inline-block; width: 1rem; height: 1rem; background: var(--studio-green-30); position: relative; top: 3px; left: -10px;"></span>';
            } else if (bookNames[i].startsWith("王震來信")) {
                link.innerHTML += '&nbsp;<span class="rounded-circle" style="display: inline-block; width: 1rem; height: 1rem; background: var(--studio-red-50); position: relative; top: 3px;"></span>';
                link.innerHTML += '&nbsp;<span class="rounded-circle" style="display: inline-block; width: 1rem; height: 1rem; background: var(--studio-yellow-30); position: relative; top: 3px; left: -10px;"></span>';
            }
            link.innerHTML += "&nbsp;<span>" + bookNames[i] + "</span>";
            listItem.append(link);
            if (window.books[i]?.indexList?.length) {
                listItem.innerHTML += "<div class='highlight-green' style='margin-left: 16px;'>(" + window.books[i].indexList.length + ")</div>";
            } else {
                listItem.innerHTML += "<div class='highlight-red' style='margin-left: 16px;'>(no text content)</div>";
            }
            bookList[0].append(listItem);
        }
    }
}

function previewFile(link, iframeSrc) {
    /** link has navbar, iframeSrc has no navbar */
    if (localStorage.getItem("enable-file-preview") === "true") {
        const iframe = document.querySelector(".reader>iframe");
        iframe.setAttribute("data-link", link);
        iframe.src = iframeSrc;
    }
}

function openFile(link) {
    if (link == undefined) {
        link = document.querySelector(".reader>iframe").getAttribute("data-link");
    }
    if (!link) {
        return;
    }
    showTimelineLoading && showTimelineLoading();
    window.open(link, "_self");
}

function getBookDateRangeByFakeUrl (firstFakeUrl, lastFakeUrl) {
    let begin = '', end = '';
    const val = firstFakeUrl.split("/")[2].split('-');
    if (Number.isNaN(Number(val[2])) || Number.isNaN(Number(val[3]))) {
        begin = firstFakeUrl.split("/")[3].split(".").slice(0, 2).join(".");
        end = lastFakeUrl.split("/")[3].split(".").slice(0, 2).join(".");
    } else {
        begin = val[2] + '.' + val[3];
        end = val[4] + '.' + val[5];
    }
    return begin + ' - ' + end;
}

let timelineHtml = "";
for (const i in bookNames) {
    if (i > 0) {
        const indexList = window.books[i].indexList;
        const time = indexList.length > 0 ?
            getBookDateRangeByFakeUrl(indexList[0].fakeUrl, indexList[indexList.length - 1].fakeUrl)
            : "&nbsp;";
        const url = "book.html?book=" + i;
        timelineHtml += "<div class=node onclick='openFile(\"" + url + "\")'><span><span>" + time + "</span></span></div>";
    }
}
const timeline = document.getElementById("timeline");
if (timeline) {
    timeline.innerHTML = timelineHtml;
}