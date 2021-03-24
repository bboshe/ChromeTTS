class Options {
    constructor() {
        this.saveSettings();
        this.loadTTSEngineOptions();
        this.loadSettings();
        this.colorUpdate();
    }

    loadTTSEngineOptions() {
        speechSynthesis.onvoiceschanged = () => {
            let select = document.getElementById("ttsengine");
            let voices = speechSynthesis.getVoices();
            for (let i = 0; i < voices.length; i++) {
                let option = document.createElement("option");
                option.text = voices[i].name;
                option.value = i;
                select.add(option);
            }
            chrome.storage.sync.get({voiceId: 1}, (result) => {
                select.selectedIndex = result.voiceId;
            });
        }
    }

    loadSettings() {
        chrome.storage.sync.get({pitch: 1.0, rate:1.0, volume: 1.0, highlight:'#FFFF00', contrast:'#222222'}, (result) => {
            document.getElementById("pitch").value = result.pitch;
            document.getElementById("rate").value = result.rate;
            document.getElementById("volume").value = result.volume;
            document.getElementById("highlight").value = result.highlight;
            document.getElementById("test").style.background = result.highlight;
            document.getElementById("text").value = result.contrast;
            document.getElementById("test").style.color = result.value;
        });
    }

    saveSetting(id, _store_key, _value_key) {
        let store_key = _store_key;
        let value_key = _value_key;
        let dom = document.getElementById(id);
        dom.onchange = () => {
            let set = {};
            set[store_key] = dom[value_key];
            chrome.storage.sync.set(set);
        }
    }
    saveSettings() {
        this.saveSetting("ttsengine", "voiceId", "selectedIndex");
        this.saveSetting("pitch", "pitch", "value");
        this.saveSetting("volume", "volume", "value");
        this.saveSetting("rate", "rate", "value");
        this.saveSetting("highlight", "highlight", "value");
        this.saveSetting("text", "contrast", "value");
    }
    colorUpdate() {
        let selectHighlight = document.getElementById("highlight");
        let selectText = document.getElementById("text");
        selectHighlight.oninput = () => {
            document.getElementById("test").style.background = selectHighlight.value;
        };
        selectText.oninput = () => {
            document.getElementById("test").style.color = selectText.value;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Options();
});