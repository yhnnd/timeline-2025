function getBrowserName() {
    /* Since Edge pretend to be Chrome, we should check edge before the others. */
    if (navigator.userAgentData?.brands?.find(e => e.brand == "Microsoft Edge") !== undefined) {
        return "edge";
    }
    const info = navigator.userAgent.toLowerCase();
    const names = ["firefox", "chrome", "safari"];
    for (const name of names) {
        if (info.indexOf(name) >= 0) {
            return name;
        }
    }
    return navigator.userAgentData?.brands[0]?.brand;
}

const app = angular.module('module-index', []);

app.controller("controller", function ($scope, $http, $timeout, $interval, $window, $sce) {
    $scope.webBrowserName = $window.getBrowserName();

    $scope.card_to_create = {
        "id": "",
        "type": "text",
        "text": ""
    };
});

let isComputerKeyboard = false;

// 监听键盘按下的监听器
function keyPressListener(event, storage, tools, $scope) {
    // 16 是 Shift, 49 是 '1', Shift + '1' 是 '!'
    // 如果在一个空行的行首输入了 !, 就询问是否插入图片
    if (storage.prevKeyCode === 16 && event.keyCode === 49 && tools.getCursorPosition() === 0 && event.target.innerHTML === "") {
        insertImageLine(event, tools);
    } else if (storage.prevKeyCode === 16 && event.keyCode === 50 && tools.getCursorPosition() === 0 && event.target.innerHTML === "") {
        insertIconLine(event, tools);
    } else if (event.key === "$" && storage.prevKeyCode === 16 && tools.getCursorPosition() === 0 && event.target.innerHTML === "") {
        insertTime(event, tools);
    } else if (event.key === "+") {
        insertCounter(event, tools);
    } else if (event.key === '&') {
        insertAnchor(event, tools);
    } else if (event.key === '*') {
        insertLink(event, tools);
    }
    // 记录上次按下的键
    storage.prevKeyCode = event.keyCode;
    // 判断是否按下了 shift 键
    if (event.keyCode === 16) {
        isComputerKeyboard = true;
    }
}


// 监听文本行改变的监听器
function onTextChange(newVal, storage, event, tools) {
    if (!isComputerKeyboard) {
        // 不是使用电脑键盘 shift 键输入的
        if (newVal === "!") {
            insertImageLine(event, tools);
        } else if (newVal === "@") {
            insertIconLine(event, tools);
        }
    }
}


v2_7.init(".form-control-v2-7#card-to-create-text-v2-7", function($scope, text) {
    $scope.card_to_create.text = text;
    $scope.$apply();
}, keyPressListener, onTextChange);

v2_7.reload = async function () {
    const $scope = v2_7.getScope();
    const lines = $scope.card_to_create.text.split("\n");
    const linesApplied = [];
    return await new Promise((resolve, reject) => {
        if (lines && lines.length) {
            v2_7.empty().then(async (target) => {
                target.text(lines[0]);
                linesApplied.push(target.text());
                for (var i = 1; i < lines.length; ++i) {
                    linesApplied.push(lines[i]);
                    target = await v2_7.insertNewLine(lines[i], target);
                }
                resolve(linesApplied);
            });
        }
    });
}

v2_7.initHelp = function () {
    var id = "help-prompt-" + new Date().getTime();
    var totalTime = 60;
    v2_7.data.helpTitle = "v2.7 卡片编辑器 功能介绍";
    v2_7.data.helpContent = "<div>" +
        "   <p>在一个空行中, 输入 \"!\" 可以插入图片, " +
        "       <span class='d-block'>也就是将卡片附件中的图片插入到卡片正文中</span>" +
        "   </p>" +
        "   <p>在一个空行中, 输入 \"@\" 可以插入用户头像</p>" +
        "   <p>由于技术问题, 目前不支持多行选择, 仅支持单行选择</p>" +
        "   <p>本介绍将在 <span id='" + id + "'>" + totalTime + "</span> 秒后自动关闭</p>" +
        "</div>";
    v2_7.data.helpClass = "alert-success";
    var timeLeft = totalTime * 1000;
    var timer = setInterval(() => {
        timeLeft -= 1000;
        var timeField = $("#" + id);
        if (timeLeft <= 0) {
            var prompt = timeField.closest(".alert");
            if (prompt && prompt.length) {
                removeAlert(prompt);
            }
            window.clearInterval(timer);
        } else {
            timeField.text(timeLeft / 1000);
        }
    }, 1000);
}