(function () {

    function parse(s) {
        var ins = [], tmpout = "", tmpin = "", open = false, n = 0, nOpen = 0, nClose = 0, isQuoted = false;
        // Read all {text} in table cells.
        for (var i = 0; i < s.length; i++) {
            if (open === true) {
                if (s[i] === '"') {
                    isQuoted = !isQuoted;
                }
                if (isQuoted === false && s[i] === "}" && ++nClose === nOpen) {
                    open = false;
                    ins[n] = tmpin;
                    tmpin = "";
                }
            }
            if (open === true) {
                tmpin += s[i];
                if (isQuoted === false && s[i] === "{") {
                    ++nOpen;
                }
            } else {
                tmpout += s[i];
                if (s[i] === ",") {
                    ++n;
                }
            }
            if (s[i] === "{" && open === false) {
                open = true;
                isQuoted = false;
                nOpen = 1;
                nClose = 0;
            }
        }
        
        l = tmpout.split(":").map(e => e.trim()).map(function(e) {
            if(e.startsWith("[")) {
                e = e.replace("[","").replace("]","");
                return e.split(",").map(e => e.trim());
            }
            return e;
        });
        var root = null;
        var a = null;
        var node = function (q) {
            var x = q.split("."), id = null, d = null;
            for (var i = 0; i < x.length; i++) {
                var z = x[i].split("#");
                if (i == 0) {
                    d = $(document.createElement(z[0]));
                    if (z[0] == "script") {
                        d.attr("type", "text/javascript-unsafe");
                    }
                } else {
                    d.addClass(z[0]);
                }
                if (z.length > 1) {
                    id = z[1];
                }
            }
            if (id) {
                d.attr("id", id);
            }
            return d;
        };
    
        for (e of l) {
            if (!a) {
                a = node(e);
                root = a;
            } else if (typeof e === "string") {
                a = node(e).appendTo(a);
            } else if (e instanceof Array) {
                for (var i = 0; i < e.length; ++i) {
                    p = e[i].split("=").map(u => u.trim());
                    node(p[0]).text(ins[i]).appendTo(a);
                }
            }
        }
        return root;
    }
    
    function parseTable(lines) {
        var r = null, head = null, body = null;
        
        for (var i = 0; i < lines.length; ++i) {
            var l = lines[i];
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
                    body = $("<tbody>");
                    body.append(parse(l));
                }
            }
        }
        if (!r) {
            r = $("<table>");
        }
        r.append(head).append(body);
        return r;
    }
    
    
    function compileTable(table) {
        if (!table) {
            return false;
        }
    
        if (!table.length) {
            table = $(table);
        }
    
        // Compile Table
        let tableTagName = table[0].tagName.toLowerCase();
        let tableClassName = table[0].className;
        
        let s0 = tableTagName;
        if (tableClassName) {
            s0 += "." + tableClassName;
        }
        
        // Compile THead
        let thead = table.find("thead");
        let theadTagName = thead[0].tagName.toLowerCase();
        let theadClassName = thead[0].className;
        let theadTr = table.find("thead > tr");
        let theadTrClassName = theadTr[0].className;
        let theadTrTd = theadTr.find("td,th");
    
        let s1 = theadTagName;
        if (theadClassName) {
            s1 += "." + theadClassName;
        }
        s1 += " : " + "tr";
        if (theadTrClassName) {
            s1 += "." + theadTrClassName;
        }
        s1 += " : [";
        for (let i = 0; i < theadTrTd.length; ++i) {
            let td = theadTrTd[i];
            s1 += td.tagName.toLowerCase();
            if (td.className) {
                s1 += "." + td.className;
            }
            if (td.textContent) {
                s1 += " = {" + td.textContent + "}";
            }
            if (i + 1 < theadTrTd.length) {
                s1 += ", ";
            }
        }
        s1 += "]";
        
        // Compile TBody
        let tbody = $(table).find("tbody");
        let tbodyTagName = tbody[0].tagName.toLowerCase();
        let tbodyClassName = tbody[0].className;
        let tbodyTr = $(table).find("tbody > tr");
        
        let s2 = tbodyTagName;
        if (tbodyClassName) {
            s2 += "." + tbodyClassName;
        }
    
        let lines = [s0, s1, s2];
        // Compile TBody Tr
        for (let r = 0; r < tbodyTr.length; ++r) {
            let tr = tbodyTr[r];
            let trTagName = tr.tagName.toLowerCase();
            let trClassName = tr.className;
            let sr = trTagName;
            if (trClassName) {
                sr += "." + trClassName;
            }
            sr += " : [";
            let tbodyTrTd = $(tr).find("td,th");
            for (let i = 0; i < tbodyTrTd.length; ++i) {
                let td = tbodyTrTd[i];
                sr += td.tagName.toLowerCase();
                if (td.className) {
                    sr += "." + td.className;
                }
                if (td.textContent) {
                    sr += " = {" + td.textContent + "}";
                }
                if (i + 1 < tbodyTrTd.length) {
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
        var scripts = [
            // "thead : tr : [th = {A}, th = {B}]", 
            // "tbody: tr: [td={:={[]}, td={:={[]}]", 
            // "tr : [td={C}, td={D}]"
            "table.table-stripped",
            "thead.t-head : tr : [th = {A}, th = {B}]", 
            "tbody.t-body : tr : [td = {:={[]}, td = {:={[]}]", 
            "tr : [td={C}, td={D}]"
        ];
        return parseTable(scripts);
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
        return parseTable(scripts);
    }

    this.wcTable = {
        "parseTable": parseTable
    }
})();