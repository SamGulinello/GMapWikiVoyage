chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === "fetchWikivoyagePage") {
        try {
            const response = await fetch(message.url);
            const html = await response.text();
            sendResponse({ success: true, html });
        } catch (error) {
            console.error("Error fetching Wikivoyage page:", error);
            sendResponse({ success: false, error: error.message });
        }
    }
    return true; // Keep the message channel open for async response
});

chrome.runtime.onInstalled.addListener(async function(details) {
    console.log("Extension Installed or Updated");
    // If you want to handle first install and updates differently
    /**
    if(details.reason === "install"){
        // call a function to handle a first install
    } else if(details.reason === "update") {
        // call a function to handle an update
    }
    **/
});
