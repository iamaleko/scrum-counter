window.ScrumCounter = class Counter {
  static observer;
  static tabId;

  static onInjected(tabId) {
    this.tabId = tabId;

    if (window.ScrumCounterHandler) chrome.runtime.onMessage.removeListener(window.ScrumCounterHandler);
    window.ScrumCounterHandler = (message) => this.onMessage(message);
    chrome.runtime.onMessage.addListener(window.ScrumCounterHandler);
    
    this.log('Injected!', this.tabId);
  }

  static log(...message) {
    console.log(...message);
  }

  static onMessage(message) {
    if (!message) return;
    switch (message.type) {
      case "CounterStartCounting":
        this.log('Command received:', message.type, message);
        if (this.getCurrentTabId() !== message.data.tabId) return;
        this.startCounting();
        break;
      case "CounterStopCounting":
        this.log('Command received:', message.type, message);
        this.stopCounting();
        break;
    }
  }

  static getPlannedSprintEl() {
    return document.querySelector(".ghx-sprint-planned");
  }

  static startCounting() {
    let timeout;
    if (!this.observer) this.observer = new MutationObserver(() => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => this.count(), 100);
    });
    this.observer.disconnect();
    this.observer.observe(document.body, { childList: true, subtree: true });
    this.count();
  }

  static stopCounting() {
    if (this.observer) this.observer.disconnect();
  }

  static count() {
    const rows = [];
    const sprintEl = this.getPlannedSprintEl();
    if (sprintEl) {
      sprintEl.querySelectorAll(".js-issue:not(.ghx-filtered)").forEach((issueEl) => {
        // issue
        const issueType = issueEl.querySelector(".ghx-type")?.title || "",
          issueId = Number(issueEl.dataset.issueId);

        // assignee
        const avatarEl = issueEl.querySelector(".ghx-avatar-img"),
          assigneeAvatar = avatarEl?.src || "",
          assigneeName = avatarEl?.alt.match(/^[^:]+?:\s(?<name>.+)$/)?.groups.name || "";

        // story points
        const pointsGroups = issueEl.querySelector(".ghx-summary")?.title.match(new RegExp(import.meta.env.VITE_JIRA_SP_REGEXP))?.groups,
          pointsTotal = Number(issueEl.querySelector("aui-badge")?.innerText || 0);

        rows.push({
          issue: {
            type: issueType,
            id: issueId,
          },
          assignee: {
            avatar: assigneeAvatar,
            name: assigneeName,
          },
          points: {
            total: pointsTotal,
            groups: pointsGroups,
          },
        })
      });
    }
    this.log('Data collected:', rows);
    if (!chrome.runtime) {
      this.log('Connection was lost! Seppuku!');
      this.stopCounting();
      return;
    }
    try {
      chrome.runtime.sendMessage({
        type: "CounterCollectedData",
        data: {
          tabId: this.getCurrentTabId(),
          rows: rows,
        }
      });
    } catch(e) {
      this.log('Unable to send message! Seppuku!');
      this.stopCounting();
    }
  }

  static getCurrentTabId() {
    return this.tabId;
  }
};
