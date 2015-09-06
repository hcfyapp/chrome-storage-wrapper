chrome.runtime.onInstalled.addListener( () => {

    const p1 = new Promise( done => {
        chrome.storage.local.clear( done );
    } );

    const p2 = new Promise( done => {
        chrome.storage.sync.clear( done );
    } );

    Promise.all( [ p1 , p2 ] ).then( () => {
        chrome.tabs.create( {
            url : '/test.html'
        } );
    } );
} );
