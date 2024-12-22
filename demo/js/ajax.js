function decodeBase64(text) {
    return new TextDecoder().decode(Uint8Array.from(atob(text), (c) => c.charCodeAt(0)));
}

function decode(t){if(t.startsWith('@utf("')&&t.endsWith('");')){t=(t=t.replaceAll("&lt;","<")).substr(6,t.length-6-3);const e=[];let s="",n="",r=!1,h=!1;for(let l=0;l<t.length;++l){const o=t[l];"<"===o?(r&&(e.push({text:s,isZh:!0}),s=""),h=!0,r=!1,n=""):">"===o?(h&&(e.push({text:n,isEn:!0}),n=""),h=!1,r=!0,s=""):h||r?r?s+=o:h&&(n+=o):(r=!0,s=o)}s.length&&e.push({text:s,isZh:!0});let l="";for(const t of e)t.isEn?l+=t.text:t.isZh&&(l+=function(t){const e=t.text;let s="";for(let t=0;t<e.length;++t)t%2==0&&(s+="%"),s+=e[t];let n="";try{n=decodeURIComponent(s)}catch{return e}return n}(t));return l}return t.startsWith('@base64("')&&t.endsWith('");')?(t=t.substr(9,t.length-9-3),decodeBase64(t)):t}

function ajax(url, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    // If specified, responseType must be empty string or "text"
    xhr.responseType = "text";
    xhr.onload = function () {
        if (xhr.readyState === xhr.DONE) {
            if (xhr.status === 200) {
                const responseText = xhr.responseText.split("\n").map(line => {
                    return line.split(" ").map(decode).join(" ");
                }).join("\n");
                callback(responseText, xhr.response);
            }
        }
    };
    xhr.send();
}

function openFile(filename, url) {
    if (url == undefined) {
        url = filename;
    }
    const modal = document.getElementsByClassName("modal")[0];
    if (modal != undefined) {
        modal.classList.add("opened");
        modal.innerHTML = "<div class='scroll'><div class='centered'>" +
            "<div class='title'>" + filename +
            "<button class='close float-right' onclick='closeModal()'>Close</button></div>" +
            "<div class='article-content'></div></div></div>";
        document.body.classList.add("modal-opened");
        ajax(url, function (text) {
            let content = "";
            for (let line of text.split("\n")) {
                let parsedLine = parseRichText(line);
                if (parsedLine.startsWith("<img ") && window.parseFakeUrl) {
                    parsedLine = window.parseFakeUrl(parsedLine, {realUrl: url});
                }
                if (parsedLine == "") {
                    parsedLine = "<br>";
                }
                content += "<pre class=\"line\">" + parsedLine + "</pre>";
            }
            modal.querySelector(".article-content").innerHTML = content;
        });
    }
}

function openArticle(bookName, number) {
    const articles = window.books[bookName].indexList;
    const article = articles[number - 1];
    if (article != undefined) {
        openFile(article.realUrl.split("/").pop(), article.realUrl);
    }
}

function closeModal() {
    const modal = document.getElementsByClassName("modal")[0];
    modal.classList.remove("opened");
    modal.innerHTML = "";
    document.body.classList.remove("modal-opened");
}

function openBook(bookName) {
    const books = document.querySelectorAll(".book");
    for (const book of books) {
        book.classList.remove("opened");
        if (book.getAttribute("book-name") == bookName) {
            book.classList.add("opened");
        }
    }

    const articles = window.books[bookName].indexList;
    const container = document.getElementById("articles");
    container.innerHTML = "";
    let counter = 1;
    for (let article of articles) {
        const articleNumber = counter++;
        let div = document.createElement("div");
        div.classList = ["article"];
        div.id = "article-" + articleNumber;
        div.innerHTML = "<div>" + article.realUrl.split("/").pop() + "</div><div class='text' style='max-height: 100px;overflow: hidden;'></div>";
        div.setAttribute("onclick", "openArticle('" + bookName + "','" + articleNumber + "')");
        container.append(div);

        ajax(article.realUrl, function (responseText) {
            container.querySelector("#article-" + articleNumber + " > .text").innerText = responseText;
        });
    }
}

if (window.onload) {
    window.onloadPrev = window.onload;
}
window.onload = function () {
    if (window.onloadPrev) {
        window.onloadPrev();
    }
    const container = document.getElementById("books");
    for (const [key, value] of Object.entries(window.books)) {
        let div = document.createElement("div");
        div.classList.add("book");
        div.innerHTML = (() => {
            if (value.indexList?.length) {
                const routeSegments = value.indexList[0].realUrl.split("/");
                routeSegments.pop();
                const bookNameSegments = routeSegments.pop().split("-");
                return "<div class='book-id-indicator'>" + bookNameSegments[0] + "</div>" + bookNameSegments.pop();
            }
            return "<div class='book-id-indicator'>" + key + "</div>";
        })();
        div.setAttribute("book-name", key);
        div.setAttribute("onclick", "openBook('" + key + "')");
        container.append(div);
    }
    openBook(1);
}