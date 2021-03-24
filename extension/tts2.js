
function getInnerDepth(node) {
    if (node.childElementCount) {
        const depths = Array.from(node.children).map(getInnerDepth);
        return 1 + Math.max.apply(Math, depths);
    } else {
        return 0;
    }
}

class TextIterator {

    constructor() {
        this.stepRight = 1;
        this.minTextWidth = 4 ;
        this.stepDown = 1;
        this.maxStepDown = 3;
        this.maxSteps = 1000;
        this.doVisualizePosition = false;
    }

    isTextNode(node) {
        if (!node)
            return false;

        return Array.from(node.childNodes).some(n => n.nodeName === "#text" && n.textContent.match(/([a-zA-Z0-9])+/));

        if (getInnerDepth(node) > 1)
            return false;

        const innerText = node.innerText;
        if (innerText.length === 0)
            return false;

        return true;
    }

    visualizePosition(x,y) {
        if (!this.doVisualizePosition)
            return;

        let div = document.createElement('div');
        div.style.width = "4px";
        div.style.height= "4px";
        div.style.position = "fixed";
        div.style.backgroundColor ="red";
        div.style.zIndex = "100";
        div.style.left = x + "px";
        div.style.top = y + "px";
        document.body.appendChild(div);
    }

    *iterate(x, y) {
        let stepsY = 0;
        const leftBound = x;
        let lastElement = null;

        for (let i = 0; i < this.maxSteps; i++) {
            const elem = document.elementFromPoint(x, y);
            const fontSize = parseFloat(window.getComputedStyle(lastElement? lastElement: (elem ? elem: document.body)).fontSize)
            this.visualizePosition(x,y)
            if (lastElement !== elem && this.isTextNode(elem)) {
                stepsY = 0;
                yield elem;
                const rect = elem.getBoundingClientRect();
                x = rect.right + 0.5 * fontSize;
                y = rect.bottom - 0.5 * fontSize;
                lastElement = elem;
            } else {
                if (x - leftBound < fontSize * this.minTextWidth) {
                    x += this.stepRight * fontSize;
                } else {
                    x = leftBound;
                    stepsY += 1;
                    y += this.stepDown * fontSize;
                    if (stepsY > this.maxStepDown)
                        return;
                }
            }
        }
    }

    *splitSentences(nodes) {
        let prefix = "";
        let prefixNodes = [];
        for (let node of nodes) {
            let split = node.textContent.split(/(\.)/g);
            for (let text of split) {
                if (text === ".") {
                    yield [prefix + ".", prefixNodes];
                    prefix = ""
                    prefixNodes = [];
                } else {
                    if (prefix.endsWith("-"))
                        prefix = prefix.slice(0,-1) + text;
                    else
                        prefix +=  " " + text;
                    prefixNodes.push(node);
                }
            }
        }
    }
}

txtIterator = new TextIterator();

class TTSController {

    constructor() {
        this.registerEvents();
    }

    playSelection(joinSentences) {
        window.getSelection().removeAllRanges();
        let nodes = Array.from(txtIterator.iterate(this.mouseX, this.mouseY));
        if (joinSentences) {
            this.textNodes = Array.from(txtIterator.splitSentences(nodes));
        } else {
            this.textNodes = nodes.map(n => [n.textContent, [n]]);
        }
        this.i = 0;
        this.onBegin();
        this.speakPassage();
    }

    speakPassage() {
        if (this.i >= 0 && this.i < this.textNodes.length) {
            const [text, _] = this.textNodes[this.i];
            this.utt = new SpeechSynthesisUtterance(text.trim());
            Object.assign(this.utt, this.ttsOptions);
            this.utt.onstart = this.onPassageBegin.bind(this);
            this.utt.onend   = this.onPassageEnd.bind(this);
            speechSynthesis.speak(this.utt);
        } else {
            this.onFinished();
        }
    }

    onBegin() {
        chrome.runtime.sendMessage({action: "PLAY"});
    }

    onPassageBegin() {
        this.setPassageHighlight(true);
    }

    onPassageEnd(playNext=true) {
        this.setPassageHighlight(false);
        if (playNext) {
            this.i++;
            this.speakPassage()
        }
    }

    onFinished() {
        chrome.runtime.sendMessage({action: "FINISHED"});
    }

    stop() {
        this.utt.onend(false);
        this.utt.onend = undefined;
        speechSynthesis.cancel();
        chrome.runtime.sendMessage({action: "STOPPED"});
    }

    setPassageHighlight(on) {
        const [_, nodes] = this.textNodes[this.i];
        for (let node of nodes) {
            if (on) {
                node.style.background = this.ttsOptions.highlight;
                node.style.color = this.ttsOptions.contrast;
            } else {
                node.style.background = "";
                node.style.color = "";
            }
        }
    }

    getVoiceByName(name) {
        for (let voice of speechSynthesis.getVoices()) {
            if (voice.name === name)
                return voice;
        }
    }

    registerEvents() {
        chrome.extension.onMessage.addListener((message, sender, callback) => {
            if (message.action == 'PLAY') {
                if (message.ttsOptions) {
                    this.ttsOptions = message.ttsOptions;
                    this.ttsOptions.voice = speechSynthesis.getVoices()[this.ttsOptions.voiceId];
                }
                this.playSelection(message.join);
            } else if (message.action == 'STOP') {
                this.stop();
            }
        });

        window.onbeforeunload = () => {
            this.stop();
        };
        speechSynthesis.onvoiceschanged = () => {
        };

        document.body.addEventListener("mousedown", e => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
    }
}

ttsController = new TTSController();