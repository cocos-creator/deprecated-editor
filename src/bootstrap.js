// skip "?fireID="
window.onload = function() {
    var fireID = JSON.parse(decodeURIComponent(location.search.substr(8)));
    window.fireApp = new FireApp(fireID); 
};
