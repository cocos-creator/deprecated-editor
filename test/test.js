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

var EditorAppRecvEvent = [];

EditorApp = {};
EditorApp.fire = function (event, args) {
    // console.log("fire event: ", event);
    // console.log("with args: ", args);
    EditorAppRecvEvent.push(event+':'+args.url);
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

    // 测试 AssetDB.update() 
    describe('Test AssetDB.update()', function(){

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

            // 创建基本的测试文件
            Fs.mkdirSync(Path.join(assetsDir, 'd1'));
            Fs.writeFileSync(Path.join(assetsDir, 'f1.bin'), 'whatever');
            Fs.writeFileSync(Path.join(assetsDir, 'd1', 'f2.bin'), 'whatever');

            // 初始化 AssetDB
            AssetDB.testInit(projectDir);
            AssetDB.refresh();
        });

        // 全部测试结束调用
        after(function(){
        });

        beforeEach(function(done){
            delay(function() {
                done();
            });
        });

        afterEach(function(done){
            delay(function() {
                done();
            });
        });

        var pathToUuid;

        // 测试 update 
        describe('update AssetDB', function(){

            // 
            it('should update AssetDB with events', function(done){
                
                pathToUuid = AssetDB.pathToUuid();
                info("PathToUuid: ↓↓↓");
                pprint(pathToUuid);

                Assert.ok(!!pathToUuid[Path.join(assetsDir, 'f1.bin')], 'should have');
                Assert.ok(!!pathToUuid[Path.join(assetsDir, 'd1', 'f2.bin')], 'should have');

                // 新建文件夹
                Fs.mkdirSync(Path.join(assetsDir, 'd2'));

                // 删除文件夹
                rm(Path.join(assetsDir, 'd1'));

                // 新建文件
                Fs.writeFileSync(Path.join(assetsDir, 'f3.bin'), 'whatever');

                // 删除文件
                rm(Path.join(assetsDir, 'f1.bin'));

                // update
                AssetDB.update();

                delay(function() {
                    done();

                    pathToUuid = AssetDB.pathToUuid();
                    info("PathToUuid: ↓↓↓");
                    pprint(pathToUuid);

                    Assert.ok(!!pathToUuid[Path.join(assetsDir, 'f3.bin')], 'should have');
                    Assert.ok(!pathToUuid[Path.join(assetsDir, 'f1.bin')], 'should not have');
                    Assert.ok(!pathToUuid[Path.join(assetsDir, 'd1', 'f2.bin')], 'should not have');

                    // 检查事件触发
                    var evt = 'folderCreated:'+AssetDB.fspathToUrl(Path.join(assetsDir, 'd2'));
                    Assert.ok(EditorAppRecvEvent.indexOf(evt) >= 0, 'should in');

                    evt = 'assetDeleted:'+AssetDB.fspathToUrl(Path.join(assetsDir, 'd1'));
                    Assert.ok(EditorAppRecvEvent.indexOf(evt) >= 0, 'should in');

                    evt = 'assetCreated:'+AssetDB.fspathToUrl(Path.join(assetsDir, 'f3.bin'));
                    Assert.ok(EditorAppRecvEvent.indexOf(evt) >= 0, 'should in');

                    evt = 'assetDeleted:'+AssetDB.fspathToUrl(Path.join(assetsDir, 'f1.bin'));
                    Assert.ok(EditorAppRecvEvent.indexOf(evt) >= 0, 'should in');
                });
            });
        });
    });

    // 测试 AssetDB.update() 耗时
    describe('Profile AssetDB.update() ', function(){

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

            AssetDB.refresh();
        });

        // 全部测试结束调用
        after(function(){
        });

        beforeEach(function(){
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
        });

        afterEach(function(){
            // 删除测试项目文件夹
            if (Fs.existsSync(projectDir)) {
                info("test project dir exists");
                info("rm test project dir");
                rm(projectDir);
            }
        });

        it('update AssetDB with 10 folders and 10 files', function(){
            var i;
            for (i = 1; i <= 10; i++) {
                Fs.mkdirSync(Path.join(assetsDir, 'd'+i));
                Fs.writeFileSync(Path.join(assetsDir, 'f'+i+'.bin'), 'whatever');
            }

            console.time('AssetDB.update');
            AssetDB.update();
            console.timeEnd('AssetDB.update');

            Assert.ok(true, 'over');
        });

        it('update AssetDB with 100 folders and 100 files', function(){
            var i;
            for (i = 1; i <= 100; i++) {
                Fs.mkdirSync(Path.join(assetsDir, 'd'+i));
                Fs.writeFileSync(Path.join(assetsDir, 'f'+i+'.bin'), 'whatever');
            }

            console.time('AssetDB.update');
            AssetDB.update();
            console.timeEnd('AssetDB.update');

            Assert.ok(true, 'over');
        });

        it('update AssetDB with 1000 folders and 1000 files', function(){
            var i;
            for (i = 1; i <= 1000; i++) {
                Fs.mkdirSync(Path.join(assetsDir, 'd'+i));
                Fs.writeFileSync(Path.join(assetsDir, 'f'+i+'.bin'), 'whatever');
            }

            console.time('AssetDB.update');
            AssetDB.update();
            console.timeEnd('AssetDB.update');

            Assert.ok(true, 'over');
        }); 
    });
});
