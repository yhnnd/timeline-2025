function button_on(target) {
    button = $(target).closest(".ios-button");
    button.attr("data-value", "1");
}

function button_off(target) {
    button = $(target).closest(".ios-button");
    button.attr("data-value", "0");
}

function getButtonValue(target) {
    target = $(target).closest(".ios-button");
    if (target === undefined) {
        throw "target not found";
    }
    const value = target.attr("data-value");
    if (value === undefined) {
        throw {
            "message": "target has no value",
            "target": target,
        };
    }
    if (["1", "true"].includes(value)) {
        return true;
    } else if (["0", "false"].includes(value)) {
        return false;
    } else {
        throw "target has illegal value " + value;
    }
}

function ios_button_init(scope) {
    scope = $(scope);
    if (scope.length === 0) {
        throw "ios_button_init: cannot find scope";
    }
    scope.find('.ios-button').each(function (index, elem) {
        if (getButtonValue(elem)) {
            button_on(elem);
        } else {
            button_off(elem);
        }
        const On = $(elem).attr("data-button-on");
        const Off = $(elem).attr("data-button-off");
        if (On !== undefined && Off !== undefined) {
            $(elem).off("click").on("click", function (event) {
                if (getButtonValue(event.target) === true) {
                    button_off(elem);
                    eval(Off);
                } else {
                    button_on(elem);
                    eval(On);
                }
            });
        }
    });
}