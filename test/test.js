// test.js

var Assert = require('assert');
var Path = require('path');
var Fs = require('fs');

//
// fake begin
// fake FIRE FIRE_ED EditorApp classes
//

FIRE = require('../../bin/ext/fire-core/core.dev.js');

FIRE_ED = {};


// Importer
var Importer = FIRE.define('FIRE_ED.Importer', function () {
    this.rawfile = "";
});
Importer.prop('ver', 0, FIRE.Integer, FIRE.HideInInspector);
Importer.prop('uuid', "", FIRE.HideInInspector);

Importer.prototype.exec = function () {
};

FIRE_ED.Importer = Importer;

// JsonImporter
var JsonImporter = FIRE.define('FIRE_ED.JsonImporter', Importer);
JsonImporter.prop('binary', false);

JsonImporter.prototype.exec = function () {
    AssetDB.copyToLibrary( this.uuid, this.rawfile );
};

FIRE_ED.JsonImporter = JsonImporter;

// TextureImporter
var TextureImporter = FIRE.define('FIRE_ED.TextureImporter', Importer);
TextureImporter.prop('wrapMode', FIRE.Texture.WrapMode.Clamp, FIRE.Enum(FIRE.Texture.WrapMode));
TextureImporter.prop('filterMode', FIRE.Texture.FilterMode.Bilinear, FIRE.Enum(FIRE.Texture.FilterMode));

TextureImporter.prototype.exec = function () {
    var img = new Image();
    img.onload = function () {
        var tex = new FIRE.Texture(img);
        tex.wrapMode = this.wrapMode;
        tex.filterMode = this.filterMode;

        AssetDB.importToLibrary( this.uuid, tex );

        // copy host file to library/{{this.uuid}}.host 
        AssetDB.copyToLibrary( this.uuid, this.rawfile, '.host' );
    }.bind(this);
    img.src = this.rawfile; 
};

FIRE_ED.TextureImporter = TextureImporter;

EditorApp = {};
EditorApp.fire = function (event, args) {
    console.log("fire event: ", event);
    console.log("with args: ", args);
};

//
// fake end
//

var AssetDB = require('../src/core/asset-db.js');

var projectDir = Path.join(process.cwd(), 'test/test_project');
var assetsDir = Path.join(projectDir, 'assets');

var delay = function(fn) {
    return setTimeout(fn, 1000);
};

var info = function(str) {
    console.log("[info]: ", str);
};
 
var pprint = function(obj) {
    console.log(JSON.stringify(obj, null, 2));
};

var rm = function (src) {
    if (!Fs.existsSync(src)) return;
    var stat = Fs.statSync(src);
    if (stat.isDirectory()) {
        var files = Fs.readdirSync(src);
        for (var i = 0, len = files.length; i < len; i++) {
            rm(Path.join(src, files[i]));
        }
        Fs.rmdirSync(src);
    } 
    else {
        Fs.unlinkSync(src);
    }
};

var cp = function (src, dest) {
    stat = Fs.statSync(src);
    if (stat.isDirectory()) {
        if (!Fs.existsSync(dest)) Fs.mkdirSync(dest);
        var files = Fs.readdirSync(src);
        for (var i = 0, len = files.length; i < len; i++) {
            cp(Path.join(src, files[i]), Path.join(dest, files[i]));
        }    
    } 
    else {
        if (!Fs.existsSync(dest)) {
            Fs.writeFileSync(dest, Fs.readFileSync(src));
        }
    }
};

