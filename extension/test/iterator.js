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
        this.doVisualizePosition = true;
    }

    isTextNode(node) {
        if (!node)
            return false;

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
            debugger;
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
}

const textIterator = new TextIterator();
document.body.addEventListener('mousedown', e => {
    if (e.which === 1) {
        console.log(e.clientX, e.clientY);
        for (const text of textIterator.iterate(e.clientX, e.clientY)) {
            console.log(text);
        }
    }
});