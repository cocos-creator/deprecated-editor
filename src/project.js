// project.js
var Project;
(function (Project) {
    var fs = require('fs');

    /**
     * dir: path to the directory to explore
     * action(file, stat): called on each file or until an error occurs. file: path to the file. stat: stat of the file (retrived by fs.stat)
     * done(err): called one time when the process is complete. err is undifined is everything was ok. the error that stopped the process otherwise
     */
    var _walk = function(dir, action, done) {

        // this flag will indicate if an error occured (in this case we don't want to go on walking the tree)
        var dead = false;

        // this flag will store the number of pending async operations
        var pending = 0;

        var fail = function(err) {
            if(!dead) {
                dead = true;
                done(err);
            }
        };

        var checkSuccess = function() {
            if(!dead && pending === 0) {
                done();
            }
        };

        var performAction = function(file, stat) {
            if(!dead) {
                try {
                    action(file, stat);
                }
                catch(error) {
                    fail(error);
                }
            }
        };

        // this function will recursively explore one directory in the context defined by the variables above
        var dive = function(dir) {
            pending++; // async operation starting after this line
            fs.readdir(dir, function(err, list) {
                if(!dead) { // if we are already dead, we don't do anything
                    if (err) {
                        fail(err); // if an error occured, let's fail
                    }
                    else { // iterate over the files
                        list.forEach(function(file) {
                            if(!dead) { // if we are already dead, we don't do anything
                                var path = dir + "/" + file;
                                pending++; // async operation starting after this line
                                fs.stat(path, function(err, stat) {
                                    if(!dead) { // if we are already dead, we don't do anything
                                        if (err) {
                                            fail(err); // if an error occured, let's fail
                                        }
                                        else {
                                            if (stat && stat.isDirectory()) {
                                                dive(path); // it's a directory, let's explore recursively
                                            }
                                            else {
                                                performAction(path, stat); // it's not a directory, just perform the action
                                            }
                                            pending--; checkSuccess(); // async operation complete
                                        }
                                    }
                                });
                            }
                        });
                        pending--; checkSuccess(); // async operation complete
                    }
                }
            });
        };

        // start exploration
        dive(dir);
    };

    Project.create = function (path) {

        var AssetsDir = path+'/assets';
        var SettingDir = path+'/settings';

        var ProjectFile = path+'/.fireball';
        var SettingProjectFile = path+'/settings/project.json';

        console.log('AssetDir: '+AssetsDir);
        console.log('SettingDir: '+SettingDir);
        console.log('ProjectFile: '+ProjectFile);
        console.log('SettingProjectFile: '+SettingProjectFile);

        fs.mkdirSync(AssetsDir);
        fs.mkdirSync(SettingDir);

        fs.writeFileSync(ProjectFile, '');
        fs.writeFileSync(SettingProjectFile, '');

        var EmptyProject = {
            'assets' : {},
            'settings' : {
                'project' : {},
            }
        };

        return EmptyProject;
    };
    

    Project.load = function(path) {
        console.log(path);

        if(!fs.existsSync(path)) {
            return "error";
        }

        if(!fs.existsSync(path+'/.fireball')) {
            return "error";
        }

        var project = {};

        var action = function(file, stat) {

            if (file.indexOf(path+'/assets') > -1) {
                console.log('Asset: '+ file);
            }else if(file.indexOf(path+'/setting') > -1) {
                console.log('Setting: '+ file);

                // TODO load js
            }

        };

        _walk(path, action, function(err){
            if (err) {
                console.log(err);
            } else {
                console.log('walk done');
            }
        });

        return project;
    };

})(Project || (Project = {}));
