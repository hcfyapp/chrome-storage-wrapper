chrome.runtime.onInstalled.addListener( () => {
    chrome.tabs.create( {
        url : '/test.html'
    } );
} );
