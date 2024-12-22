function ios_button_init(scope) {
    scope = document.querySelector(scope);
    if (scope.length === 0) {
        throw "ios_button_init: cannot find scope";
    }

    function button_on(target) {
        const key = target.getAttribute("data-key");
        localStorage.setItem(key, "true");
        target.setAttribute("data-value", "true");
        document.body.setAttribute("data-value-of-" + key, "true");
    }
    
    function button_off(target) {
        const key = target.getAttribute("data-key");
        localStorage.setItem(key, "false");
        target.setAttribute("data-value", "false");
        document.body.setAttribute("data-value-of-" + key, "false");
    }
    
    function getButtonValue(target) {
        if (target === undefined) {
            throw "target not found";
        }
        const key = target.getAttribute("data-key");
        return localStorage.getItem(key) == "true";
    }

    scope.querySelectorAll('.ios-button').forEach(function (elem) {
        if (getButtonValue(elem)) {
            button_on(elem);
        } else {
            button_off(elem);
        }
        elem.addEventListener("click", function (event) {
            event.stopPropagation();
            if (getButtonValue(elem) === true) {
                button_off(elem);
            } else {
                button_on(elem);
            }
        });
    });
}