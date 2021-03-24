INLINE_TAGS = ['A', 'B', 'I', 'U', 'EM', 'STRONG', 'SUP', 'SUB', 'BIG', 'SMALL', 'DEL', 'CODE', 'CITE', 'DFN', 'KBD', 'VAR']


const containsOnlyInlineTags = (n) => {
    for (let node of n.children) {
        if (!INLINE_TAGS.includes(node.nodeName))
            return false;
    }
    return true;
};

const splitSentences = (s) => {
    let texts = s.split(/(?=\. |\? |! |: )/g);
    for (let i = 0; i < texts.length - 1; i++) {
        texts[i] += texts[i+1].substring(0,2);
        texts[i+1] = texts[i+1].substring(2);
    }
    return texts;
};

const isSentence = (s) => {
    return s.match(/[a-zA-Z]{3,}/);
};

const walkdom = (start, callback) => {
    for (let node of start) {
        if (containsOnlyInlineTags(node)) {
            callback(node)
        }
        else
            walkdom(node.children, callback);
    }
};

const walkTextNodes = (node, callback) => {
    while (node) {
        if (containsOnlyInlineTags(node)) {
            callback(node)
        }
        else {
            if (node.children.length > 0)
                walkTextNodes(node.children[0], callback);
        }
        node = node.nextElementSibling;
    }
};

const getTextNodes = (node) => {
    let text = [];
    walkTextNodes(node, (n) => text.push(n));
    return text;
};

const splitDOMSentences = (start) => {
    walkTextNodes(start, (node) => {
        let regex = /[.?!:]\s+(?=[\S\s]*([.?!:]|[a-z]))/g;
        if (node.innerHTML.match(regex))
            node.innerHTML = "<ins>" + node.innerHTML.replace(regex, ". </ins><ins>") + "</ins>";
    });
};


const getSelectedTextNode = () => {
    //let nodes = document.querySelectorAll(":hover");
    //let node = nodes[nodes.length-1];
    let node = window.getSelection().anchorNode.parentNode;
    while (INLINE_TAGS.includes(node.parentNode.nodeName))
        node = node.parentNode;
    return node;
};


class TTSController {

    constructor() {
        this.i = 0;
        this.textNodes = [];

        chrome.extension.onMessage.addListener((message, sender, callback) => {
            if (message == 'PLAY')
                this.playSelection()
        });
    }

    playSelection() {
        let node = getSelectedTextNode();
        splitDOMSentences(node);
        this.textNodes = getTextNodes(node);
        this.i = 0;
        this.speakSentence();
    }

    speakSentence() {
        if (this.i >= 0 && this.i < this.textNodes.length) {
            this.textNodes[this.i].setAttribute('style', 'background: #ffff00');
            let txt = this.textNodes[this.i].innerText;
            txt = txt.trim()//.replace(".", "");
            console.log(txt);
            chrome.runtime.sendMessage({action: "PLAY_TTS", text: txt});
            let onMsg = (message, sender, callback) => {
                chrome.extension.onMessage.removeListener(onMsg);
                if (message == 'NEXT') {
                    this.textNodes[this.i].setAttribute('style', '');
                    this.i++;
                    this.speakSentence()
                } else if (message == 'STOP') {
                    this.textNodes[this.i].setAttribute('style', '');
                }
            };
            chrome.extension.onMessage.addListener(onMsg);
        } else {
            chrome.runtime.sendMessage({action: "FINISHED"});
        }
    }
}

ttsController = new TTSController();
