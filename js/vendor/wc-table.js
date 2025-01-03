(function () {

    function parse(s) {
        let ins = [], tmpout = "", tmpin = "", isOpen = false, n = 0, isQuoted = false;
        // Read all {text} in table cells.
        for (let i = 0; i < s.length; i++) {
            if (isOpen === true) {
                if (s[i] === '"') {
                    isQuoted = !isQuoted;
                }
                if (isQuoted === false && s[i] === "}") {
                    isOpen = false;
                    ins[n] = tmpin;
                    tmpin = "";
                }
            }
            if (isOpen === true) {
                tmpin += s[i];
            } else {
                tmpout += s[i];
                if (s[i] === ",") {
                    ++n;
                }
            }
            if (s[i] === "{" && isOpen === false) {
                isOpen = true;
                isQuoted = false;
            }
        }
        
        l = tmpout.split(":").map(e => e.trim()).map(function(e) {
            if(e.startsWith("[")) {
                e = e.replace("[", "").replace("]", "");
                return e.split(",").map(e => e.trim());
            }
            return e;
        });
        let root = null;
        let a = null;
        let node = function (q) {
            let x = q.split("."), id = null, d = null;
            for (let i = 0; i < x.length; i++) {
                let z = x[i].split("#");
                if (i == 0) {
                    d = document.createElement(z[0]);
                    if (z[0] == "script") {
                        d.setAttribute("type", "text/javascript-unsafe");
                    }
                } else {
                    d.classList.add(z[0]);
                }
                if (z.length > 1) {
                    id = z[1];
                }
            }
            if (id) {
                d.setAttribute("id", id);
            }
            return d;
        };
    
        for (e of l) {
            if (!a) {
                a = node(e);
                root = a;
            } else if (typeof e === "string") {
                const temp = node(e);
                const rand = ("" + Math.random()).split(".")[1];
                temp.setAttribute("rand", rand);
                a.append(temp);
                a = a.querySelector("[rand='" + rand + "']");
                a.removeAttribute("rand");
            } else if (e instanceof Array) {
                for (let i = 0; i < e.length; ++i) {
                    p = e[i].split("=").map(u => u.trim());
                    const temp = node(p[0]);
                    temp.innerText = ins[i] || "";
                    a.append(temp);
                }
            }
        }
        return root;
    }
    
    function parseTable(lines) {
        let r = null, head = null, body = null;
        
        for (let i = 0; i < lines.length; ++i) {
            let l = lines[i];
            if (l.startsWith("table")) {
                r = parse(l);
            } else if (l.startsWith("thead")) {
                head = parse(l);
            } else if (l.startsWith("tbody")) {
                body = parse(l);
            } else if (l.startsWith("tr")) {
                if (body) {
                    body.append(parse(l));
                } else if (head) {
                    head.append(parse(l));
                } else {
                    body = document.createElement("tbody");
                    body.append(parse(l));
                }
            }
        }
        if (!r) {
            r = document.createElement("table");
        }
        r.append(head);
        r.append(body);
        return r;
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
    
        let lines = [s0, s1, s2];
        // Compile TBody Tr
        for (let r = 0; r < tbodyTrs.length; ++r) {
            let tr = tbodyTrs[r];
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
        let table = `<table border="1">
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

    this.wcTable = {
        "parseTable": parseTable,
        "compileTable": compileTable,
        "createTable": createTable,
        "test1": test1,
        "test2": test2
    }
})();
