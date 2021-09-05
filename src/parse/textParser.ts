const MUSTACHE_RE = /\{\{(.+?)\}\}/

type token = {
    key: string,
    text: null
} | {
    key: null,
    text: string
}

function textParser(text: string): Array<token> {
    const isExistMustache = MUSTACHE_RE.test(text)
    if (!isExistMustache) {
        return [{ key: null, text: text }]
    }

    let index: number
    let textMatch
    let token: token
    let tokens: Array<token> = []
    while (text) {
        // null || [<all content of first matched, include group, and content outside group>, <group0>, ..., <index>, <original input string>]
        textMatch = text.match(MUSTACHE_RE)
        if (textMatch) {
            index = textMatch.index
            tokens.push({
                key: null,
                text: text.slice(0, index)
            })

            token = {
                key: textMatch[1].trim(),
                text: null
            }
            tokens.push(token)

            text = text.slice(index + textMatch[0].length)
        } else {
            tokens.push({
                key: null,
                text: text
            })
            text = ""
        }
    }
    return tokens
}

export default textParser