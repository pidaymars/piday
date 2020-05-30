function getDefaultFontSize(parent=null){
    parent = parent || document.body;
    var who = document.createElement('p');

    who.style.cssText='display:inline-block; padding:0; line-height:1; position:absolute; visibility:hidden;';
    
    who.appendChild(document.createTextNode('M'));
    parent.appendChild(who);
    var fs = [who.offsetWidth, who.offsetHeight];
    parent.removeChild(who);
    return fs;
}
window.addEventListener("load", function(event) {
    var main_divs = document.getElementsByClassName("main");

    for (var i = 0; i < main_divs.length; i++) {
        var main = main_divs[i];
        var char_width = getDefaultFontSize(main)[0];
        var max_width_text = window.getComputedStyle(main, null).getPropertyValue('max-width');
        var max_width_int;
        var max_width_known = false;
        var found = max_width_text.match(/^([0-9]+)px$/);
        if (found.length >= 1) {
            max_width_int = parseInt(found[1]);
            max_width_known = true;
        }
        if (!(max_width_known && max_width_int <= 50*char_width)) {
            main.style['max-width'] = 50*char_width + "px";
        }
    }
});
