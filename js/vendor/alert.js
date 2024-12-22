// 隐藏弹窗警告
function removeAlert(myAlert) {
    myAlert.fadeOut(300);
    setTimeout(() => {
        myAlert.remove();
    }, 300);
}




function bsAlert(title, content, alertClass, duration) {
    let alertType = "";
    if (!content) {
        content = title;
        if (content.indexOf(":") > 0) {
            if (content.indexOf("[") == 0) {
                alertType = content.substr(0, content.indexOf("]") + 1).trim();
                title = content.substr(content.indexOf("]") + 1, content.indexOf(":") - content.indexOf("]")).trim();
                content = content.substr(content.indexOf(":") + 1).trim();
                alertClass = ["[ERROR]", "[error]"].includes(alertType) ? "alert-danger" : "alert-secondary";
            } else {
                title = content.substr(0, content.indexOf(":") + 1).trim();
                content = content.substr(content.indexOf(":") + 1).trim();
                alertClass = "alert-warning";
            }
        } else {
            title = "";
            alertClass = "alert-secondary";
        }
    } else if (!alertClass) {
        alertClass = "alert-danger";
    }
    if (!duration) {
        duration = 3000;
    }

    let myTitle = $("<div class='d-flex align-items-center justify-content-between'>")
        .html("<small>" + title + "</small>")
        .append("<i class='fa fa-times-circle fa-lg cursor-pointer' onclick='$(this).parent().closest(\".alert\").remove()'>");
    let myAlert = $("<div class='fixed-top mt-5 mx-auto w-100 w-lg-50 alert " + alertClass + " border-radius-0'>")
        .css("z-index", 1501)
        .append(myTitle)
        .append("<hr>")
        .append("<p class='mb-2'>" + content + "</p>")
        .appendTo("body");
    if (duration && duration > 0) {
        setTimeout(() => {
            removeAlert(myAlert);
        }, duration);
    }

    return [alertType, title, content, alertClass];
}




function bsConfirm(params) {
    let title = "";
    let content = "";
    let alertClass = "";
    if (typeof params === "string") {// (params instanceof String) is always false
        title = arguments[0];
        content = arguments[1];
        alertClass = arguments[2];
    } else {
        title = params.title;
        content = params.content;
        alertClass = params.alertClass;
    }

    let confirmText = params.confirmText;
    const confirmCallback = params.confirmCallback;
    let rejectText = params.rejectText;
    const rejectCallback = params.rejectCallback;

    if (!confirmText) {
        confirmText = "Confirm";
    }
    if (!rejectText) {
        rejectText = "Cancel";
    }

    let getRandomString = window.getRandomString;

    if (getRandomString === undefined) {
        getRandomString = function () {
            return ("" + Math.random() * 10).split(".").join("");
        }
    }

    const id = getRandomString();
    const modalId = "modal-" + id;
    const dialogueId = "dialogue-" + id;

    const unlock = $("body.modal-open").length ? function () {
        /* If there is modal opened before this modal,
        Then we should not remove that modal backdrop when we close this modal. */
    } : function () {
        $("body").removeClass("modal-open");
    };

    function bsConfirmCloseModal() {
        $("#" + modalId).remove();
        $("#" + dialogueId).remove();
        unlock();
    }

    const myTitle = $("<div class='d-flex align-items-center justify-content-between'>")
        .html("<small>" + title + "</small>")
        .append($("<i class='fa fa-times-circle fa-lg cursor-pointer'>").on("click", bsConfirmCloseModal));

    const confirmButtonId = "confirm-" + id;
    const rejectButtonId = "reject-" + id;

    $("<div class='fixed-top mt-5 mx-auto w-100 w-lg-50 alert " + alertClass + " border-radius-0'>")
        .attr("id", dialogueId)
        .css("z-index", 1501)
        .append(myTitle)
        .append("<hr>")
        .append("<p class='mb-2 overflow-scroll' style='max-height:calc(100vh - 240px)!important;'>" + content + "</p>")
        .append("<div class='mb-2'>" +
            "   <button class='btn btn-outline-primary mx-auto' id='" + confirmButtonId + "'>" + confirmText + "</button>" +
            "   <button class='btn btn-outline-danger mx-auto' id='" + rejectButtonId + "'>" + rejectText + "</button>" +
            "</div>")
        .appendTo("body");
    $("#" + confirmButtonId).on("click", function() {
        if (confirmCallback && typeof confirmCallback === "function") {
            confirmCallback();
        }
        bsConfirmCloseModal();
    });
    $("#" + rejectButtonId).on("click", function() {
        if (rejectCallback && typeof rejectCallback === "function") {
            rejectCallback();
        }
        bsConfirmCloseModal();
    });
    const backdrop = $("<div class='modal-backdrop show' id='" + modalId + "' style='z-index: 1200!important;'>").on("click", bsConfirmCloseModal);
    $("body").addClass("modal-open").append(backdrop);

    return [title, content, alertClass, confirmButtonId, rejectButtonId];
}