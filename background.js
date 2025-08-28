let automationActive = false;
let tabCycleTimer = null;
let currentIndex = 0;

// Scroll function for a single tab
function scrollTab(tabId) {
    chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
            window.scrollBy(0, 200); // scroll down 200px
        }
    });
}

// Run scrolling on current tab for 30 seconds
function runScrollCycle(tabId, callback) {
    let elapsed = 0;
    let interval = setInterval(() => {
        scrollTab(tabId);
        elapsed += 10; // one scroll every 10 sec
        if (elapsed >= 30) { // after 30 sec stop
            clearInterval(interval);
            callback();
        }
    }, 10000);
}

// Cycle through tabs
function cycleTabs() {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
        if (tabs.length === 0) return;

        currentIndex = (currentIndex + 1) % tabs.length;
        let nextTab = tabs[currentIndex];

        chrome.tabs.update(nextTab.id, { active: true }, () => {
            // Run scrolling for 30s, then call cycleTabs again
            runScrollCycle(nextTab.id, cycleTabs);
        });
    });
}

// Start automation
function startAutomation() {
    if (automationActive) return;
    automationActive = true;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
            let activeTab = tabs[0];
            currentIndex = tabs.findIndex(t => t.id === activeTab.id);

            // First tab scroll for 30s
            runScrollCycle(activeTab.id, cycleTabs);
        }
    });
}

// Stop automation
function stopAutomation() {
    automationActive = false;
    if (tabCycleTimer) {
        clearTimeout(tabCycleTimer);
        tabCycleTimer = null;
    }
}

// Detect idle state
chrome.idle.onStateChanged.addListener((newState) => {
    if (newState === "idle") {
        startAutomation();
    } else if (newState === "active") {
        stopAutomation();
    }
});

// Idle threshold = 60 sec
chrome.idle.setDetectionInterval(60);
