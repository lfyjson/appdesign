define(function (require, exports, module) {

    var keys = Object.keys || function(obj) {
        obj = Object(obj)
        var arr = []
        for (var a in obj) arr.push(a)
        return arr
    }
    var invert = function(obj) {
        obj = Object(obj)
        var result = {}
        for (var a in obj) result[obj[a]] = a
        return result
    }
    var entityMap = {
        escape: {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": "&apos;"
        }
    }
    entityMap.unescape = invert(entityMap.escape)
    var entityReg = {
        escape: RegExp('[' + keys(entityMap.escape).join('') + ']', 'g'),
        unescape: RegExp('(' + keys(entityMap.unescape).join('|') + ')', 'g')
    }

    // 将HTML转义为实体
    function escape(html) {
        if (typeof html !== 'string') return ''
        return html.replace(entityReg.escape, function(match) {
            return entityMap.escape[match]
        })
    }
    // 将实体转回为HTML
    function unescape(str) {
        if (typeof str !== 'string') return ''
        return str.replace(entityReg.unescape, function(match) {
            return entityMap.unescape[match]
        })
    }

    module.exports = {
        escape: escape,
        unescape: unescape
    };
});
