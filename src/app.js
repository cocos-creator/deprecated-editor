console.log('starting fireball-x');

// document events
document.addEventListener( "drop", function (event) {
    event.preventDefault(); 
} );
document.addEventListener( "dragover", function (event) {
    event.preventDefault(); 
} );
document.addEventListener( "contextmenu", function (event) {
    event.preventDefault();
    event.stopPropagation();
} );

