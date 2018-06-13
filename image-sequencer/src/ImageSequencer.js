if (typeof window !== 'undefined') {isBrowser = true}
else {var isBrowser = false}
require('./util/getStep.js')

ImageSequencer = function ImageSequencer(options) {

  var sequencer = (this.name == "ImageSequencer")?this:this.sequencer;
  options = options || {};
  options.inBrowser = options.inBrowser || isBrowser;
  options.sequencerCounter = 0;

  function objTypeOf(object){
    return Object.prototype.toString.call(object).split(" ")[1].slice(0,-1)
  }

  function log(color,msg) {
    if(options.ui!="none") {
      if(arguments.length==1) console.log(arguments[0]);
      else if(arguments.length==2) console.log(color,msg);
    }
  }

  function copy(a) {
    if (!typeof(a) == "object") return a;
    if (objTypeOf(a) == "Array") return a.slice();
    if (objTypeOf(a) == "Object") {
      var b = {};
      for (var v in a) {
        b[v] = copy(a[v]);
      }
      return b;
    }
    return a;
  }

  function makeArray(input) {
    return (objTypeOf(input)=="Array")?input:[input];
  }

  var image,
  steps = [],
  modules = require('./Modules'),
  formatInput = require('./FormatInput'),
  images = {},
  inputlog = [],
  events = require('./ui/UserInterface')(),
  fs = require('fs');

  // if in browser, prompt for an image
  // if (options.imageSelect || options.inBrowser) addStep('image-select');
  // else if (options.imageUrl) loadImage(imageUrl);

  function addSteps(){
    var this_ = (this.name == "ImageSequencer")?this:this.sequencer;
    var args = (this.name == "ImageSequencer")?[]:[this.images];
    var json_q = {};
    for(var arg in arguments){args.push(copy(arguments[arg]));}
    json_q = formatInput.call(this_,args,"+");

    inputlog.push({method:"addSteps", json_q:copy(json_q)});

    for (var i in json_q)
    for (var j in json_q[i])
    require("./AddStep")(this_,i,json_q[i][j].name,json_q[i][j].o);

    return this;
  }

  function removeStep(image,index) {
    //remove the step from images[image].steps and redraw remaining images
    if(index>0) {
      thisStep = images[image].steps[index];
      thisStep.UI.onRemove(thisStep.options.step);
      images[image].steps.splice(index,1);
    }
    //tell the UI a step has been removed
  }

  function removeSteps(image,index) {
    var run = {}, indices;
    var this_ = (this.name == "ImageSequencer")?this:this.sequencer;
    var args = (this.name == "ImageSequencer")?[]:[this.images];
    for(var arg in arguments) args.push(copy(arguments[arg]));

    var json_q = formatInput.call(this_,args,"-");
    inputlog.push({method:"removeSteps", json_q:copy(json_q)});

    for (var img in json_q) {
      indices = json_q[img].sort(function(a,b){return b-a});
      run[img] = indices[indices.length-1];
      for (var i in indices)
      removeStep(img,indices[i]);
    }
    // this.run(run); // This is creating problems
    return this;
  }

  function insertSteps(image, index, name, o) {
    var run = {};
    var this_ = (this.name == "ImageSequencer")?this:this.sequencer;
    var args = (this.name == "ImageSequencer")?[]:[this.images];
    for (var arg in arguments) args.push(arguments[arg]);

    var json_q = formatInput.call(this_,args,"^");
    inputlog.push({method:"insertSteps", json_q:copy(json_q)});

    for (var img in json_q) {
      var details = json_q[img];
      details = details.sort(function(a,b){return b.index-a.index});
      for (var i in details)
      require("./InsertStep")(this_,img,details[i].index,details[i].name,details[i].o);
      run[img] = details[details.length-1].index;
    }
    // this.run(run); // This is Creating issues
    return this;
  }

  // Config is an object which contains the runtime configuration like progress bar
  // information and index from which the sequencer should run
  function run(config,t_image,t_from) {
    let progressObj,index=0;
    config = config || {mode: 'no-arg'};
    if(config.index) index = config.index;

    if(config.mode != 'test'){
      if(config.mode != "no-arg" && typeof config != 'function'){
        if(config.progressObj) progressObj = config.progressObj;
        delete arguments['0'];
      }
    }
    else{
      arguments['0'] = config.mode;
    }

    var this_ = (this.name == "ImageSequencer")?this:this.sequencer;
    var args = (this.name == "ImageSequencer")?[]:[this.images];
    for (var arg in arguments) args.push(copy(arguments[arg]));

    var callback = function() {};
    for (var arg in args)
    if(objTypeOf(args[arg]) == "Function")
    callback = args.splice(arg,1)[0];

    var json_q = formatInput.call(this_,args,"r");

    require('./Run')(this_, json_q, callback,index,progressObj);

    return true;
  }

  function loadImages() {
    var args = [];
    var sequencer = this;
    for (var arg in arguments) args.push(copy(arguments[arg]));
    var json_q = formatInput.call(this,args,"l");

    inputlog.push({method:"loadImages", json_q:copy(json_q)});
    var loadedimages = this.copy(json_q.loadedimages);

    var ret = {
      name: "ImageSequencer Wrapper",
      sequencer: this,
      addSteps: this.addSteps,
      removeSteps: this.removeSteps,
      insertSteps: this.insertSteps,
      run: this.run,
      UI: this.UI,
      setUI: this.setUI,
      images: loadedimages
    };

    function load(i) {
      if(i==loadedimages.length) {
        json_q.callback.call(ret);
        return;
      }
      var img = loadedimages[i];
      require('./ui/LoadImage')(sequencer,img,json_q.images[img],function(){
        load(++i);
      });
    }

    load(0);
  }

  function replaceImage(selector,steps,options) {
    options = options || {};
    options.callback = options.callback || function() {};
    return require('./ReplaceImage')(this,selector,steps,options);
  }

  function setUI(UI) {
    this.events = require('./ui/UserInterface')(UI);
  }

  var exportBin = function(dir,basic) {
    return require('./ExportBin')(dir,this,basic);
  }

  function modulesInfo(name) {
    var modulesdata = {}
    if(name == "load-image") return {};
    if(arguments.length==0)
    for (var modulename in modules) {
      modulesdata[modulename] = modules[modulename][1];
    }
    else modulesdata = modules[name][1];
    return modulesdata;
  }

  // Strigifies the current sequence
  function toString(step) {
    if(step) {
      return stepToString(step);
    } else {
      return copy(this.images.image1.steps).map(stepToString).slice(1).join(',');
    }
  }

  // Stringifies one step of the sequence
  function stepToString(step) {
    let inputs = copy(modulesInfo(step.options.name).inputs);
    inputs = inputs || {};

    for(let input in inputs) {
      inputs[input] = step.options[input] || inputs[input].default;
      inputs[input] = encodeURIComponent(inputs[input]);
    }

    var configurations = Object.keys(inputs).map(key => key + ':' + inputs[key]).join('|');
    return `${step.options.name}(${configurations})`;
  }

  // exports the current sequence as an array of JSON steps
  function toJSON(str){
    return this.stringToJSON(this.toString());
  }

  // Coverts stringified sequence into an array of JSON steps
  function stringToJSON(str){
    let steps = str.split(',');
    return steps.map(stringToJSONstep);
  }

  // Converts one stringified step into JSON
  function stringToJSONstep(str){
    if(str.indexOf('(') === -1) { // if there are no settings specified
      var moduleName = str.substr(0);
      stepSettings = "";
    } else {
      var moduleName = str.substr(0, str.indexOf('('));
      stepSettings = str.slice(str.indexOf('(') + 1, -1);
    }

    stepSettings = stepSettings.split('|').reduce(function formatSettings(accumulator, current, i){
      var settingName = current.substr(0, current.indexOf(':')),
      settingValue = current.substr(current.indexOf(':') + 1);
      settingValue = settingValue.replace(/^\(/, '').replace(/\)$/, ''); // strip () at start/end
      settingValue = decodeURIComponent(settingValue);
      current = [
        settingName,
        settingValue
      ];
      if (!!settingName) accumulator[settingName] = settingValue;
      return accumulator;
    }, {});

    return {
      name : moduleName,
      options: stepSettings
    }
  }

  // imports a string into the sequencer steps
  function importString(str){
    let sequencer = this;
    if(this.name != "ImageSequencer")
    sequencer = this.sequencer;
    var stepsFromString = stringToJSON(str);
    stepsFromString.forEach(function eachStep(stepObj) {
      sequencer.addSteps(stepObj.name,stepObj.options);
    });
  }

  // imports a array of JSON steps into the sequencer steps
  function importJSON(obj){
    let sequencer = this;
    if(this.name != "ImageSequencer")
    sequencer = this.sequencer;
    obj.forEach(function eachStep(stepObj) {
      sequencer.addSteps(stepObj.name,stepObj.options);
    });
  }

  return {
    //literals and objects
    name: "ImageSequencer",
    options: options,
    inputlog: inputlog,
    modules: modules,
    images: images,
    events: events,

    //user functions
    loadImages: loadImages,
    loadImage: loadImages,
    addSteps: addSteps,
    removeSteps: removeSteps,
    insertSteps: insertSteps,
    replaceImage: replaceImage,
    run: run,
    setUI: setUI,
    exportBin: exportBin,
    modulesInfo: modulesInfo,
    toString: toString,
    stepToString: stepToString,
    toJSON: toJSON,
    stringToJSON: stringToJSON,
    stringToJSONstep: stringToJSONstep,
    importString: importString,
    importJSON: importJSON,

    //other functions
    log: log,
    objTypeOf: objTypeOf,
    copy: copy,

    setInputStep: require('./ui/SetInputStep')(sequencer)
  }

}
module.exports = ImageSequencer;
