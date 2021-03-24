class ttsSpeaker {
    constructor() {
        this.ttsTabId = null;
        this.isSpeaking = false;

        this.registerEvents();
        this.registerActionListeners();
    }

    onPlay() {
        chrome.browserAction.setIcon({path: 'stop.png'});
        this.isSpeaking = true;
    }

    onStop() {
        chrome.browserAction.setIcon({path: 'default.png'});
        this.isSpeaking = false;
    }

    play(joinSentences) {
        chrome.tabs.query({"active": true, "currentWindow": true}, (tabs) => {
            if (tabs.length > 0) {
                this.ttsTabId = tabs[0].id;
                chrome.storage.sync.get({voiceId: 1, rate:1., volume:1., pitch:1., highlight:'#FFFF00', contrast:'#222222'}, (options) => {
                    chrome.tabs.sendMessage(this.ttsTabId, {action:'PLAY', join:joinSentences, ttsOptions:options});
                });
            }
        });
    }

    stop() {
        chrome.tabs.sendMessage(this.ttsTabId, {action:'STOP'});
        setTimeout(() => {
            if (this.isSpeaking) {
                speechSynthesis.cancel();

            }
        }, 0.2);
    }

    registerEvents() {
        chrome.runtime.onMessage.addListener((msg, sender, response) => {
             if (msg.action === 'PLAY') {
                 this.onPlay()
             } else if (msg.action === 'FINISHED') {
                 this.onStop();
             } else if (msg.action === 'STOPPED') {
                 this.onStop();
             }
        });
    }

    registerActionListeners() {
        chrome.commands.onCommand.addListener((command) => {
            if (command === 'toggle-tts') {
                if (this.isSpeaking)
                    this.stop();
                //else
                //    this.play();
            }
        });

        chrome.browserAction.onClicked.addListener(() => {
            if (this.isSpeaking)
                this.stop();
            else {
                chrome.runtime.openOptionsPage();
            }
        });

        chrome.contextMenus.create({
            "title": "Read out loud",
          //  "contexts": ['selection'],
            "onclick": () =>{
                this.play(false);
            }
        });
        chrome.contextMenus.create({
            "title": "Read out loud (Full Sentences)",
            //  "contexts": ['selection'],
            "onclick": () =>{
                this.play(true);
            }
        });
    }
}


speaker = new ttsSpeaker();
