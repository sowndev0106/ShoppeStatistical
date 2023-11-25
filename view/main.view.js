(function main() {
    // get data from storage
    chrome.storage.local.get('allOrder', function (data) {
        console.log(data)

    })
})();