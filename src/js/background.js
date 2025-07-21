class Background {
  static host = import.meta.env.VITE_JIRA_HOST;
  static tabIdsWithPanels = new Set();
  static tabIdsWithCounters = new Set();

  static async loadState() {
    const data = await chrome.storage.session.get("tabIdsWith");
    if (data.tabIdsWith) {
      this.tabIdsWithPanels = new Set(data.tabIdsWith.panels);
      this.tabIdsWithCounters = new Set(data.tabIdsWith.counters);
      this.log(`Loaded ${JSON.stringify(data.tabIdsWith)}`);
    }
  }

  static async saveState() {
    // const data = {
    //   tabIdsWith: {
    //     panels: [...this.tabIdsWithPanels],
    //     counters: [...this.tabIdsWithCounters],
    //   }
    // };
    // await chrome.storage.session.set(data);
    // this.log(`Saved ${JSON.stringify(data.tabIdsWith)}`);
  }

  static async onInstalled() {
    this.log('Installed!');

    // await this.loadState();
    // for (const cs of chrome.runtime.getManifest().content_scripts) {
    //   for (const tab of await chrome.tabs.query({url: cs.matches})) {
    //     if (tab.url.match(/(chrome|chrome-extension):\/\//gi)) {
    //       continue;
    //     }
    //     const target = {tabId: tab.id, allFrames: cs.all_frames};
    //     if (cs.js[0]) chrome.scripting.executeScript({
    //       files: cs.js,
    //       injectImmediately: cs.run_at === 'document_start',
    //       world: cs.world, // requires Chrome 111+
    //       target,
    //     });
    //     if (cs.css[0]) chrome.scripting.insertCSS({
    //       files: cs.css,
    //       origin: cs.origin,
    //       target,
    //     });
    //   }
    // }

    chrome.runtime.onMessage.addListener((message) => this.onMessage(message));

    // manage panel availability and visibility
    chrome.tabs.onActivated.addListener((info) => {
      chrome.tabs.get(info.tabId, (tab) => this.updatePanel(tab))
    });
    chrome.tabs.onUpdated.addListener((tabId, info) => {
      if (info.status === "complete") chrome.tabs.get(tabId, (tab) => this.updatePanel(tab))
    });

    // manage panel opening
    chrome.runtime.onConnect.addListener(async (port) => {
      if (port.name !== "panel") return;
      const tab = await this.getCurrentTab();
      if (!tab) return;
      await this.openPanel(tab);
      port.onDisconnect.addListener(async () => this.closePanel(tab));
    });

    chrome.sidePanel.setPanelBehavior({
      openPanelOnActionClick: true,
    });
  }

  static log(message) {
    console.log(message);
  }

  static onMessage(message) {
    if (!message) return;
    switch (message.type) {
      case "CounterCollectedData":
        this.log(`Data collected from tab ${message.data.tabId}`);
        chrome.runtime.sendMessage({
          type: "CounterCollectedData",
          data: message.data
        }).catch((e) => {
          // Panel is not opened yet
        });
        break;
    }
  }

  static async updatePanel(tab) {
    await this.disableCounter();
    if(tab.url && new URL(tab.url).host === this.host) {
      await this.enablePanel(tab);
      await this.enableCounter(tab);
    } else {
      await this.disablePanel();
    }
  }

  static async enablePanel(tab) {
    await chrome.sidePanel.setOptions({
      path: 'panel.html',
      enabled: true,
      tabId: tab.id,
    });
    this.log(`Panel is enabled for tab ${tab.id}`);
  }

  static async disablePanel() {
    await chrome.sidePanel.setOptions({
      enabled: false,
    });
    this.log(`Panel is disabled`);
  }

  static async openPanel(tab) {
    if (!this.tabIdsWithPanels.has(tab.id)) {
      this.tabIdsWithPanels.add(tab.id);
      await this.saveState();
    }
    this.log(`Panel opened for tab ${tab.id}`);
    this.enableCounter(tab);
  }

  static async closePanel(tab) {
    if (this.tabIdsWithPanels.has(tab.id)) {
      this.tabIdsWithPanels.delete(tab.id);
      await this.saveState();
    }
    this.log(`Panel closed for tab ${tab.id}`);
    this.disableCounter();
  }

  static async enableCounter(tab) {
    if (!this.tabIdsWithPanels.has(tab.id)) return;
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [ tab.id ],
      func: (id) => {
        window.tabId = id;
      }
    });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["assets/content.js"]
    });
    await chrome.tabs.sendMessage(tab.id, {
      type: "CounterStartCounting",
      data: {
        tabId: tab.id,
      }
    });
    if (!this.tabIdsWithCounters.has(tab.id)) {
      this.tabIdsWithCounters.add(tab.id);
      await this.saveState();
    }
    this.log(`Counter enabled for tab ${tab.id}`);
  }

  static async disableCounter() {
    if (this.tabIdsWithCounters.size) {
      for (const tabId of this.tabIdsWithCounters) {
        chrome.tabs.sendMessage(tabId, {
          type: "CounterStopCounting",
          data: null
        }).catch((e) => {
          // Tab is closed already
        })
        this.log(`Counter disabled for tab ${tabId}`);
      }
      this.tabIdsWithCounters.clear();
      await this.saveState();
    }
  }

  static async getCurrentTab() {
    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    return tab;
  }
}

chrome.runtime.onInstalled.addListener(() => Background.onInstalled());
