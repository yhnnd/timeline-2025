const backdropClassName = "backdrop-" + ("" + Math.random() * 10).split(".").join("");

function toggleMap(button, event) {
    event.stopPropagation();
    if (!button) {
        button = document.querySelector(".map-wrapper.on button");
    }
    button.parentElement.parentElement.classList.toggle('on');
    if (button.innerText === "close") {
        button.innerText = "expand";
        document.body.removeChild(document.querySelector("." + backdropClassName));
    } else {
        button.innerText = "close";
        const backdrop = document.createElement("div");
        backdrop.classList = "map-backdrop " + backdropClassName;
        setTimeout(() => {
            backdrop.classList.add("on");
            backdrop.setAttribute("onclick", "toggleMap(null, event)");
        }, 0);
        document.body.append(backdrop);
    }
}

function getMapHtml(id) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("map-wrapper");
    const buttonWrapper = document.createElement("div");
    buttonWrapper.classList.add("button-wrapper");
    const button = document.createElement("button");
    button.innerText = "expand";
    button.setAttribute("onclick", "toggleMap(this, event)");
    const map = document.createElement("div");
    map.classList.add("map");
    map.id = id;
    wrapper.append(map);
    buttonWrapper.append(button);
    wrapper.append(buttonWrapper);
    const outerWrapper = document.createElement("div");
    outerWrapper.classList.add("outer-wrapper");
    outerWrapper.append(wrapper);
    return outerWrapper.outerHTML;
}

function parseMaps(text) {
    const lines = text.split('\n');
    const identifier = '@map ';
    const maps = [], src = [];
    for (let i = 0; i < lines.length; ++i) {
        if (lines[i].startsWith(identifier)) {
            src.push(lines[i]);
            const mapData = (new Function("return " + lines[i].substr(identifier.length)))();
            maps.push(mapData);
            lines[i] = getMapHtml(mapData.id);
        }
    }
    return {
        text: lines.join('\n'),
        maps: maps,
        src: src
    };
}

function renderMap(id, center, zoomLevel, marks) {
    const map = L.map(id).setView(center, zoomLevel);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '<a href="http://www.openstreetmap.org/">OpenStreetMap</a>'
    }).addTo(map);
    if (marks) {
        marks.forEach(e => L.marker(e).addTo(map));
    }
    map.on('click', function (e) {
        if (document.querySelector("." + backdropClassName)) {
            toast(e.latlng);
            const marker = L.marker(e.latlng).addTo(map);
        }
    });
}

function renderMaps(maps) {
    for (item of maps) {
        renderMap(item.id, item.center, item.zoomLevel, item.marks);
    }
}

function toast(text) {
    const message = document.createElement("div");
    message.setAttribute("onclick", "event.stopPropagation()");
    message.classList = "toast";
    message.innerHTML = "<div class='text-bg'>" + text + "</div><div class='text'>" + text + "</div>";
    const timeLeft = document.createElement("div");
    timeLeft.classList = "time-left";
    message.prepend(timeLeft);
    const backdrop = document.querySelector("." + backdropClassName);
    backdrop.append(message);
    setTimeout(() => {
        timeLeft.classList.add("started");
        setTimeout(() => {
            backdrop.removeChild(message);
        }, 5000);
    }, 10000);
}