/*
parseParameter(null, {"name":"bob", "sex": "male"})
"name=bob&sex=male"

parseParameter("user", {"name":"bob", "sex": "male"})
"user.name=bob&user.sex=male"

parseParameter(null, {"name": "bob", friends: ["alice", "amy"]})
"name=bob&friends[0]=alice&friends[1]=amy"

parseParameter("friends",["alice", "amy"])
"friends[0]=alice&friends[1]=amy"

parseParameter("friends",[{"name":"alice","sex":"female"}, {"name":"bob","sex":"male"}])
"friends[0].name=alice&friends[0].sex=female&friends[1].name=bob&friends[1].sex=male"

parseParameter(null, {"name": "Chad", friends: [{"name":"alice","sex":"female"}, {"name":"bob","sex":"male"}]})
"name=Chad&friends[0].name=alice&friends[0].sex=female&friends[1].name=bob&friends[1].sex=male"

parseParameter("user", {"name": "Chad", friends: [{"name":"alice","sex":"female"}, {"name":"bob","sex":"male"}]})
"user.name=Chad&user.friends[0].name=alice&user.friends[0].sex=female&user.friends[1].name=bob&user.friends[1].sex=male"
**/
function parseParameter(key, value, mode) {
    let paramStr = "";
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        paramStr += "&" + key + "=" + encodeURIComponent(value);
    } else {
        $.each(value, function (index, elem) {
            let child;
            if (key === null || key === undefined) {
                child = index;
            } else if (value instanceof Array) {
                child = key + "[" + index + "]";
            } else if (mode === undefined) {
                child = key + "." + index;
            } else {
                child = key + "[\"" + index + "\"]";
            }
            paramStr += '&' + parseParameter(child, elem);
        });
    }
    return paramStr.substr(1);
}



function getParameter(name) {
    let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    let r = window.location.search.substr(1).match(reg);
    if (r) return decodeURIComponent(r[2]);
    return null;
}



async function runSyncFunctions() {
    const functions = [...arguments];
    let resultFunction = functions.pop();
    for (let i = functions.length; i > 0; --i) {
        const nextFunction = resultFunction;
        resultFunction = async function () {
            await functions[i - 1]();
            return new Promise(function (resolve) {
                setTimeout(function () {
                    resolve(nextFunction());
                });
            });
        }
    }
    return await resultFunction();
}