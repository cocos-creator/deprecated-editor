// tests.js

var fs = require('fs');
var path = require('path');

var project = require('./src/project');

var ProjectPath = "/Users/G_will/Test/TestFireball";

// rmdir 
var rmdir = function(dir) {
    var list = fs.readdirSync(dir);
    for(var i = 0; i < list.length; i++) {
        var filename = path.join(dir, list[i]);
        var stat = fs.statSync(filename);
        
        if(filename == "." || filename == "..") {
            // pass these files
        } else if(stat.isDirectory()) {
            // rmdir recursively
            rmdir(filename);
        } else {
            // rm fiilename
            fs.unlinkSync(filename);
        }
    }
    fs.rmdirSync(dir);
};

// project
exports.testNewProject = function(test){

    // clean
    if (fs.existsSync(ProjectPath)) {
        rmdir(ProjectPath);
    }   
    fs.mkdirSync(ProjectPath);
    
    // newProject
    project.newProject(ProjectPath);

    test.ok(fs.existsSync(ProjectPath+'/assets'), "has assets dir");

    project.loadProject(ProjectPath);
    // test.expect(1);
    // test.ok(true, "this assertion should pass");
    // test.done();
    test.done();
};