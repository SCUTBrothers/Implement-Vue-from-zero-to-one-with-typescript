import Directives from "./directives"

class InsertText extends Directives {
    update(el: Text, text: string) {
        el.nodeValue = text || ""
    }
}

export default InsertText