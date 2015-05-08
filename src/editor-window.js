var EditorWindow = {};

EditorWindow.focus = function () {
    Editor.sendToCore( 'window:focus', Editor.requireIpcEvent );
};

Editor.Window = EditorWindow;