describe('Test', function(){

    // 测试 AssetDB.watch() 
    describe('Test AssetDB.watch()', function(){

        // 全部用例开始前进行测试文件夹的清理
        before(function(){
            
            // 删除测试项目文件夹
            if (Fs.existsSync(projectDir)) {
                info("test project dir exists");
                info("rm test project dir");
                rm(projectDir);
            }

            // 建立测试项目文件夹，以及项目资源文件夹
            info("make project dir");
            Fs.mkdirSync(projectDir);
            info("make assets dir");
            Fs.mkdirSync(assetsDir);

            // 初始化 AssetDB
            AssetDB.testInit(projectDir);
            AssetDB.refresh();
            //AssetDB.watch();

        });

        // 全部测试结束调用 unwatch()
        after(function(){
            //AssetDB.unwatch();
        });

        beforeEach(function(done){
            AssetDB.watch();
            delay(function() {
                done();
            });
        });

        afterEach(function(done){
            AssetDB.unwatch();
            delay(function() {
                done();
            });
        });

        // 测试文件、测试文件夹路径
        var fileName = 'foo.file';
        var filePath = Path.join(assetsDir, fileName);

        var dirName = 'bar';
        var dirPath = Path.join(assetsDir, dirName);

        // 测试新建文件
        describe('create file', function(){

            // 文件的 path to uuid 信息应该在 AssetDB 中
            it('should add a new pathToUuid item in AssetDB', function(done){
                
                var pathToUuid = AssetDB.pathToUuid();
                info("PathToUuid: ↓↓↓");
                pprint(pathToUuid);

                Assert.ok(!pathToUuid[filePath], 'before create file no info in PathToUuid');

                info('create file: ' + fileName);
                Fs.writeFileSync(filePath, 'something');

                delay(function() {
                    done();
                    pathToUuid = AssetDB.pathToUuid();
                    info("PathToUuid: ↓↓↓");
                    pprint(pathToUuid);
                    Assert.ok(pathToUuid[filePath], 'after create file filePath in PathToUuid');
                });
                
            });

        });
        
        // 删除文件
        describe('delele file', function(){

            // 被删除的文件信息应该从 AssetDB 的 path to uuid 中移除
            it('should remove the pathToUuid item in AssetDB', function(done){

                var pathToUuid = AssetDB.pathToUuid();
                info("PathToUuid: ↓↓↓");
                pprint(pathToUuid);

                Assert.ok(pathToUuid[filePath], 'before delete file the info is in PathToUuid');

                info('delete file: ' + fileName);
                rm(filePath);

                delay(function() {
                    done();
                    pathToUuid = AssetDB.pathToUuid();
                    info("PathToUuid: ↓↓↓");
                    pprint(pathToUuid);
                    Assert.ok(!pathToUuid[filePath], 'after delete file filePath is not in PathToUuid');
                });
                
            });

        });

        // 再次新建文件，以备下一个测试项目使用
        describe('create file', function(){

            it('should add a new pathToUuid item in AssetDB', function(done){
                
                var pathToUuid = AssetDB.pathToUuid();
                info("PathToUuid: ↓↓↓");
                pprint(pathToUuid);

                Assert.ok(!pathToUuid[filePath], 'before create file no info in PathToUuid');

                info('create file: ' + fileName);
                Fs.writeFileSync(filePath, 'something');

                delay(function() {
                    done();
                    pathToUuid = AssetDB.pathToUuid();
                    info("PathToUuid: ↓↓↓");
                    pprint(pathToUuid);
                    Assert.ok(pathToUuid[filePath], 'after create file filePath in PathToUuid');
                });
                
            });

        });

        // 移动文件
        describe('move file', function(){

            // 被移动的文件，原有的 path to uuid 信息应该移除，新的 path to uuid 信息应该添加
            it('should remove old file info item and add new file info item in AssetDB pathToUuid', function(done){
                
                var pathToUuid = AssetDB.pathToUuid();
                info("PathToUuid: ↓↓↓");
                pprint(pathToUuid);

                var newFileName = 'newfoo.file';
                var newFilePath = Path.join(assetsDir, newFileName);

                Assert.ok(pathToUuid[filePath], 'should have item');
                Assert.ok(!pathToUuid[newFilePath], 'should have no item');

                info('move file: ' + fileName + ' to: ' + newFileName);
                Fs.renameSync(filePath, newFilePath);

                delay(function() {
                    done();

                    pathToUuid = AssetDB.pathToUuid();
                    info("PathToUuid: ↓↓↓");
                    pprint(pathToUuid);

                    Assert.ok(!pathToUuid[filePath], 'should have no item');
                    Assert.ok(pathToUuid[newFilePath], 'should have item');

                });
            });
        });

        // 建立文件夹
        describe('create folder', function(){

            // 会生成文件夹的 .meta 文件
            it('should create folder meta file', function(done){

                var folderMetaFilePath = dirPath + '.meta';

                Assert.ok(!Fs.existsSync(folderMetaFilePath), 'should not exists');

                Fs.mkdirSync(dirPath);

                delay(function() {
                    done();
                    Assert.ok(Fs.existsSync(folderMetaFilePath), 'should exists');
                });

            });
        });

        // 删除文件夹
        describe('delete folder', function(){

            // 文件夹的 .meta 文件会一并被删除
            it('should delete folder meta file', function(done){
                var folderMetaFilePath = dirPath + '.meta';

                Assert.ok(Fs.existsSync(folderMetaFilePath), 'should exists');

                rm(dirPath);

                delay(function() {
                    done();
                    Assert.ok(!Fs.existsSync(folderMetaFilePath), 'should not exists');
                });
            });
        });

        // 再次建立文件夹以备下一个测试使用
        describe('create folder', function(){
            it('should create folder meta file', function(done){

                var folderMetaFilePath = dirPath + '.meta';

                Assert.ok(!Fs.existsSync(folderMetaFilePath), 'should not exists');

                Fs.mkdirSync(dirPath);

                delay(function() {
                    done();
                    Assert.ok(Fs.existsSync(folderMetaFilePath), 'should exists');
                });

            });
        });

        // 移动文件夹
        describe('move folder', function(){

            // 原有的 .meta 文件应该删除，并且建立新的 .meta 文件
            it('should delete old meta file and create new meta file', function(done){
                
                var newDirName = 'newbar';
                var newDirPath = Path.join(assetsDir, newDirName);

                var folderMetaFilePath = dirPath + '.meta';
                var newFolderMetaFilePath = newDirPath + '.meta';

                Assert.ok(Fs.existsSync(folderMetaFilePath), 'should exists');
                Assert.ok(!Fs.existsSync(newFolderMetaFilePath), 'should not exists');
            
                Fs.renameSync(dirPath, newDirPath);

                delay(function() {
                    done();
                    Assert.ok(!Fs.existsSync(folderMetaFilePath), 'should not exists');
                    Assert.ok(Fs.existsSync(newFolderMetaFilePath), 'should exists');
                });

            });
        });

        // 再次新建文件以备下一个测试
        describe('create new file', function(){

            it('should add a new pathToUuid item in AssetDB', function(done){
                
                var pathToUuid = AssetDB.pathToUuid();
                info("PathToUuid: ↓↓↓");
                pprint(pathToUuid);

                filePath = filePath + 'new';

                Assert.ok(!pathToUuid[filePath], 'before create file no info in PathToUuid');

                info('create file: ' + fileName);
                Fs.writeFileSync(filePath, 'something');

                delay(function() {
                    done();
                    pathToUuid = AssetDB.pathToUuid();
                    info("PathToUuid: ↓↓↓");
                    pprint(pathToUuid);
                    Assert.ok(pathToUuid[filePath], 'after create file filePath in PathToUuid');
                });
                
            });

        });

        // 删除已经存在的 .meta 文件
        describe('delete exists meta file', function(){

            // 会重建 .meta 文件，并且 uuid 保持不变
            it('should recreate the meta file with same uuid', function(done){
                
                var metaFilePath = filePath + '.meta';
                var uuid = JSON.parse(Fs.readFileSync(metaFilePath)).uuid;

                console.log('metaFilePath', metaFilePath);
                console.log('uuid', uuid);

                Fs.unlinkSync(metaFilePath);

                delay(function() {
                    done();
                    Assert.ok(Fs.existsSync(metaFilePath), 'should exists');
                    var newUuid = JSON.parse(Fs.readFileSync(metaFilePath)).uuid;
                    Assert.equal(newUuid, uuid, 'should equal');
                });

            });
        });

        // 移动已经存在的 .meta 文件
        describe('move exists meta file', function(){

            // 原有的 .meta 文件会被重建，并且 uuid 相同，新的 .meta 文件会被删除
            it('should recreate the old meta file and delete the new meta file', function(done){

                var metaFilePath = filePath + '.meta';
                var newMetaFileName = 'newsinglefoo.meta';
                var newMetaFilePath = Path.join(assetsDir, newMetaFileName);

                var uuid = JSON.parse(Fs.readFileSync(metaFilePath)).uuid;

                Fs.writeFileSync(newMetaFileName, Fs.readFileSync(metaFilePath));
                rm(metaFilePath);

                delay(function() {
                    done();
                    Assert.ok(Fs.existsSync(metaFilePath), 'should exists');
                    Assert.ok(!Fs.existsSync(newMetaFilePath), 'should not exists');
                    var newUuid = JSON.parse(Fs.readFileSync(metaFilePath)).uuid;
                    Assert.equal(newUuid, uuid, 'should equal');
                });
            });
        });

        // 创建单独的 .meta 文件
        describe('create single meta file', function(){

            // 创建单独的 .meta 文件，会被删掉
            it('should not exists single meta file', function(done){
                
                var singleMetaFileName = 'single.meta';
                var singleMetaFilePath = Path.join(assetsDir, singleMetaFileName);

                Fs.writeFileSync(singleMetaFilePath, 'single meta');

                delay(function() {
                    done();
                    Assert.ok(!Fs.existsSync(singleMetaFilePath), 'should not exists');
                });
            });
        });

        // 测试 watch 与 unwatch 的效率
        describe('watcher open and close performance', function(){

            // 开启关闭 watcher 10000 次
            it('should watch and unwatch 10000 times', function(){
                console.time('watcher');
                for (var i = 0; i < 10000; i++) {
                    AssetDB.watch();
                    AssetDB.unwatch();
                }
                console.timeEnd('watcher');
            });

        });

    });
});
