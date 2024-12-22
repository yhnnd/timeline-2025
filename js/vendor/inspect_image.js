function inspect_image(imageUrl) {
    // 初始化图片区域
    let field = $("<div>")
        .addClass("d-block w-100 d-flex align-items-center justify-content-center")
        .css({ height: "100%" });
    // 初始化图片
    $("<img>")
        .addClass(["img-fluid","restrict-height"])
        .attr("src", imageUrl)
        .appendTo(field);
    // 初始化前景
    let foreground = $("<div>")
        .addClass("fixed-top d-block w-100 check-message-image-foreground")
        .css({ height: window.innerHeight + "px", zIndex: 1500 })
        .on("click", quit_inspect_image)
        .append(field);
    // 初始化背景
    let background = $("<div>")
        .addClass("fixed-top d-block w-100 check-message-image-background")
        .on("click", quit_inspect_image)
        .css({
            zIndex: 1499,
            height: window.innerHeight + "px",
            opacity: 0.8,
            background: 'black',
            filter: "brightness(0.1)"
        });
    $("body")
        .append(background)
        .append(foreground);
}


function quit_inspect_image() {
    $(".check-message-image-foreground").remove();
    $(".check-message-image-background").remove();
}