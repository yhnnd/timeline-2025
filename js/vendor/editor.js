var v2_7 = {
    fieldSelector: false,
    field: false,
    saveCallback: false,
    ENTER: 13,
    DELETE: 8,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    lineNumberEnabled: true,
    createTimeEnabled: true,
    historyCapacity: 1024,
    data: {
        prevKeyCode: false,
        helpTitle: "",
        helpContent: "",
        helpClass: ""
    },
    observerMap: new Map(),
    onTextChange: null,
    getTools: function() {
        const self = this;
        return {
            "insertNewLine": function (text, target) {
                return self.insertNewLine(text, target);
            },
            "setCaretPosition": function (element, pos) {
                return self.setCaretPosition(element, pos);
            },
            "setCursorPosition": function (pos) {
                return self.setCursorPosition(pos);
            },
            "getCursorPosition": function () {
                return self.getCursorPosition();
            }
        };
    },
    help: function () {
        if ($(".help-prompt").length) {
            removeAlert($(".help-prompt"));
        }
        bsAlert(this.data.helpTitle, this.data.helpContent, this.data.helpClass + " help-prompt", -1);
    },
    getField: function() {
        if (this.fieldSelector) {
            return $(this.fieldSelector);
        } else {
            return false;
        }
    },
    getAllLineElements: function () {
        return this.field.children();
    },
    getScope: function () {
        let model = document.querySelector('[ng-controller="controller"]');
        let scope = angular.element(model).scope();
        if (!scope) {
            throw "v2.7 editor: get scope failed";
        }
        return scope;
    },
    getNewLine: function(attr) {
        const hash = this.getRandomString().substring(0, 12);
        const time = new Date();
        const id = "text-editable-" + hash + "-" + time.getTime();
        const newLine = $("<pre id=\"" + id + "\" class=\"line break-all text-editable\">");
        newLine.attr({
            "data-create-date": time.toLocaleDateString(),
            "data-create-time": time.toLocaleTimeString(),
            "data-hash": hash.substring(0, 3) + "@" + hash.substring(8),
        });
        if (attr) {
            newLine.attr(attr);
        }
        return newLine;
    },
    insertNewLine: async function (text, target) {
        // 获取当前文本行
        if (target !== undefined) {
            target = $(target).closest(".text-editable");
        } else {
            target = this.field.find(".text-editable").last();
        }
        if (this.isLineElement(target) || this.isEditableTextElement(target)) {
            // 新的文本行
            const newLine = this.getNewLine();
            if (text) {
                newLine.text(text);
            }
            // Disable Current Line Editability
            target.removeAttr("contenteditable");
            // Insert new line after current line
            target.after(newLine);
            // 获取新的文本行 DOM
            let newLineApplied = target.siblings("#" + newLine.attr("id"));
            if (newLineApplied.length) {
                // 为新的文本行 DOM 添加监听编辑事件
                newLineApplied = await this.addEditListener(newLineApplied);
                // 将光标移动到新的文本行的开始
                return newLineApplied;
            } else {
                throw "insertNewLine: failed to insert new line";
            }
        } else {
            throw "insertNewLine: target is not valid";
        }
    },
    // 第一个参数是编辑区域的选择器, 类型是字符串
    // 第二个参数是保存编辑区域内容的回调函数, 调用的时候会注入参数 $scope 和 text
    // 其中
    //      $scope 是外部作用域
    //      text 是编辑区域的内容
    // 第三个参数是自定义的按键监听器, 调用的时候会注入参数 event, this.data, tools 以及 $scope
    // 其中
    //      event 是按键事件
    //      this.data 是存放自定义数据的空间, editor 不会访问其中的内容
    //      tools 是 editor 的公开方法的集合
    //      $scope 就是 editor 所绑定的作用域
    init: function(fieldSelector, saveCallback, keyPressListener, onTextChange) {
        // 绑定编辑区域
        this.fieldSelector = fieldSelector;
        // 绑定保存函数
        this.saveCallback = saveCallback;
        // 绑定编辑区域
        this.field = this.getField();
        // 绑定聚焦监听器
        this.addFocusListener();
        // Add Keydown Listener
        this.addKeydownListener();
        // Add Drag Listener
        this.addDragListener(this.field);
        // 注册按键监听器
        this.keyPressListener = keyPressListener;
        // 注册文本改变监听器
        this.onTextChange = onTextChange;
    },
    // 绑定点击事件, 当点击编辑区域的时候, 添加自定义的 focus 类
    addFocusListener: function() {
        const self = this;
        $(document).on("click", function(event) {
            const target = $(event.target);
            if (target.closest(self.fieldSelector).length === 1) {
                const selection = self.getSelection();
                if ($(selection.anchorNode).is($(selection.focusNode)) && selection.anchorOffset === selection.focusOffset) {
                    self.focusField(target);
                } else {
                    self.field.addClass("focus");
                }
            } else if (self.isFieldFocused()) {
                self.blurField();
                self.save();
            }
        });
    },
    getSelection: function () {
        let selection = undefined;
        if (window.getSelection) {
            selection = window.getSelection();
        } else if (document.getSelection) {
            selection = document.getSelection();
        }
        return selection;
    },
    isFieldFocused: function () {
        return this.field.hasClass("focus");
    },
    focusLastLine: function () {
        console.log("v2.7 editor: focus last line.");
        const self = this;
        const allLines = $(self.getAllLineElements());
        if (allLines.length > 0) {
            allLines.removeAttr("contenteditable");
            allLines.last().attr("contenteditable", true).focus();
            const lastLineTextLength = allLines.last().text().length;
            self.setCursorPosition(lastLineTextLength);
        }
    },
    focusField: function (target, cursorPosition) {
        console.log("v2.7 editor: focus field.");
        const self = this;
        const allLines = $(self.getAllLineElements());
        if (allLines.length === 0) {
            self.empty();
            self.focusLastLine();
        } else if (self.isLineElement(target)) {
            // If target is specific line
            allLines.removeAttr("contenteditable");
            target.attr({"contenteditable": true}).focus();
            if (cursorPosition !== undefined) {
                self.setCursorPosition(cursorPosition);
            }
        } else if (self.field.text().length === 0 || self.field.hasClass("selecting") === false) {
            // If target is field not line
            self.focusLastLine();
        }
        self.field.addClass("focus");
    },
    blurField: function() {
        console.log("v2.7 editor: field blurred.");
        $(this.getAllLineElements()).blur().removeAttr("contenteditable");
        this.field.removeClass("focus");
    },
    isLineElement: function (element) {
        return element !== undefined && element.is(".line.text-editable");
    },
    isEditableTextElement: function (element) {
        return element !== undefined && element.is(".text-editable");
    },
    getLineElementFromTextNode: function (text) {
        return $(text).closest(".line.text-editable");
    },
    getSelectedLines: function () {
        const self = this;
        const selection = self.getSelection();
        // Base Node
        const baseNode = $(selection.baseNode !== undefined ? selection.baseNode : selection.anchorNode);
        const realBaseNode = self.isLineElement(baseNode) ? baseNode : self.getLineElementFromTextNode(baseNode);
        const base = {
            "node": realBaseNode,
            "index": realBaseNode.index(),
            "offset": selection.baseOffset !== undefined ? selection.baseOffset : selection.anchorOffset,
        };
        // Extend Node
        const extentNode = $(selection.extentNode !== undefined ? selection.extentNode : selection.focusNode);
        const realExtentNode = self.isLineElement(extentNode) ? extentNode : self.getLineElementFromTextNode(extentNode);
        const extend = {
            "node": realExtentNode,
            "index": realExtentNode.index(),
            "offset": selection.extentOffset !== undefined ? selection.extentOffset : selection.focusOffset,
        };
        // Computed Order
        const from = Math.min(base.index, extend.index), to = Math.max(base.index, extend.index);
        const allLines = self.getAllLineElements();
        const linesSelected = [];
        const fromLine = from === base.index ? base : extend;
        const toLine = to === base.index ? base : extend;
        if (fromLine.index < toLine.index) {
            linesSelected.push(fromLine);
            for (let i = from + 1; i < to; ++i) {
                linesSelected.push({
                    "node": allLines.eq(i),
                    "index": i
                });
            }
            linesSelected.push(toLine);
        } else if (realBaseNode.attr("id") === realExtentNode.attr("id")) {
            const fromOffset = Math.min(base.offset, extend.offset);
            const toOffset = Math.max(base.offset, extend.offset);
            const realFrom = fromOffset === base.offset ? base : extend;
            const realTo = toOffset === base.offset ? base : extend;
            linesSelected.push(realFrom);
            linesSelected.push(realTo);
        } else {
            throw "getSelectedLines: error";
        }
        return linesSelected;
    },
    clearSelection: function () {
        // https://stackoverflow.com/questions/3169786/clear-text-selection-with-javascript
        let sel;
        if (window.getSelection) {
            sel = window.getSelection();
            if (sel.empty) {// Chrome
                sel.empty();
            } else if (sel.removeAllRanges) {// Firefox
                sel.removeAllRanges();
            }
        } else if (document.selection) {// IE?
            document.selection.empty();
        }
    },
    getCaretCharOffset: function (element) {
        if (element === undefined) {
            throw "getCaretCharOffset: element undefined";
        }
        // https://stackoverflow.com/questions/3972014/get-contenteditable-caret-position/#answer-30400227
        var caretOffset = 0;
        if (window.getSelection) {
            var range = window.getSelection().getRangeAt(0);
            var preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(element);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            caretOffset = preCaretRange.toString().length;
        }
        else if (document.selection && document.selection.type != "Control") {
            var textRange = document.selection.createRange();
            var preCaretTextRange = document.body.createTextRange();
            preCaretTextRange.moveToElementText(element);
            preCaretTextRange.setEndPoint("EndToEnd", textRange);
            caretOffset = preCaretTextRange.text.length;
        }
        return caretOffset;
    },
    getCaretPosition: function (editableElement) {
        if (editableElement === undefined) {
            throw "getCaretPosition: editableElement undefined";
        }
        // https://stackoverflow.com/questions/3972014/get-contenteditable-caret-position/#answer-3976125
        var caretPos = 0, sel, range;
        if (window.getSelection) {
            sel = window.getSelection();
            if (sel.rangeCount) {
                range = sel.getRangeAt(0);
                if (range.commonAncestorContainer.parentNode == editableElement) {
                    caretPos = range.endOffset;
                }
            }
        } else if (document.selection && document.selection.createRange) {
            range = document.selection.createRange();
            if (range.parentElement() == editableElement) {
                var tempEl = document.createElement("span");
                editableElement.insertBefore(tempEl, editableElement.firstChild);
                var tempRange = range.duplicate();
                tempRange.moveToElementText(tempEl);
                tempRange.setEndPoint("EndToEnd", range);
                caretPos = tempRange.text.length;
            }
        }
        return caretPos;
    },
    setCaretPosition: function (el, char) {// character at which to place caret
        if (el === undefined || el.lastChild === undefined) {
            throw "setCaretPosition: error element not defined";
        }
        if (char === undefined) {
            throw "setCaretPosition: error char not defined";
        }
        // https://stackoverflow.com/questions/6249095/how-to-set-the-caret-cursor-position-in-a-contenteditable-element-div/#answer-55377676
        let sel;
        if (window.getSelection) {// Chrome
            sel = window.getSelection();
            sel.collapse(el.lastChild, char);
        } else if (document.selection) {// IE?
            sel = document.selection.createRange();
            sel.moveStart('character', char);
            sel.select();
        }
    },
    deleteSelectedTextInline: function () {
        // 1
        // baseOffset: 5
        // extentOffset: 0
        // 2
        // baseOffset: 12
        // extentOffset: 17
        const sel = this.getSelectedLines();
        console.log("sel = ", sel);
        const target = sel[0].node;
        const from = sel[0].offset, to = sel[1].offset;
        const text = target.text();
        const textA = text.substring(0, from), textB = text.substring(from, to), textC = text.substring(to);
        if (textA + textB + textC === text) {
            target.text(textA + textC);
            target.click();
            this.setCaretPosition(target[0], from);
            return true;
        } else {
            throw "deleteSelectedTextInline: error";
        }
    },
    deleteSelectedText: function () {
        const self = this;
        const linesSelected = self.getSelectedLines();
        const begin = linesSelected.shift();
        const end = linesSelected.pop();
        if (begin.index !== end.index) {
            function splitLine(line) {
                const text = line.node.text();
                const offset = line.offset;
                return [text.substr(0, offset), text.substr(offset)];
            }
            const beginLineSplitted = splitLine(begin);
            const endLineSplitted = splitLine(end);
            begin.node.text(beginLineSplitted[0] + endLineSplitted[1]);
            for (let i = 0; i < linesSelected.length; ++i) {
                self.deleteLine(linesSelected[i].node);
            }
            self.deleteLine(end.node);
            self.clearSelection();
            begin.node.click();
            self.setCaretPosition(begin.node[0], begin.offset);
            return true;
        } else {
            return this.deleteSelectedTextInline();
        }
    },
    addKeydownListener: function () {
        const self = this;
        $(document).off("keydown").on("keydown", function (event) {
            if (event.keyCode === self.DELETE) {
                if (self.isFieldFocused() === true && self.field.find("[contenteditable='true']").length === 0) {
                    if (self.deleteSelectedText() === true) {
                        event.preventDefault();
                    }
                }
            }
        });
    },
    getRandomString: function () {
        return ("" + Math.random() * 10).split(".").join("");
    },
    getLineMaxWidth: function () {
        return 644;
    },
    getTheoreticalLineMaxChar: function () {
        return 66;/* when line width is 644 */
    },
    getCharWidth: function () {
        const lineMaxWidth = this.getLineMaxWidth();
        const lineMaxChar = this.getTheoreticalLineMaxChar();
        const charWidth = lineMaxWidth / lineMaxChar;/* 9.757575757575758 */
        return charWidth;
    },
    getComputedLineMaxChar: function (lineElement) {
        const charWidth = this.getCharWidth();
        return Math.ceil(lineElement.innerWidth() / charWidth);
    },
    getEditInfo: function (lineElement, clickEvent) {
        const caretInfo = {
            "cursorPosition": this.getCursorPosition(),
            "caretPosition": this.getCaretPosition(lineElement[0]),
            "caretOffset": this.getCaretCharOffset(lineElement[0]),
        };
        if (clickEvent) {
            const charWidth = this.getCharWidth();
            const offsetX = Math.ceil(clickEvent.offsetX / charWidth);
            const offsetY = Math.ceil(clickEvent.offsetY / 24);
            const index = offsetX + (() => {
                if (offsetY > 1) {
                    const actualLineMax = this.getComputedLineMaxChar(lineElement);
                    return (offsetY - 1) * actualLineMax;
                }
                return 0;
            })();
            const clickInfo = {
                "index": index,
                "x": offsetX,
                "y": offsetY,
            }
            return Object.assign(caretInfo, clickInfo);
        }
        return caretInfo;
    },
    handleLineClick: function (lineElement, event) {
        event.stopPropagation();
        if (lineElement.has("contenteditable") === "true" || (window.getBrowserName() === "firefox" && this.field.hasClass("selecting"))) {
        } else {
            event.preventDefault();
            this.focusField(lineElement);
            const pos = this.getEditInfo(lineElement, event);
            console.log("v2.7 editor: clicking " + lineElement.attr("id") + " " + JSON.stringify(pos));
        }
    },
    addDragListener: async function(element) {
        const self = this;
        await (async function () {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, 100);
            });
        })();
        const browserName = window.getBrowserName();
        if (browserName === "chrome") {
            element.data("isListeningMouseleave", "false");
            element.mousedown(function () {
                $(this).off("mousemove").on("mousemove",function () {
                    if (element.data("isListeningMouseleave") === "false") {
                        element.data("isListeningMouseleave", "true");
                        $(this).on("mouseleave", function () {
                            $(this).off("mousemove").off("mouseleave");
                            element.data("isListeningMouseleave", "false");
                            self.field.addClass("selecting").find(".text-editable").blur().removeAttr("contenteditable");
                        });
                    }
                });
            }).mouseup(function () {
                $(this).off("mousemove").off("mouseleave");
                element.data("isListeningMouseleave", "false");
                setTimeout(() => {
                    self.field.removeClass("selecting");
                }, 0);
            });
        } else {
            /* Firefox cannot listen to mouseleave and mouseout if mouse is down */
            element.mousedown(function (e) {
                const p0 = { x: e.pageX, y: e.pageY };
                $(this).off("mousemove").on("mousemove",function (e) {
                    const p1 = { x: e.pageX, y: e.pageY }, dx = Math.abs(p1.x - p0.x, 2), dy = Math.abs(p1.y - p0.y);
                    if (dx > 48 && dy > 48) {
                        self.field.addClass("selecting").find(".text-editable").blur().removeAttr("contenteditable");
                    }
                });
            }).mouseup(function () {
                $(this).off("mousemove");
                setTimeout(() => {
                    self.field.removeClass("selecting");
                }, 10);
            });
        }
    },
    addEditListener: async function (newLine) {
        const self = this;
        // 此处不能用 keypress, 因为 keypress 不能监听到 13(回车) 和 8(退格)
        // 此处加上 click 的原因是, 如果不加上 click, 用户通过鼠标移动光标, 将不会被 save 函数保存
        newLine.on("keydown", function (event) {
            newLine.data("keycode", event.keyCode);
            function reFocus (event, lines) {
                const lineIndex = $(event.target).index();
                if (lineIndex >= 0 && lineIndex < lines.length) {
                    const target = self.getAllLineElements().eq(lineIndex);
                    self.focusField(target, target.text().length);
                } else {
                    self.focusField();
                }
            }
            let prevendDefault = false;
            let prevendSave = false;
            if (event.ctrlKey || event.metaKey) {
                prevendSave = true;
                if (event.key === 'z') {
                    prevendDefault = true;
                    if (event.shiftKey) {
                        // handle redo action
                        self.redo().then(async (version) => {
                            if (version.lineIndex !== undefined && version.cursorPosition !== undefined) {
                                const lineElement = self.getAllLineElements().eq(version.lineIndex);
                                if (lineElement.length === 1) {
                                    self.focusField(lineElement, version.cursorPosition);
                                } else {
                                    reFocus(event, version.lines);
                                }
                            } else {
                                reFocus(event, version.lines);
                            }
                        }).catch(error => {
                            console.log("addEditListener: redo failed:", error);
                        });
                    } else {
                        // handle undo action
                        self.undo().then(async (version) => {
                            if (version.lineIndex !== undefined && version.cursorPosition !== undefined) {
                                const lineElement = self.getAllLineElements().eq(version.lineIndex);
                                if (lineElement.length === 1) {
                                    self.focusField(lineElement, version.cursorPosition);
                                } else {
                                    reFocus(event, version.lines);
                                }
                            } else {
                                reFocus(event, version.lines);
                            }
                        }).catch(error => {
                            console.log("addEditListener: undo failed:", error);
                        });
                    }
                }
            }
            if (prevendDefault === true) {
                event.preventDefault();
                event.stopImmediatePropagation();
            }
            if (prevendSave === false) {
                self.edit(event);
            }
        });
        newLine.on("click", function (event) {
            self.handleLineClick(newLine, event);
        });
        this.addDragListener(newLine);
        newLine.data("is-pristine", "true");
        // 创建观察器
        let observer = new MutationObserver(function (mutations, instance) {
            let hasHtml = false;
            for (const mutation of mutations) {
                if (mutation.type === "childList") {
                    const target = $(mutation.target);
                    const text = target.text();
                    if (text.length) {
                        if (target.data("is-pristine") === "true") {
                            const event = mutation;
                            event.preventDefault = function() {};
                            self.onTextChange(text, self.data, event, self.getTools());
                        }
                        target.data("is-pristine", "false");
                    } else {
                        console.log("v2.7 editor: editListener: line is empty.");
                        target.data("is-pristine", "true");
                    }
                    if (mutation.target.children.length) {
                        hasHtml = true;
                    }
                }
            }
            if (newLine.data("keycode") === self.DELETE && newLine.text().length === 0) {
                // Firefox: delete whole line will lost focus.
                // Firefox: text.length = 0  hasHtml = true
                // This is obviously wrong.
                // Stop Firefox from formatting empty line will fix this issue.
                if (hasHtml === true) {
                    console.log("Whole line was deleted. Browser " + window.getBrowserName() + " has detected html in empty line. Stopped it from formatting text which could cause losing focus.");
                    return;
                }
            }
            if (hasHtml) {
                (function () {
                    const target = newLine;
                    // let contentAddedLength = 0;
                    // for (const child of target.children()) {
                    //     if (child.textContent.length) {
                    //         contentAddedLength += child.textContent.length;
                    //     }
                    // }
                    const posPrev = self.getEditInfo(target);
                    // Format Text
                    function formatHtml (div) {
                        if ($(div).children("div,pre,p").length) {
                            return _.map($(div).children(), div2 => formatHtml(div2)).join("\n");
                        } else {
                            return $(div).text();
                        }
                    }
                    console.log("pos before formatting " + JSON.stringify(posPrev));
                    $(target).text(formatHtml(target));
                    console.log("pos after formatting " + JSON.stringify(self.getEditInfo(target)));
                    if (posPrev.caretOffset <= $(target).text().length) {
                        self.setCaretPosition(target[0], posPrev.caretOffset);
                    } else {
                        window.bsConfirm({
                            "title": "<i class='fa fa-lg fa-exclamation-triangle upper'></i> We Got An Issue",
                            "content": "This editor does not support html editing.<br>Copying html text to this editor is not safe.",
                            "alertClass": "alert-danger",
                        });
                    }
                })();
            }
        });
        // 观察文本行内容改变
        const text = newLine.get(0);
        observer.observe(text, {
            childList: true
        });
        // 注册观察器
        const observerId = this.getRandomString();
        this.observerMap.set(observerId, observer);
        newLine.data("observer-id", observerId);
        // 当删除这一行的时候, 观察器将会被停止
        return await Promise.resolve(newLine);
    },
    stopObserver: function (target) {
        var observerId = target.data("observer-id");
        this.observerMap.get(observerId).disconnect();
    },
    deleteLine: function (target) {
        this.stopObserver(target);
        target.remove();
    },
    empty: async function() {
        if (this.observerMap.size > 0) {
            this.observerMap.forEach((value, key, map) => {
                value.disconnect();
            });
            this.observerMap.clear();
        }
        this.field.empty();
        const newLine = this.getNewLine();
        this.field.append(newLine);
        let newLineApplied = this.field.find("#" + newLine.attr("id"));
        newLineApplied = await this.addEditListener(newLineApplied);
        return newLineApplied;
    },
    getCursorPosition: function() {
        const selection = this.getSelection();
        return selection.focusOffset;
    },
    setCursorPosition: function(pos) {
        const selection = this.getSelection();
        const posMax = this.getCursorPositionMax();
        if (pos > posMax) {
            pos = posMax;
        }
        selection.setPosition(selection.focusNode, pos);
    },
    getCursorPositionMax: function() {
        const selection = this.getSelection();
        if (selection.focusNode.innerText !== undefined) {
            // 仅在文本行为空行的时候有效
            return selection.focusNode.innerText.length;
        } else if (selection.focusNode.parentElement.innerText !== undefined) {
            // 在文本行不是空行的时候有效
            return selection.focusNode.parentElement.innerText.length;
        }
        return 0;
    },
    // 编辑可编辑的文本行
    edit: async function (event) {
        const self = this;
        // 获取当前文本行
        const target = $(event.target).closest(".text-editable");
        const text = target.text();
        // 获取当前光标位置
        const selection = self.getSelection();
        const cursorPosition = this.getCursorPosition();
        const keys = [this.ENTER, this.DELETE, this.UP, this.DOWN, this.LEFT, this.RIGHT];
        if (keys.includes(event.keyCode)) {
            // 如果能获取当前光标位置
            if (typeof cursorPosition === "number") {
                // 如果按下的键是回车
                if (event.keyCode == this.ENTER) {
                    // 防止新的文本行会因为被输入了 13 而被添加 <div><br></div>
                    event.preventDefault();
                    // console.log("v2.7 editor: edit: keycode = ", event.keyCode);
                    // 光标前的文本
                    const textprev = text.substr(0, cursorPosition);
                    // 光标后的文本
                    const textnext = text.substr(cursorPosition);
                    // 新的文本行
                    const newLine = this.getNewLine();
                    if (cursorPosition > 0) {
                        // 将光标前的文本保留在当前文本行中
                        target.text(textprev);
                        // 将光标后的文本移动到新的文本行中
                        newLine.text(textnext);
                        // 在当前文本行的下面插入新的文本行
                        target.after(newLine);
                    } else {
                        // 将光标前的文本移动到新的文本行中
                        newLine.text(textprev);
                        // 将光标后的文本保留在当前文本行中
                        target.text(textnext);
                        // 在当前文本行的上面插入新的文本行
                        target.before(newLine);
                    }
                    // 获取新的文本行 DOM
                    let newLineApplied = target.siblings("#" + newLine.attr("id"));
                    // 为新的文本行 DOM 添加监听编辑事件
                    newLineApplied = await this.addEditListener(newLineApplied);
                    if (cursorPosition > 0) {
                        // Disable Current Line Editability
                        target.removeAttr("contenteditable");
                        // 将光标移动到新的文本行的开始
                        newLineApplied.attr({"contenteditable": true}).focus();
                    }
                } else if (event.keyCode == this.DELETE) {
                    // 如果光标在文本行的开始, 并且按下了退格键
                    // console.log("v2.7 editor: edit: keycode = ", event.keyCode);
                    // console.dir(event);
                    // Make sure that user is not selecting text and cursor index is 0.
                    const baseOffset = selection.baseOffset !== undefined ? selection.baseOffset : selection.anchorOffset;
                    const extentOffset = selection.extentOffset !== undefined ? selection.extentOffset : selection.focusOffset;
                    if (baseOffset === 0 && extentOffset === 0) {
                        console.log("delete whole line");
                        const prev = target.prev();
                        if (prev && prev.length) {
                            event.preventDefault();
                            // 获取上一行的文字
                            const prevText = prev.text();
                            // 判断上一行是不是空行
                            if (prevText && prevText.length) {
                                // 如果上一行不是空行
                                // 删掉这一行
                                self.deleteLine(target);
                                // 将这一行的文字加在上一行的行尾
                                prev.text(prevText + text);
                                // 将上一行变成可编辑模式 (如果上一行不是文本, 而是图片或者链接, 则默认是不可编辑的)
                                prev.attr("contenteditable", true).focus();
                                // 将光标置于上一行原来行尾的位置, 而不是上一行现在行尾的位置
                                this.setCursorPosition(prevText.length);
                            } else {// 如果上一行是空行
                                // 删掉上一行
                                self.deleteLine(prev);
                            }
                        }
                    }
                } else if ([this.UP, this.LEFT].includes(event.keyCode)) {
                    // 如果不是在第一行, 按下了向上键, 或在这行的行首按下了向左键
                    var prev = target.prev();
                    if (prev && prev.length) {
                        if (event.keyCode === this.UP) {
                            event.preventDefault();
                            // Disable Current Line Editability
                            target.removeAttr("contenteditable");
                            // 将上一行变成可编辑模式 (如果上一行不是文本, 而是图片或者链接, 则默认是不可编辑的)
                            prev.attr("contenteditable", true).focus();
                            this.setCursorPosition(cursorPosition);
                        } else if (event.keyCode === this.LEFT && cursorPosition == 0) {
                            event.preventDefault();
                            // Disable Current Line Editability
                            target.removeAttr("contenteditable");
                            // 将上一行变成可编辑模式 (如果上一行不是文本, 而是图片或者链接, 则默认是不可编辑的)
                            prev.attr("contenteditable", true).focus();
                            this.setCursorPosition(this.getCursorPositionMax());
                        }
                    }
                } else if ([this.DOWN, this.RIGHT].includes(event.keyCode)) {
                    // 如果不是在最后一行, 按下了向下键, 或在这行的行尾按下了向右键
                    var next = target.next();
                    if (next && next.length) {
                        if (event.keyCode === this.DOWN) {
                            event.preventDefault();
                            // Disable Current Line Editability
                            target.removeAttr("contenteditable");
                            // 将下一行变成可编辑模式 (如果下一行不是文本, 而是图片或者链接, 则默认是不可编辑的)
                            next.attr("contenteditable", true).focus();
                            this.setCursorPosition(cursorPosition);
                        } else if (event.keyCode === this.RIGHT && cursorPosition == this.getCursorPositionMax()) {
                            event.preventDefault();
                            // Disable Current Line Editability
                            target.removeAttr("contenteditable");
                            // 将下一行变成可编辑模式 (如果下一行不是文本, 而是图片或者链接, 则默认是不可编辑的)
                            next.attr("contenteditable", true).focus();
                            // 默认将光标放在下一行的行首
                            // 因为 focus 默认将光标置于行首, 所以我们不需要再设置一次
                            // this.setCursorPosition(0);
                        }
                    }
                }
            } else {
                throw ("v2.7 editor: edit: cursor position not found.");
            }
        }
        this.save(target.index(), cursorPosition);
        this.keyPressListener(event, this.data, this.getTools(), this.getScope());
    },
    // 保存可编辑的文本行
    save: async function (lineIndex, cursorPosition) {
        const self = this;
        const lines = [];
        const fieldLines = this.getAllLineElements();
        for(let i = 0; i < fieldLines.length; ++i) {
            const fieldLine = fieldLines.get(i);
            const line = fieldLine.innerText;
            lines.push(line);
        }
        const $scope = this.getScope();
        const text = lines.join("\n");
        if ($scope === undefined) {
            throw ("v2.7 editor: save: $scope not found.");
        } else if (this.saveCallback === undefined || typeof this.saveCallback !== "function") {
            throw ("v2.7 editor: save: saveCallback undefined.");
        } else {
            this.saveCallback($scope, text);
            if (_.isEmpty(self.data.history)) {
                self.data.history = [];
                self.data.history.push({
                    "lines": lines,
                    "lineIndex": lineIndex,
                    "cursorPosition": cursorPosition
                });
            } else if (self.data.history.length > 0) {
                const clonedHistory = window.structuredClone(self.data.history);
                const revertedHistory = [...clonedHistory].reverse();
                const latestHistoryVersion = revertedHistory[0];
                if (_.isEqual(latestHistoryVersion.lines, lines)) {
                    console.log("v2.7 editor: save: already saved.");
                } else {
                    if (self.data.history.length >= this.historyCapacity) {
                        self.data.history.shift();
                    }
                    self.data.history.push({
                        "lines": lines,
                        "lineIndex": lineIndex,
                        "cursorPosition": cursorPosition
                    });
                    self.data.future = [];
                    console.log("v2.7 editor: save: saved. currentLines", lines, "history", self.data.history, "future cleared.");
                }
            }
        }
        return await text;
    },
    "_reload_": function (lines) {
        const self = this;
        const linesApplied = [];
        return new Promise((resolve, reject) => {
            if (lines && lines.length) {
                self.empty().then(async (target) => {
                    target.text(lines[0]);
                    linesApplied.push(target.text());
                    for (var i = 1; i < lines.length; ++i) {
                        linesApplied.push(lines[i]);
                        target = await self.insertNewLine(lines[i], target);
                    }
                    resolve(linesApplied);
                });
            }
        });
    },
    "getCurrentLines": function () {
        const lines = [];
        const fieldLines = this.getAllLineElements();
        for(let i = 0; i < fieldLines.length; ++i) {
            const fieldLine = fieldLines.get(i);
            const line = fieldLine.innerText;
            lines.push(line);
        }
        return lines;
    },
    "getCurrentEditingLineElement": function () {
        return this.field.children("[contenteditable='true']");
    },
    "undo": async function () {
        const self = this;
        if (self.data.history === undefined) {
            return Promise.reject("no record yet");
        }
        const currentVersion = self.getCurrentLines();
        const currentLineIndex = self.getCurrentEditingLineElement().index();
        const currentCursorPosition = self.getCursorPosition();
        let latestHistoryVersion;
        do {
            latestHistoryVersion = self.data.history.pop();
            if (latestHistoryVersion === undefined) {
                return Promise.reject("no valid record");
            }
        } while (_.isEqual(latestHistoryVersion.lines, currentVersion));
        if (latestHistoryVersion !== undefined) {
            if (_.isEmpty(self.data.future)) {
                self.data.future = [];
            }
            return new Promise(async function(resolve, reject) {
                const lines = await self["_reload_"](latestHistoryVersion.lines);
                if (_.isEqual(latestHistoryVersion.lines, lines)) {
                    setTimeout(() => {
                        self.data.future.unshift({
                            "lines": currentVersion,
                            "lineIndex": currentLineIndex,
                            "cursorPosition": currentCursorPosition,
                        });
                        console.log("v2.7 editor: undo success.", lines, "history", self.data.history, "future", self.data.future);
                    }, 10);
                    resolve(latestHistoryVersion);
                } else {
                    console.log("v2.7 editor: undo failed. linesBeforeAction", currentVersion, "latestHistoryVersion", latestHistoryVersion, "currentLines", lines, "history", self.data.history, "future", self.data.future);
                    reject("undo failed");
                }
            });
        } else {
            console.log("v2.7 editor: undo: no record.");
            return Promise.reject("no record");
        }
    },
    "redo": async function () {
        const self = this;
        if (self.data.future === undefined) {
            return Promise.reject("no record yet");
        }
        const currentVersion = self.getCurrentLines();
        const currentLineIndex = self.getCurrentEditingLineElement().index();
        const currentCursorPosition = self.getCursorPosition();
        let nearestFutureVersion;
        do {
            nearestFutureVersion = self.data.future.shift();
            if (nearestFutureVersion === undefined) {
                throw Promise.reject("no valid record");
            }
        } while (_.isEqual(nearestFutureVersion.lines, currentVersion));
        return new Promise(function(resolve, reject) {
            if (nearestFutureVersion !== undefined) {
                if (_.isEmpty(self.data.history)) {
                    self.data.history = [];
                }
                self.data.history.push({
                    "lines": currentVersion,
                    "lineIndex": currentLineIndex,
                    "cursorPosition": currentCursorPosition,
                });
                self["_reload_"](nearestFutureVersion.lines).then((lines) => {
                    if (_.isEqual(nearestFutureVersion.lines, lines)) {
                        console.log("v2.7 editor: redo success.", lines, "history", self.data.history, "future", self.data.future);
                        resolve(nearestFutureVersion);
                    } else {
                        console.log("v2.7 editor: redo failed. linesBeforeAction", currentVersion, "nearestFutureVersion", nearestFutureVersion, "currentLines", lines, "history", self.data.history, "future", self.data.future);
                        reject("redo failed");
                    }
                });
            } else {
                console.log("v2.7 editor: redo: no record.");
                reject("no record");
            }
        });
    }
};