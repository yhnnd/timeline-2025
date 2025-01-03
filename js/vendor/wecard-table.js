(function () {

    function parse(line) {
        let tableCells = [], tmpout = "", tmpin = "", isOpen = false, n = 0, isQuoted = false;
        // Read all {text} in table cells.
        for (const char of line) {
            if (isOpen === true) {
                if (char === '"') {
                    isQuoted = !isQuoted;
                }
                if (isQuoted === false && char === "}") {
                    isOpen = false;
                    tableCells[n] = tmpin;
                    tmpin = "";
                }
            }
            if (isOpen === true) {
                tmpin += char;
            } else {
                tmpout += char;
                if (char === ",") {
                    ++n;
                }
            }
            if (char === "{" && isOpen === false) {
                isOpen = true;
                isQuoted = false;
            }
        }

        const layers = tmpout.split(":").map(e => e.trim()).map(function(e) {
            if (e.startsWith("[")) {
                e = e.replace("[", "").replace("]", "");
                return e.split(",").map(e => e.trim());
            }
            return e;
        });

        const getNode = function (query) {
            const x = query.split(".");
            let id = null, result = null;
            for (let i = 0; i < x.length; i++) {
                let z = x[i].split("#");
                if (i == 0) {
                    result = document.createElement(z[0]);
                    if (z[0] == "script") {
                        result.setAttribute("type", "text/javascript-unsafe");
                    }
                } else {
                    result.classList.add(z[0]);
                }
                if (z.length > 1) {
                    id = z[1];
                }
            }
            if (id) {
                result.setAttribute("id", id);
            }
            return result;
        };

        let root = null;
        let curr = null;
        for (const e of layers) {
            if (!curr) {
                curr = getNode(e);
                root = curr;
            } else if (typeof e === "string") {
                const temp = getNode(e);
                const rand = ("" + Math.random()).split(".")[1];
                temp.setAttribute("rand", rand);
                curr.append(temp);
                curr = curr.querySelector("[rand='" + rand + "']");
                curr.removeAttribute("rand");
            } else if (e instanceof Array) {
                for (let i = 0; i < e.length; ++i) {
                    const p = e[i].split("=").map(u => u.trim());
                    const temp = getNode(p[0]);
                    temp.innerText = tableCells[i] || "";
                    curr.append(temp);
                }
            }
        }
        return root;
    }


    function parseTable(lines) {
        let root = null, head = null, body = null;
        for (const line of lines) {
            if (line.startsWith("table")) {
                root = parse(line);
            } else if (line.startsWith("thead")) {
                head = parse(line);
            } else if (line.startsWith("tbody")) {
                body = parse(line);
            } else if (line.startsWith("tr")) {
                if (body) {
                    body.append(parse(line));
                } else if (head) {
                    head.append(parse(line));
                } else {
                    body = document.createElement("tbody");
                    body.append(parse(line));
                }
            }
        }
        if (!root) {
            root = document.createElement("table");
        }
        root.append(head);
        root.append(body);
        return root;
    }


    function compileTable(table) {
        if (!table) {
            return false;
        }

        if (typeof table === "string") {
            const temp = document.createElement("div");
            temp.innerHTML = table;
            table = temp.querySelector("table");
        }

        // Compile Table
        let tableTagName = table.tagName.toLowerCase();
        let tableClassName = table.className;
        let s0 = tableTagName;
        if (tableClassName) {
            s0 += "." + tableClassName;
        }

        // Compile THead
        const thead = table.querySelector("thead");
        const theadTr = table.querySelector("thead > tr");
        const theadTrTds = theadTr.querySelectorAll("td,th");
        let s1 = thead.tagName.toLowerCase();
        if (thead.className) {
            s1 += "." + thead.className;
        }
        s1 += " : " + "tr";
        if (theadTr.className) {
            s1 += "." + theadTr.className;
        }
        s1 += " : [";
        for (let i = 0; i < theadTrTds.length; ++i) {
            let td = theadTrTds[i];
            s1 += td.tagName.toLowerCase();
            if (td.className) {
                s1 += "." + td.className;
            }
            if (td.innerHTML) {
                s1 += " = {" + td.innerHTML + "}";
            }
            if (i + 1 < theadTrTds.length) {
                s1 += ", ";
            }
        }
        s1 += "]";

        // Compile TBody
        const tbody = table.querySelector("tbody");
        const tbodyTrs = table.querySelectorAll("tbody > tr");
        let s2 = tbody.tagName.toLowerCase();
        if (tbody.className) {
            s2 += "." + tbody.className;
        }

        const lines = [s0, s1, s2];
        // Compile TBody Tr
        for (let r = 0; r < tbodyTrs.length; ++r) {
            const tr = tbodyTrs[r];
            let sr = tr.tagName.toLowerCase();
            if (tr.className) {
                sr += "." + tr.className;
            }
            sr += " : [";
            let tbodyTrTds = tr.querySelectorAll("td,th");
            for (let i = 0; i < tbodyTrTds.length; ++i) {
                let td = tbodyTrTds[i];
                sr += td.tagName.toLowerCase();
                if (td.className) {
                    sr += "." + td.className;
                }
                if (td.innerHTML) {
                    sr += " = {" + td.innerHTML + "}";
                }
                if (i + 1 < tbodyTrTds.length) {
                    sr += ", ";
                }
            }
            sr += "]";
            lines.push(sr);
        }

        return lines;
    }


    function createTable() {
        const table = `<table border="1">
        <thead>
            <tr>
                <th><textarea></textarea></th>
                <th><textarea></textarea></th>
                <th><textarea></textarea></th>
            </tr>
        </thead>
        
        <tbody>
            <tr>
                <td rowspan="2"><textarea></textarea></td>
                <td><textarea></textarea></td>
                <td><textarea></textarea></td>
            </tr>
            <tr>
                <td><textarea></textarea></td>
                <td><textarea></textarea></td>
            </tr>
            <tr>
                <td><textarea></textarea></td>
                <td><textarea></textarea></td>
                <td><textarea></textarea></td>
            </tr>
        </tbody>
    </table>`;
        return table;
    }

    function test1() {
        const scripts = [
            // "thead : tr : [th = {A}, th = {B}]", 
            // "tbody: tr: [td={:={[]}, td={:={[]}]", 
            // "tr : [td={C}, td={D}]"
            "table.table-stripped",
            "thead.t-head : tr : [th = {A}, th = {B}]", 
            "tbody.t-body : tr : [td = {:={[]}, td = {:={[]}]", 
            "tr : [td={C}, td={D}]"
        ];
        return {
            "scripts": scripts,
            "table": parseTable(scripts)
        };
    }

    function test2() {
        const scripts = [
            "table",
            "thead : tr : [th={col 1}, th={col 2}, th={col 3}]",
            "tbody",
            "tr : [td = {abc}, td = {abc}, td = {abc}]",
            "tr : [td = {1}, td = {2}]",
            "tr : [td, td, td = {hello wcml}]"
        ];
        return {
            "scripts": scripts,
            "table": parseTable(scripts)
        };
    }

    this.WeCardTable = {
        "parseTable": parseTable,
        "compileTable": compileTable,
        "createTable": createTable,
        "test1": test1,
        "test2": test2
    }
})();
